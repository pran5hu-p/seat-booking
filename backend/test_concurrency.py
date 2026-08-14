"""
Independent concurrency test for the seat booking system.

What this proves: fires several booking requests for the SAME seat(s) at
nearly the same instant, and asserts exactly one succeeds (201) while every
other one is rejected cleanly (409) - never a double-booking, never a
generic 500, never a partial multi-seat booking.

Usage:
    1. Make sure your backend is running:
       cd backend
       venv\\Scripts\\Activate.ps1
       uvicorn app.main:app --reload --port 8000

    2. In a separate terminal, from the project root:
       pip install httpx --break-system-packages   (if not already installed)
       python test_concurrency.py

    3. Read the output. It creates its own fresh event so it never touches
       real data, and prints a clear PASS/FAIL summary at the end.
"""

import asyncio
import sys
from datetime import datetime, timedelta

import httpx

BASE_URL = "http://localhost:8000"
CONCURRENT_REQUESTS = 8  # how many requests race for the same seat(s)


async def create_test_event(client: httpx.AsyncClient) -> dict:
    """Create a small throwaway event to test against."""
    resp = await client.post(
        f"{BASE_URL}/admin/events",
        json={
            "name": f"Concurrency Test {datetime.utcnow().isoformat()}",
            "event_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "rows": 2,
            "seats_per_row": 3,
        },
    )
    resp.raise_for_status()
    return resp.json()


async def get_seat_ids(client: httpx.AsyncClient, event_id: int) -> list[int]:
    resp = await client.get(f"{BASE_URL}/events/{event_id}")
    resp.raise_for_status()
    return [seat["id"] for seat in resp.json()["seats"]]


async def attempt_booking(
    client: httpx.AsyncClient, event_id: int, seat_ids: list[int], booker_num: int
) -> dict:
    """One booking attempt. Returns a small result dict, never raises."""
    try:
        resp = await client.post(
            f"{BASE_URL}/events/{event_id}/book",
            json={
                "seat_ids": seat_ids,
                "booker_name": f"Test Booker {booker_num}",
                "booker_email": f"booker{booker_num}@test.com",
            },
        )
        return {"booker": booker_num, "status": resp.status_code, "body": resp.json()}
    except Exception as exc:  # noqa: BLE001 - want to see any client-side failure too
        return {"booker": booker_num, "status": None, "error": str(exc)}


async def run_single_seat_test(client: httpx.AsyncClient) -> bool:
    print(f"\n{'=' * 60}")
    print(f"TEST 1: {CONCURRENT_REQUESTS} simultaneous requests for ONE seat")
    print("=" * 60)

    event = await create_test_event(client)
    event_id = event["id"]
    seat_ids = await get_seat_ids(client, event_id)
    target_seat = [seat_ids[0]]  # everyone fights over the exact same seat

    print(f"Event id: {event_id}, target seat id: {target_seat[0]}")
    print(f"Firing {CONCURRENT_REQUESTS} requests at once...")

    tasks = [
        attempt_booking(client, event_id, target_seat, i)
        for i in range(CONCURRENT_REQUESTS)
    ]
    results = await asyncio.gather(*tasks)

    successes = [r for r in results if r["status"] == 201]
    conflicts = [r for r in results if r["status"] == 409]
    other = [r for r in results if r["status"] not in (201, 409)]

    print(f"  201 (success):  {len(successes)}")
    print(f"  409 (conflict): {len(conflicts)}")
    print(f"  other/errors:   {len(other)}")

    if other:
        print("  Unexpected results:")
        for r in other:
            print(f"    {r}")

    passed = len(successes) == 1 and len(conflicts) == CONCURRENT_REQUESTS - 1 and not other
    print(f"\n  RESULT: {'PASS' if passed else 'FAIL'} — expected exactly 1 success and "
          f"{CONCURRENT_REQUESTS - 1} conflicts, got {len(successes)} success(es) "
          f"and {len(conflicts)} conflict(s).")
    return passed


async def run_multi_seat_atomicity_test(client: httpx.AsyncClient) -> bool:
    print(f"\n{'=' * 60}")
    print("TEST 2: multi-seat atomicity (all-or-nothing)")
    print("=" * 60)

    event = await create_test_event(client)
    event_id = event["id"]
    seat_ids = await get_seat_ids(client, event_id)

    # Booker A locks in seat[0] alone first, successfully.
    setup = await attempt_booking(client, event_id, [seat_ids[0]], booker_num=999)
    if setup["status"] != 201:
        print(f"  Setup booking failed unexpectedly: {setup}")
        return False
    print(f"  Pre-booked seat id {seat_ids[0]} to set up the conflict.")

    # Booker B tries to book THREE seats: two free ones + the one that's taken.
    # Correct behavior: the whole request fails, none of the 3 seats get booked.
    attempt_seats = seat_ids[0:3]
    print(f"  Now requesting seats {attempt_seats} (1 already taken, 2 free)...")
    result = await attempt_booking(client, event_id, attempt_seats, booker_num=1000)

    print(f"  Status: {result['status']}")
    print(f"  Body: {result.get('body') or result.get('error')}")

    # Verify: the two "free" seats must STILL be free — not partially booked.
    resp = await client.get(f"{BASE_URL}/events/{event_id}")
    seat_map = {s["id"]: s["status"] for s in resp.json()["seats"]}
    free_seat_ids = attempt_seats[1:3]
    still_available = all(seat_map[sid] == "available" for sid in free_seat_ids)

    passed = result["status"] == 409 and still_available
    print(f"  Free seats still available after failed multi-seat request: {still_available}")
    print(f"\n  RESULT: {'PASS' if passed else 'FAIL'} — expected 409 and zero partial "
          f"booking, got status {result['status']}, still_available={still_available}.")
    return passed


async def main() -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            await client.get(f"{BASE_URL}/health")
        except Exception:
            print(f"Could not reach {BASE_URL}/health — is uvicorn running?")
            sys.exit(1)

        test1_passed = await run_single_seat_test(client)
        test2_passed = await run_multi_seat_atomicity_test(client)

        print(f"\n{'=' * 60}")
        print("SUMMARY")
        print("=" * 60)
        print(f"  Test 1 (single-seat race):        {'PASS' if test1_passed else 'FAIL'}")
        print(f"  Test 2 (multi-seat atomicity):    {'PASS' if test2_passed else 'FAIL'}")

        if test1_passed and test2_passed:
            print("\n  Both tests passed. Concurrency handling is correct.")
        else:
            print("\n  At least one test FAILED. Do not submit yet — review the "
                  "booking repository's locking logic before proceeding.")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())