from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base_model import Base, TimestampMixin


class BookingGroup(TimestampMixin, Base):
    __tablename__ = "booking_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    booker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    booker_email: Mapped[str] = mapped_column(String(255), nullable=False)


class Booking(TimestampMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        # UNIQUE(seat_id) is the DB-level backstop against double-booking; the primary
        # mechanism is the Phase 4 row lock. It must stay even though the lock is correct.
        UniqueConstraint("seat_id", name="uniq_seat_booking"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_group_id: Mapped[int] = mapped_column(
        ForeignKey("booking_groups.id", ondelete="CASCADE"), nullable=False
    )
    seat_id: Mapped[int] = mapped_column(ForeignKey("seats.id"), nullable=False)
