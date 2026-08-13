import asyncio
import httpx

# --- CONFIGURATION ---
EVENT_ID = 10
SEAT_ID = 78
# ---------------------

URL = f"http://localhost:8000/events/{EVENT_ID}/book"
CONCURRENT_REQUESTS = 6

async def make_booking(client, request_id):
    payload = {
        "booker_name": f"Test User {request_id}",
        "booker_email": f"test{request_id}@example.com",
        "seat_ids": [SEAT_ID]
    }
    
    response = await client.post(URL, json=payload)
    print(f"Request {request_id}: Status {response.status_code} - {response.text}")
    return response.status_code

async def main():
    print(f"Firing {CONCURRENT_REQUESTS} simultaneous booking requests for Event {EVENT_ID}, Seat {SEAT_ID}...")
    
    async with httpx.AsyncClient() as client:
        tasks = [make_booking(client, i) for i in range(CONCURRENT_REQUESTS)]
        results = await asyncio.gather(*tasks)

        successes = results.count(201)
        conflicts = results.count(409) + results.count(400)

        print("\n--- TEST RESULTS ---")
        print(f"Successful bookings (201): {successes} (Expected: 1)")
        print(f"Rejected bookings (400/409): {conflicts} (Expected: {CONCURRENT_REQUESTS - 1})")

        if successes == 1 and conflicts == CONCURRENT_REQUESTS - 1:
            print("\n✅ Concurrency test PASSED! Your row-level locks are working perfectly.")
        else:
            print("\n❌ Concurrency test FAILED. Race condition detected!")

if __name__ == "__main__":
    asyncio.run(main())