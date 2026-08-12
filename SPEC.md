# Build Spec: Event Seat Booking System
### (Phase-by-phase implementation order, follow in sequence)

Stack: Next.js (frontend), FastAPI (backend), MySQL (database). Follow the
phases below in order. Do not skip ahead to the frontend before the Phase 4
booking endpoint is complete and correct. The single most important
requirement in this project is race-condition-safe booking, detailed in
Phase 4. Do not deviate from the locking pattern specified there.

---

## Data Model (implement exactly this, adjust names only if trivially necessary)

```sql
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_date DATETIME NOT NULL,
    rows INT NOT NULL,
    seats_per_row INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    row_label VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event_seat (event_id, row_label, seat_number)
);

CREATE TABLE booking_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    booker_name VARCHAR(255) NOT NULL,
    booker_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_group_id INT NOT NULL,
    seat_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_group_id) REFERENCES booking_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id),
    UNIQUE KEY uniq_seat_booking (seat_id)
);
```

Notes:
- A seat's status (available / booked / blocked) is derived, not stored:
  blocked if seats.is_blocked = TRUE, booked if a row exists in bookings for
  that seat_id, else available.
- booking_groups represents one booking transaction by one person (possibly
  multiple seats). bookings links each individual seat to that group.
- The UNIQUE KEY uniq_seat_booking (seat_id) is the last-line-of-defense DB
  constraint. It must exist even though the primary correctness mechanism is
  the row lock in Phase 4.

---

## Phase 1: Backend project scaffold
- Set up FastAPI project in backend/ with SQLAlchemy and pydantic schemas,
  following the feature-driven structure in AGENTS.md
  (app/core/, app/features/<name>/router.py, service.py, repository.py,
  schemas.py, models.py).
- requirements.txt should include: fastapi, uvicorn, sqlalchemy, pymysql,
  python-dotenv, pydantic, alembic.
- Read DB connection string from DATABASE_URL env var, not hardcoded.
- Enable CORS middleware for http://localhost:3000, read allowed origins from
  CORS_ORIGINS env var.

## Phase 2: Event and seat creation (admin)
Implement:
- POST /admin/events - body: name, event_date, rows, seats_per_row. On
  creation, auto-generate all seats (row_label A, B, C... up to rows;
  seat_number 1..seats_per_row).
- GET /admin/events - list all events with basic counts.
- POST /admin/events/{event_id}/seats/block - body: seat_ids list. Sets
  is_blocked = TRUE. Idempotent.
- POST /admin/events/{event_id}/seats/unblock - inverse.
- GET /admin/events/{event_id}/dashboard - total seats, seats booked, seats
  blocked, seats available, and a list of individual bookings (seat label,
  booker name, booker email, timestamp), most recent first.

## Phase 3: Seat map (user-facing, read side)
Implement:
- GET /events - list of events for users to browse (id, name, date).
- GET /events/{event_id} - event details plus full seat map, every seat with
  derived status.

Keep this cheap: one query with a join, not N+1. It will be polled or
refetched-on-focus by the frontend.

## Phase 4: Booking endpoint (CRITICAL, read carefully)

POST /events/{event_id}/book
Body: seat_ids (list of int), booker_name (string), booker_email (string)

This must be race-condition-safe. Two requests for overlapping seats arriving
milliseconds apart must result in exactly one success and the other(s)
rejected with 409 Conflict. Never both succeeding, never a silent overwrite,
never a partial booking.

Required implementation pattern (do not substitute a weaker one):

1. Open a DB transaction.
2. Sort seat_ids ascending before locking (prevents deadlocks between
   overlapping multi-seat requests).
3. Inside the transaction:
   SELECT id, is_blocked FROM seats WHERE id IN (:seat_ids) AND event_id =
   :event_id FOR UPDATE;
4. Still inside the transaction, check: all seat IDs exist for this event
   (else 404); none are is_blocked = TRUE (else 409); none already have a row
   in bookings (checked after the lock is acquired, not before).
5. Any check fails: rollback, return 409 Conflict naming which seat(s) are
   unavailable. No partial insert.
6. All checks pass: insert one booking_groups row, then one bookings row per
   seat. Commit.
7. Return 201 Created with booking group id, booked seat labels, timestamp.

Do not implement this as "SELECT to check availability" followed by a
separate INSERT without a transaction and row lock. That is the exact race
condition this project is testing for, even if it passes casual manual
testing.

The UNIQUE(seat_id) constraint on bookings should also catch an integrity
error if this logic is ever bypassed. Catch that specific error and translate
it to 409 too, as a defense-in-depth backstop, not the primary mechanism.

Error handling for this endpoint:
- 404: event or seat doesn't exist.
- 409: seat already booked or blocked (be specific about which seat(s)).
- 422: validation errors (missing name/email, empty seat list).
- Never 500 for a normal "seat taken" case.

## Phase 5: Frontend scaffold
- Pages/routes: / (event list), /events/[id] (seat map plus booking),
  /admin (event list plus create form), /admin/events/[id] (dashboard plus
  seat blocking).
- Central API client in frontend/lib/api/, base URL from
  NEXT_PUBLIC_API_URL. No inline fetches or hardcoded localhost:8000 in
  components.

## Phase 6: Seat map component and booking flow
- CSS grid by row/column. Three visually distinct states: Available,
  Selected, Booked/Blocked (booked and blocked can share a style or use a
  subtle distinction, document the choice).
- Click available seat to select; click selected seat to deselect. Booked/
  blocked not clickable.
- Booking panel: selected seats plus name/email form (React Hook Form plus
  Zod) plus submit.
- On success: confirmation with seat labels and booking id, clear selection,
  refetch seat map. On 409: show which seat(s) were unavailable, refetch so
  the user sees current state.
- Poll GET /events/{id} every 5-10 seconds or refetch on window focus.
- Loading state on first load. Usable down to tablet width.

## Phase 7: Admin dashboard UI
- Create-event form (name, date, rows, seats per row), React Hook Form plus
  Zod.
- Dashboard: total/booked/available/blocked counts, table of bookings (seat,
  name, email, timestamp).
- Seat-blocking UI, can reuse the seat-grid component in a "click to toggle
  blocked" mode.

## Phase 8: Final checks
- .env.example exists for both frontend and backend (no real secrets
  committed).
- CORS works against the deployed frontend domain, not just localhost.
- Booking endpoint behavior matches Phase 4 exactly. This gets manually
  re-tested for concurrency.

---

## Do not do
- Do not implement seat availability checking purely in application code
  without a DB transaction plus row lock.
- Do not use a single in-process lock/mutex as a substitute for DB-level
  locking. It will not work across multiple server instances/workers.
- Do not skip the UNIQUE constraint on bookings.seat_id even though the lock
  is the primary mechanism.
- Do not return 200 OK for a failed booking attempt.
