"""Pydantic schemas for bookings."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class BookingCreate(BaseModel):
    # min_length=1 is the non-empty guard: an empty seat list is a 422, not a
    # request the concurrency logic should ever be asked to evaluate.
    seat_ids: list[int] = Field(min_length=1)
    booker_name: str = Field(min_length=1, max_length=255)
    booker_email: EmailStr


class BookingResponse(BaseModel):
    booking_group_id: int
    seat_labels: list[str]
    created_at: datetime
