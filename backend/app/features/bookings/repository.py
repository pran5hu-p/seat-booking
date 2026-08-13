"""SQLAlchemy data access for bookings.

The concurrency-critical locking logic (SELECT ... FOR UPDATE) lives here, in
isolation, so it can be reviewed and tested as a single unit.
"""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import Row, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.features.bookings.models import Booking, BookingGroup
from app.features.events.models import Seat


@dataclass(frozen=True)
class BookingResult:
    booking_group_id: int
    seat_labels: list[str]
    created_at: datetime


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

    def book_seats(
        self,
        db: Session,
        *,
        event_id: int,
        seat_ids: list[int],
        booker_name: str,
        booker_email: str,
    ) -> BookingResult:
        # ------------------------------------------------------------------
        # WHY this ordering is the whole point of this function:
        #
        # (1) Sorted lock order. Two requests for overlapping seat sets must
        #     acquire row locks in the SAME order. If one request locked
        #     (A, B) and another locked (B, A), each would hold a lock the
        #     other needs and both would wait forever (a deadlock InnoDB
        #     would eventually resolve by killing one transaction). Locking
        #     in canonical ascending order makes concurrent overlapping
        #     requests serialize: one waits for the other, nothing deadlocks.
        #     Duplicates are also removed so the request never contains the
        #     same seat twice.
        #
        # (2) Checks inside the transaction. The "is this seat free" read and
        #     the "mark it taken" write must be part of one atomic unit. If a
        #     commit or rollback could happen between the check and the insert,
        #     another request could slip a booking in that gap. Keeping every
        #     statement on the same session means the lock, the checks, and the
        #     inserts either all commit together or all roll back together.
        #
        # (3) Checks AFTER the lock. A pre-lock availability check is exactly
        #     the double-book race this endpoint exists to prevent: two
        #     requests would both read "free", then both insert. Only once the
        #     FOR UPDATE lock is held is the read serialized against every
        #     other booker. A concurrent request for these seats blocks on the
        #     lock until the winner commits, then its check sees the freshly
        #     written bookings row and rejects with 409.
        #
        # Every failure path raises BEFORE anything is inserted, so a 3-seat
        # request where one seat is taken inserts nothing at all - no partial
        # booking, ever.
        # ------------------------------------------------------------------
        requested = sorted(set(seat_ids))

        locked_rows = db.execute(
            select(
                Seat.id,
                Seat.row_label,
                Seat.seat_number,
                Seat.is_blocked,
            )
            .where(Seat.id.in_(requested), Seat.event_id == event_id)
            .order_by(Seat.id)
            .with_for_update()
        ).all()
        locked_by_id = {row.id: row for row in locked_rows}

        missing = [seat_id for seat_id in requested if seat_id not in locked_by_id]
        if missing:
            raise NotFoundError(f"Seat(s) not found for this event: {missing}")

        blocked = [row for row in locked_rows if row.is_blocked]
        if blocked:
            labels = ", ".join(f"{row.row_label}{row.seat_number}" for row in blocked)
            raise ConflictError(f"Seat(s) blocked: {labels}")

        booked = [
            row.seat_id
            for row in db.execute(
                select(Booking.seat_id).where(Booking.seat_id.in_(requested))
            )
        ]
        if booked:
            labels = ", ".join(
                f"{locked_by_id[seat_id].row_label}{locked_by_id[seat_id].seat_number}"
                for seat_id in sorted(booked)
            )
            raise ConflictError(f"Seat(s) already booked: {labels}")

        group = BookingGroup(
            event_id=event_id,
            booker_name=booker_name,
            booker_email=booker_email,
        )
        db.add(group)
        db.flush()
        db.add_all(
            Booking(booking_group_id=group.id, seat_id=row.id) for row in locked_rows
        )

        try:
            db.commit()
        except IntegrityError as exc:
            # Defense in depth, not the primary mechanism: UNIQUE(seat_id) can
            # only trip if some other code path wrote a booking for one of
            # these seats without going through the row lock. Surface it as a
            # seat conflict, not a 500.
            db.rollback()
            raise ConflictError("One or more seats were already booked") from exc

        db.refresh(group)
        return BookingResult(
            booking_group_id=group.id,
            seat_labels=[f"{row.row_label}{row.seat_number}" for row in locked_rows],
            created_at=group.created_at,
        )
