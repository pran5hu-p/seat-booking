"""Business rules for admin operations."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.features.admin.schemas import (
    BookingRow,
    BlockedSeatOut,
    EventDashboard,
    SeatBlockResult,
    SeatIdsRequest,
)
from app.features.bookings.repository import BookingRepository
from app.features.events.schemas import EventCreate, EventListItem, EventOut
from app.features.events.service import EventService
from app.features.seats.repository import SeatRepository
from app.shared.utils import commit_or_rollback


class AdminService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.events = EventService(db)
        self.seats = SeatRepository()
        self.bookings = BookingRepository()

    def create_event(self, payload: EventCreate) -> EventOut:
        return self.events.create_event(payload)

    def list_events(self) -> list[EventListItem]:
        return self.events.list_with_counts()

    def set_seats_blocked(
        self, event_id: int, payload: SeatIdsRequest, *, is_blocked: bool
    ) -> SeatBlockResult:
        # Block/unblock is idempotent by construction: re-applying the same flag
        # to an already-blocked/unblocked seat is a no-op, not an error.
        self.events.get_event_or_404(event_id)
        requested = set(payload.seat_ids)
        seats = self.seats.get_seats_for_event_by_ids(
            self.db, event_id, list(requested)
        )
        found_ids = {seat.id for seat in seats}
        missing = requested - found_ids
        if missing:
            raise NotFoundError(f"Seat(s) not found for this event: {sorted(missing)}")
        self.seats.set_blocked(self.db, sorted(found_ids), is_blocked)
        commit_or_rollback(self.db)
        return SeatBlockResult(
            is_blocked=is_blocked,
            seats=[
                BlockedSeatOut(
                    id=seat.id,
                    row_label=seat.row_label,
                    seat_number=seat.seat_number,
                    seat_label=f"{seat.row_label}{seat.seat_number}",
                    is_blocked=is_blocked,
                )
                for seat in seats
            ],
        )

    def get_dashboard(self, event_id: int) -> EventDashboard:
        self.events.get_event_or_404(event_id)
        counts = self.events.get_dashboard_counts(event_id)
        bookings = self.bookings.list_dashboard_bookings(self.db, event_id)
        return EventDashboard(
            event_id=event_id,
            total_seats=counts.total_seats,
            booked_seats=counts.booked_seats,
            blocked_seats=counts.blocked_seats,
            available_seats=counts.total_seats - counts.booked_seats - counts.blocked_seats,
            bookings=[BookingRow(**row._mapping) for row in bookings],
        )
