"""Business rules for bookings."""

from sqlalchemy.orm import Session

from app.features.bookings.repository import BookingRepository
from app.features.bookings.schemas import BookingCreate, BookingResponse
from app.features.events.service import EventService


class BookingService:
    """Orchestrates the all-or-nothing booking flow against the repository."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = BookingRepository()

    def book(self, event_id: int, payload: BookingCreate) -> BookingResponse:
        # Event 404 here is a friendly early-out; the repository still
        # independently 404s on seats that don't belong to this event.
        EventService(self.db).get_event_or_404(event_id)
        result = self.repository.book_seats(
            self.db,
            event_id=event_id,
            seat_ids=payload.seat_ids,
            booker_name=payload.booker_name,
            booker_email=payload.booker_email,
        )
        return BookingResponse(
            booking_group_id=result.booking_group_id,
            seat_labels=result.seat_labels,
            created_at=result.created_at,
        )
