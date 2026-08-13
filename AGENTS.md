# AGENTS.md

## Project
Event Seat Booking System
FastAPI (Python) backend, Next.js 15 App Router, Javascript, Tailwind CSS,
shadcn/ui, Zustand, React Hook Form, Zod, MySQL

## Goal
This repository must represent production-quality full-stack architecture, with
one hard constraint above all else: booking a seat must be race-condition-safe
at the database level. Everything else in this document matters. This one
doesn't bend.

## Priorities (highest to lowest)
1. Correctness and data integrity (concurrency safety, no double-booking)
2. Architecture
3. Scalability
4. Separation of concerns
5. Performance
6. Developer experience
7. UI

Never generate large monolithic files. Never trade priority 1 for anything lower
on this list. A well-architected booking endpoint that still races under load
has failed at the one thing this project is graded on.

---

## Non-Negotiable: Concurrency Correctness

Full spec lives in SPEC.md at the repo root. Read it in full, specifically
Phase 4, before touching the booking endpoint.

- POST /events/{event_id}/book must acquire a DB row lock (SELECT ... FOR
  UPDATE) on the target seats inside a transaction, check availability after
  the lock is held, then insert, all in the same transaction.
- Seat IDs must be locked in a consistent sorted order across every request to
  avoid deadlocks between overlapping multi-seat bookings.
- Multi-seat bookings are all-or-nothing. One unavailable seat fails the entire
  request. No partial booking, ever.
- A UNIQUE(seat_id) constraint on bookings exists as a second line of defense,
  not the primary mechanism.
- Never implement this as "check availability in code, then insert" without a
  transaction and lock. That is the exact race condition this project is
  evaluated on. If you catch yourself writing that pattern, stop and rewrite it
  before continuing to anything else.
- After implementing or touching this endpoint, say so explicitly and wait. It
  gets reviewed for concurrency correctness before any further phase begins.

---

## General Rules
- Feature-driven architecture, on both frontend and backend
- Javascript on frontend; full type hints on backend (pydantic and
  SQLAlchemy typed models)
- Functional React components only
- Prefer Server Components; Client Components only when required
- No prop drilling
- Reusable components and services
- Never duplicate logic
- Every feature owns its own UI, hooks, services/routers, types, and schemas
- All business logic lives outside components (frontend) and outside route
  handlers (backend). Routers/pages stay thin
- No inline fetches
- No inline validation
- No inline polling/timers
- No magic strings. Statuses (available / booked / blocked), roles, and API
  paths are named constants, not repeated string literals

---

## Tech Stack
Backend: FastAPI, SQLAlchemy, PyMySQL, Pydantic, Alembic (migrations), MySQL
Frontend: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zustand, React
Hook Form, Zod

---

## Repository Structure

```
seat-booking/
  AGENTS.md
  SPEC.md
  backend/
    app/
      main.py
      core/
        config.py
        database.py
        exceptions.py
      features/
        events/
          router.py
          service.py
          repository.py
          schemas.py
          models.py
        seats/
          router.py
          service.py
          repository.py
          schemas.py
        bookings/
          router.py
          service.py
          repository.py
          schemas.py
          models.py
        admin/
          router.py
          service.py
          schemas.py
      shared/
        base_model.py
        utils.py
    requirements.txt
    .env / .env.example

  frontend/
    app/
      (public)/
        page.tsx
        events/[id]/page.tsx
      admin/
        page.tsx
        events/[id]/page.tsx
      layout.tsx
      loading.tsx
      error.tsx
    features/
      events/
        components/
        hooks/
        services/
        types/
        constants/
        schemas/
        store/
      booking/
        components/
        hooks/
        services/
        types/
        constants/
        schemas/
        store/
      admin/
        components/
        hooks/
        services/
        types/
        constants/
        schemas/
        store/
    ui/
      seat-grid/
      forms/
      dialogs/
      loaders/
      navbar/
      badges/
    lib/
      api/
      utils/
      constants/
    providers/
    hooks/
    store/
    types/
    styles/
```

Backend features/* mirrors frontend features/* one to one: bookings (backend)
exists because booking (frontend) needs it, events maps to events, admin maps
to admin. Keep them aligned. If a feature gets added on one side, mirror it on
the other rather than bolting logic onto an unrelated existing feature.

---

## State Management
Global (Zustand), never Context for application state:
- Selected seats (current in-progress selection before booking)
- Booking flow state (submitting / success / conflict-error)
- Admin dashboard filters/state
- Seat map polling status (last-refreshed, stale/fresh)

Context is fine for pure DI (theme, providers), never for data that changes
based on user interaction or fetches.

## Forms
Always React Hook Form plus Zod. Applies to:
- Booking form (name, email)
- Admin create-event form (name, date, rows, seats per row)
- Seat-blocking confirmation, if it collects any input

Validation schemas live in each feature's schemas folder, shared between the
form and the API service call. Never re-validate manually inline in a
component.

## Server Components
Use whenever possible. Examples in this project:
- Event list page (/ and /admin)
- Static layout, nav
- Admin dashboard's initial data load (counts, booking list). Hydrate into a
  client component only for the interactive filter/sort bits, if any

## Client Components
Only when browser APIs or interactivity are required. Examples:
- Seat map grid (click-to-select)
- Booking confirmation panel (local pending/error state)
- Polling / refetch-on-focus hook for the seat map
- Any toast/dialog triggered by user action

---

## Backend Architecture Rules
- Router functions do request/response only. No query logic, no transaction
  handling directly in the router.
- Service layer holds business rules (e.g. "can these seats be booked").
- Repository layer holds the actual SQL/ORM calls, including the locking
  pattern for bookings. This isolation matters specifically so the
  concurrency-critical code is one small, reviewable file, not scattered
  across a router.
- Every endpoint returns typed pydantic response models. No raw dict returns.
- Errors map to proper HTTP codes via a shared exception handler in
  core/exceptions.py: 404 (not found), 409 (conflict, booked/blocked seat),
  422 (validation, handled by pydantic by default). Never 500 for an expected
  "seat taken" case, never 200 for a failed booking.

## Performance
- Dynamic imports / lazy load for anything not needed on first paint (e.g.
  admin seat-blocking mode, booking confirmation modal contents)
- Avoid unnecessary hydration. Keep the seat grid's static parts server-
  rendered where the interactivity allows it
- Memoize expensive re-renders (large seat grids re-rendering on every poll)

## Error Handling
Never crash the UI. Every async action (frontend service call) returns a
Result-style shape ({ ok: true, data } / { ok: false, error }) rather than
throwing past the call site. Gracefully handle:
- Seat conflict (409): show which seat(s) were taken, refetch seat map
- Network/API failure: retry affordance, no silent blank state
- Validation errors: inline field errors via Zod, not alerts
- Empty/loading states for seat map and dashboard

## Styling
- shadcn/ui plus Tailwind
- Consistent spacing scale, rounded cards
- Clear, distinct color coding for seat states (available / selected /
  booked-or-blocked). This must be unambiguous at a glance; it's an explicit
  grading criterion
- Responsive down to tablet width minimum

## Code Style
- Small files, single responsibility
- No file above roughly 250 lines. Split it before it gets there, don't wait
- Extract custom hooks, services, utilities, constants aggressively
- Naming:
  - useSomething() for hooks
  - SomethingService for backend service classes / frontend service modules
  - SomethingRepository for backend data-access layer
  - SomethingStore for Zustand stores
  - SomethingCard, SomethingGrid, SomethingDialog for components
  - SomethingSchema for Zod/pydantic schemas

## Comments
Only explain WHY. Never explain WHAT. The one place comments are mandatory
regardless of this rule: the locking logic in the bookings repository. Explain
why the lock order is sorted, why the check happens inside the transaction,
and why it happens after the lock, because this is the part a reviewer will
scrutinize most closely and the reasoning should be visible, not just the code.

## Testing Mindset
Design code to be testable: decoupled service/repository layers, not logic
buried inside route handlers or React components. The booking repository
function specifically should be callable and testable in isolation, since it
will be exercised by a concurrency test (two simultaneous calls for the same
seat) as part of grading this project.

## Before Writing Code
Always: Plan, then Explain, then Implement. Never skip planning. For the
bookings feature specifically, state the locking/transaction plan explicitly
before writing the repository code, so it can be checked against the
requirement above before any code is written.
