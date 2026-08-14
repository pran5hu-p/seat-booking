# Event Seat Booking System

Full-stack seat booking app: admin configures an event's seating layout, users view/select/book seats, with database-level protection against double-booking.

**Live demo:** https://seat-booking-eta.vercel.app
**Live API docs:** https://seat-booking-production.up.railway.app/docs
**Repo:** https://github.com/pran5hu-p/seat-booking

## Stack

Next.js 15 (App Router, JS, Tailwind, Zustand, React Hook Form + Zod) · FastAPI · MySQL 8 · SQLAlchemy + Alembic

## Architecture

Feature-driven on both sides. Backend: routers (thin) → services (business logic) → repositories (queries/transactions). Frontend: each feature owns its own components/hooks/services/store; a shared `ui/seat-grid` component is reused by both the public booking view and the admin block/unblock view via caller-supplied `isDisabled`/`isActive` predicates.

## Schema

```sql
events (id, name, event_date, rows, seats_per_row)
seats (id, event_id FK, row_label, seat_number, is_blocked,
       UNIQUE(event_id, row_label, seat_number))
booking_groups (id, event_id FK, booker_name, booker_email)
bookings (id, booking_group_id FK, seat_id FK,
          UNIQUE(seat_id))
```

**Key decisions:**
- Rows × seats-per-row layout, not named sections — simpler to auto-generate; row labels use Excel-style A..Z, AA, AB... so venues over 26 rows work correctly.
- Seat status (`available`/`booked`/`blocked`) is **derived**, not stored — computed from `is_blocked` plus whether a `bookings` row exists for that seat. One source of truth, not two kept in sync manually.
- `booking_groups` + `bookings` (not one table) supports multi-seat group bookings: one group, N linked seat rows, inserted together.
- `UNIQUE(seat_id)` on `bookings` — the backstop behind the concurrency logic below.

## Concurrency (the core requirement)

`POST /events/{event_id}/book`, in `backend/app/features/bookings/repository.py`:

1. Dedupe + sort requested seat IDs ascending.
2. Inside one transaction, lock the target seats **first**: `SELECT ... WHERE id IN (...) FOR UPDATE`.
3. **Only after the lock is held**, check the seats exist, aren't blocked, and aren't already booked.
4. Any check failing → rollback, `409`, nothing inserted (all-or-nothing, even for multi-seat requests).
5. All checks pass → insert `booking_groups` + `bookings` rows, commit.
6. `UNIQUE(seat_id)` + a caught `IntegrityError` is a backstop in case the lock logic is ever bypassed — converts to `409`, never a `500`.

**Why this works:** locking before checking is what actually prevents the race — a second concurrent request's lock acquisition blocks at the database level until the first transaction commits, so it always sees the correct up-to-date state before proceeding. Sorting seat IDs before locking prevents deadlocks between overlapping multi-seat requests (both always lock in the same order, so they queue instead of circularly waiting).

**Verified with `test_concurrency.py`** (repo root, independent of the app): 8 simultaneous requests for one seat → exactly 1 success, 7×409. A 3-seat request with 1 seat pre-taken → entire request rejected, the other 2 seats remain available. Passes against both local and the live deployed backend.

```bash
pip install httpx
python test_concurrency.py   # edit BASE_URL at the top for local vs. live
```

## Setup

**Backend**
```bash
cd backend
python -m venv venv && venv\Scripts\Activate.ps1   # or source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL
mysql -u root -p -e "CREATE DATABASE seat_booking;"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Docs at `http://localhost:8000/docs`.

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/events` | Create event, auto-generates seats |
| GET | `/admin/events` | List events with counts |
| GET | `/admin/events/{id}/dashboard` | Counts + booking list |
| POST | `/admin/events/{id}/seats/block` \| `/unblock` | Idempotent seat blocking |
| GET | `/events` | Public event list |
| GET | `/events/{id}` | Event + seat map with derived status |
| POST | `/events/{id}/book` | Book seats — see Concurrency above |

No auth on admin — a dedicated `/admin` route, per assignment scope.

## Deployment

MySQL + backend on Railway (private network between them), frontend on Vercel.

```
Backend:  DATABASE_URL=mysql+pymysql://...
          CORS_ORIGINS=https://seat-booking-eta.vercel.app,http://localhost:3000
Frontend: NEXT_PUBLIC_API_URL=https://seat-booking-production.up.railway.app
```

## Known Limitations

- No admin authentication (in scope per assignment)
- Seat map updates via polling (~7s) + refetch-on-focus, not WebSockets (explicitly acceptable per spec)
- Free-tier hosting cold starts possible on first request after idling
- Bonus features not implemented: cancellation, price tiers, confirmation emails — deprioritized in favor of the concurrency requirement