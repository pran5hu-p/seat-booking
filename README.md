# Event Seat Booking System

A full-stack seat booking application: an admin configures an event's seating layout, and users can view, select, and book available seats — with database-level safeguards against double-booking.

**Live demo:** https://seat-booking-eta.vercel.app
**Live API:** https://seat-booking-production.up.railway.app/docs
**Repository:** https://github.com/pran5hu-p/seat-booking

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), JavaScript, Tailwind CSS, Zustand, React Hook Form + Zod
- **Backend:** FastAPI (Python), SQLAlchemy, Alembic migrations
- **Database:** MySQL 8

---

## Architecture Overview

Both frontend and backend follow a **feature-driven structure**: each feature (events, seats, bookings, admin) owns its own routers/services/repositories (backend) or components/hooks/services/store (frontend), rather than organizing by technical layer alone.

```
backend/app/
  core/               # config, database session, exception handling
  shared/             # base model, shared utilities
  features/
    events/           # event CRUD, seat generation, public seat map
    seats/            # seat status derivation, admin block/unblock queries
    bookings/         # the booking endpoint — see Concurrency section below
    admin/            # dashboard, composes the other features

frontend/
  app/                # Next.js routes (public + /admin)
  features/           # events, booking, admin — each with its own store/hooks/services
  ui/seat-grid/        # shared, caller-configurable seat grid component
  lib/                # API client, constants, utils
```

Backend routers stay thin (request/response only); business logic lives in services; database queries and transactions live in repositories. On the frontend, all network calls go through a single API client returning a `{ok, data}` / `{ok, error}` result shape rather than throwing, and cross-cutting UI state (selections, polling freshness, apply-flow status) lives in Zustand, not scattered local component state.

---

## Data Model

```sql
events (id, name, event_date, rows, seats_per_row, created_at)

seats (id, event_id FK, row_label, seat_number, is_blocked,
       UNIQUE(event_id, row_label, seat_number))

booking_groups (id, event_id FK, booker_name, booker_email, created_at)

bookings (id, booking_group_id FK, seat_id FK, created_at,
          UNIQUE(seat_id))
```

**Design decisions:**

- **Rows × seats-per-row, not named sections.** Simpler to model and to auto-generate on event creation; row labels use an Excel-style scheme (A, B, ... Z, AA, AB, ...) so venues with more than 26 rows are handled correctly.
- **A seat's status is derived, not stored.** There's no `status` column on `seats`. A seat is `blocked` if `is_blocked = true`, `booked` if a row exists in `bookings` for it, else `available`. This avoids the two sources of truth staying in sync as a manual responsibility — it's computed fresh from `is_blocked` and a join against `bookings` on every read.
- **`booking_groups` + `bookings`, not a single table.** One booking can cover multiple seats (a group purchase). `booking_groups` holds the booker's identity and timestamp once; `bookings` links each individual seat to that group. This is also what makes the atomic multi-seat requirement straightforward — one group, N linked seat rows, inserted together or not at all.
- **`UNIQUE(seat_id)` on `bookings`.** This is the single most important constraint in the schema — see Concurrency below.

---

## Concurrency & Data Integrity

This was the primary focus of the project, per the assignment's own weighting.

### The requirement

Two booking requests for the same seat arriving at nearly the same instant must result in **exactly one success and one clean rejection** — never both succeeding, never a silent overwrite, and a multi-seat request must be **all-or-nothing**: if even one of the requested seats is unavailable, none of them get booked.

### The approach: row-level locking inside a transaction

`POST /events/{event_id}/book`, implemented in `backend/app/features/bookings/repository.py`:

1. **Deduplicate and sort** the requested seat IDs ascending.
2. Inside a single database transaction, **lock the target seat rows first**, before any availability check:
   ```sql
   SELECT id, row_label, seat_number, is_blocked
   FROM seats
   WHERE id IN (:seat_ids) AND event_id = :event_id
   ORDER BY id
   FOR UPDATE
   ```
3. **Only after the lock is held**, check: do all requested seats exist for this event (404 if not), are any blocked (409 if so), does any already have a row in `bookings` (409 if so) — the booked-check happens after the lock is acquired, not before, which is what actually prevents the race.
4. **Any check failing rolls back the entire transaction.** Nothing is inserted, even for a 3-seat request where only 1 seat is the problem.
5. If every check passes, one `booking_groups` row and one `bookings` row per seat are inserted, then the transaction commits.
6. A backstop: the `UNIQUE(seat_id)` constraint means that even if the lock/check logic were ever bypassed, MySQL itself would reject a duplicate insert with an `IntegrityError`, which is caught and converted to a `409` rather than surfacing as an unhandled `500`.

### Why sorting the lock order matters

If two overlapping multi-seat requests locked rows in different orders (Request A locks seat 3 then waits for seat 7; Request B locks seat 7 then waits for seat 3), that's a classic deadlock. Sorting every request's seat IDs ascending before locking guarantees all requests acquire locks in the same order, so they can only ever queue behind each other — never circularly wait.

### Why the lock happens before the check, not after

A "check availability, then insert" approach without a lock is a textbook race condition: two requests can both read "seat is available" before either has inserted anything, and both proceed to insert — resulting in a double-booking that a purely application-level check cannot prevent. Locking the seat rows first means a second concurrent request's lock acquisition genuinely blocks at the database level until the first transaction commits or rolls back; by the time it proceeds, it will correctly see the first transaction's outcome.

### Verification

`test_concurrency.py` in the repo root is an independent test script (not part of the app itself) that:

- Fires 8 simultaneous booking requests at the same seat and asserts exactly 1 succeeds with `201`, the other 7 receive `409`.
- Pre-books one seat in a 3-seat group, then requests all 3 seats together, and asserts the entire request is rejected with `409` while the two genuinely-free seats remain available afterward (proving atomicity, not partial booking).

Run it with:
```bash
pip install httpx
python test_concurrency.py
```
(edit `BASE_URL` at the top of the script to point at localhost or the live Railway URL)

Both tests pass against both the local development database and the live deployed backend.

---

## Setup — Local Development

### Prerequisites
- Python 3.10+
- Node.js 18.18+
- MySQL 8 (local install, or point at a hosted instance)

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# edit .env — set DATABASE_URL to your MySQL connection string,
# e.g. mysql+pymysql://root:yourpassword@localhost:3306/seat_booking

mysql -u root -p -e "CREATE DATABASE seat_booking;"
alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the interactive API documentation.

### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Visit `http://localhost:3000`.

---

## API Overview

Full interactive documentation at `/docs` (Swagger UI). Summary:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/admin/events` | Create an event; auto-generates its seats |
| `GET` | `/admin/events` | List events with seat counts |
| `GET` | `/admin/events/{id}/dashboard` | Counts + booking list for one event |
| `POST` | `/admin/events/{id}/seats/block` | Block seats (idempotent) |
| `POST` | `/admin/events/{id}/seats/unblock` | Unblock seats (idempotent) |
| `GET` | `/events` | Public event list |
| `GET` | `/events/{id}` | Event detail + full seat map with derived status |
| `POST` | `/events/{id}/book` | Book one or more seats — see Concurrency above |

No authentication on the admin side, per the assignment's scope — a dedicated `/admin` route is used instead of a login flow.

---

## Deployment

- **Database:** MySQL hosted on Railway
- **Backend:** FastAPI on Railway, connected to the above database over Railway's private network
- **Frontend:** Next.js on Vercel

Environment variables used in production:

**Backend:**
```
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/<database>
CORS_ORIGINS=https://seat-booking-eta.vercel.app,http://localhost:3000
```

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://seat-booking-production.up.railway.app
```

Migrations are run via `alembic upgrade head` against the production database as part of setup; the backend's start command can also be configured to run this automatically on every deploy (`alembic upgrade head && uvicorn ...`), since it is a no-op when already up to date.

---

## Known Limitations & Trade-offs

- **No authentication on the admin side.** In scope for this assignment (a dedicated `/admin` route rather than a login flow), but a real production system would need this.
- **State updates via polling (every ~7s) and refetch-on-focus, not WebSockets.** Explicitly acceptable per the assignment's requirements; a production system with high booking volume would likely want push-based updates instead.
- **Free-tier hosting cold starts.** The Railway backend may take a few seconds to respond on the very first request after a period of inactivity — this is a hosting-tier characteristic, not an application issue.
- **Bonus features not implemented:** booking cancellation, seat price tiers, and booking confirmation emails were left out of scope to prioritize the core requirements and the concurrency correctness they're weighted most heavily on.
