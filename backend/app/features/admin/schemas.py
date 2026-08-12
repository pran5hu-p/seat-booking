"""Pydantic schemas for the admin surface."""

from datetime import datetime

from pydantic import BaseModel, Field


class SeatIdsRequest(BaseModel):
    seat_ids: list[int] = Field(min_length=1)


class BlockedSeatOut(BaseModel):
    id: int
    row_label: str
    seat_number: int
    seat_label: str
    is_blocked: bool


class SeatBlockResult(BaseModel):
    is_blocked: bool
    seats: list[BlockedSeatOut]


class BookingRow(BaseModel):
    seat_label: str
    booker_name: str
    booker_email: str
    created_at: datetime


class EventDashboard(BaseModel):
    event_id: int
    total_seats: int
    booked_seats: int
    blocked_seats: int
    available_seats: int
    bookings: list[BookingRow]
