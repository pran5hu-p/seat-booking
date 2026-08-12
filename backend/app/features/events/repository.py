"""SQLAlchemy data access for events and their seats."""

from datetime import datetime

from sqlalchemy import Row, case, func, select
from sqlalchemy.orm import Session

from app.features.bookings.models import Booking
from app.features.events.models import Event, Seat
from app.shared.utils import row_label_for_index


class EventRepository:
    def create_event(
        self,
        db: Session,
        *,
        name: str,
        event_date: datetime,
        rows: int,
        seats_per_row: int,
    ) -> Event:
        event = Event(
            name=name,
            event_date=event_date,
            rows=rows,
            seats_per_row=seats_per_row,
        )
        db.add(event)
        db.flush()
        return event

    def create_seats_for_event(
        self,
        db: Session,
        event_id: int,
        rows: int,
        seats_per_row: int,
    ) -> None:
        seats = [
            Seat(
                event_id=event_id,
                row_label=row_label_for_index(row),
                seat_number=seat_number,
            )
            for row in range(rows)
            for seat_number in range(1, seats_per_row + 1)
        ]
        db.add_all(seats)

    def get_event(self, db: Session, event_id: int) -> Event | None:
        return db.get(Event, event_id)

    def list_events_with_counts(self, db: Session) -> list[Row]:
        booked_subquery = (
            select(func.count(Booking.id))
            .join(Seat, Booking.seat_id == Seat.id)
            .where(Seat.event_id == Event.id)
            .scalar_subquery()
        )
        stmt = (
            select(
                Event.id,
                Event.name,
                Event.event_date,
                Event.rows,
                Event.seats_per_row,
                Event.created_at,
                func.count(Seat.id).label("total_seats"),
                booked_subquery.label("booked_seats"),
                func.coalesce(
                    func.sum(case((Seat.is_blocked, 1), else_=0)), 0
                ).label("blocked_seats"),
            )
            .outerjoin(Seat, Seat.event_id == Event.id)
            .group_by(Event.id)
            .order_by(Event.created_at.desc(), Event.id.desc())
        )
        return list(db.execute(stmt))

    def get_dashboard_counts(self, db: Session, event_id: int) -> Row:
        booked_subquery = (
            select(func.count(Booking.id))
            .join(Seat, Booking.seat_id == Seat.id)
            .where(Seat.event_id == event_id)
            .scalar_subquery()
        )
        stmt = (
            select(
                func.count(Seat.id).label("total_seats"),
                booked_subquery.label("booked_seats"),
                func.coalesce(
                    func.sum(case((Seat.is_blocked, 1), else_=0)), 0
                ).label("blocked_seats"),
            ).where(Seat.event_id == event_id)
        )
        return db.execute(stmt).one()
