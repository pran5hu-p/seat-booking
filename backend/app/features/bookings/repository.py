"""SQLAlchemy data access for bookings.

The concurrency-critical locking logic (SELECT ... FOR UPDATE) lives here, in
isolation, so it can be reviewed and tested as a single unit. Implemented in
Phase 4.
"""


class BookingRepository:
    """Row-locking booking inserts and booking reads."""
