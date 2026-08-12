"""Business rules for events."""

from sqlalchemy import Row
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.features.events.models import Event
from app.features.events.repository import EventRepository
from app.features.events.schemas import EventCreate, EventListItem, EventOut
from app.shared.utils import commit_or_rollback


class EventService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = EventRepository()

    def create_event(self, payload: EventCreate) -> EventOut:
        # Event and its auto-generated seats must land together; a partially
        # created event would be a corrupt state for a client to observe.
        event = self.repository.create_event(
            self.db,
            name=payload.name,
            event_date=payload.event_date,
            rows=payload.rows,
            seats_per_row=payload.seats_per_row,
        )
        self.repository.create_seats_for_event(
            self.db, event.id, payload.rows, payload.seats_per_row
        )
        commit_or_rollback(self.db)
        self.db.refresh(event)
        return EventOut.model_validate(event)

    def list_with_counts(self) -> list[EventListItem]:
        rows = self.repository.list_events_with_counts(self.db)
        return [
            EventListItem(
                id=row.id,
                name=row.name,
                event_date=row.event_date,
                rows=row.rows,
                seats_per_row=row.seats_per_row,
                created_at=row.created_at,
                total_seats=row.total_seats,
                booked_seats=row.booked_seats,
                blocked_seats=row.blocked_seats,
                available_seats=row.total_seats - row.booked_seats - row.blocked_seats,
            )
            for row in rows
        ]

    def get_event_or_404(self, event_id: int) -> Event:
        event = self.repository.get_event(self.db, event_id)
        if event is None:
            raise NotFoundError("Event not found")
        return event

    def get_dashboard_counts(self, event_id: int) -> Row:
        return self.repository.get_dashboard_counts(self.db, event_id)
