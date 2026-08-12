"""Business rules for seats."""

from sqlalchemy.orm import Session

from app.features.seats.repository import SeatRepository
from app.features.seats.schemas import SeatMapSeat, SeatStatus


class SeatService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SeatRepository()

    def get_seat_map(self, event_id: int) -> list[SeatMapSeat]:
        # Blocked wins over booked: an admin-blocked seat is never sellable
        # even if a stale booking row existed for it.
        rows = self.repository.get_seats_with_booking_status(self.db, event_id)
        return [
            SeatMapSeat(
                id=row.id,
                row_label=row.row_label,
                seat_number=row.seat_number,
                status=(
                    SeatStatus.BLOCKED
                    if row.is_blocked
                    else SeatStatus.BOOKED
                    if row.is_booked
                    else SeatStatus.AVAILABLE
                ),
            )
            for row in rows
        ]
