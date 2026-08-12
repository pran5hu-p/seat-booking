"""SQLAlchemy data access for bookings.

The concurrency-critical locking logic (SELECT ... FOR UPDATE) lives here, in
isolation, so it can be reviewed and tested as a single unit. Implemented in
Phase 4.
"""

from sqlalchemy import Row, func, select
from sqlalchemy.orm import Session

from app.features.bookings.models import Booking, BookingGroup
from app.features.events.models import Seat


class BookingRepository:
    def list_dashboard_bookings(self, db: Session, event_id: int) -> list[Row]:
        stmt = (
            select(
                func.concat(Seat.row_label, Seat.seat_number).label("seat_label"),
                BookingGroup.booker_name.label("booker_name"),
                BookingGroup.booker_email.label("booker_email"),
                Booking.created_at.label("created_at"),
            )
            .join(BookingGroup, Booking.booking_group_id == BookingGroup.id)
            .join(Seat, Booking.seat_id == Seat.id)
            .where(Seat.event_id == event_id)
            .order_by(Booking.created_at.desc(), Booking.id.desc())
        )
        return list(db.execute(stmt))
