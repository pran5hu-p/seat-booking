"""SQLAlchemy data access for seats."""

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.features.events.models import Seat


class SeatRepository:
    def get_seats_for_event_by_ids(
        self, db: Session, event_id: int, seat_ids: list[int]
    ) -> list[Seat]:
        stmt = (
            select(Seat)
            .where(Seat.event_id == event_id, Seat.id.in_(seat_ids))
            .order_by(func.length(Seat.row_label), Seat.row_label, Seat.seat_number)
        )
        return list(db.scalars(stmt))

    def set_blocked(
        self, db: Session, seat_ids: list[int], is_blocked: bool
    ) -> None:
        stmt = update(Seat).where(Seat.id.in_(seat_ids)).values(is_blocked=is_blocked)
        db.execute(stmt)
