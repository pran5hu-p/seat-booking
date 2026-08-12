"""Pydantic schemas for events."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.features.seats.schemas import SeatMapSeat


class EventCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    event_date: datetime
    rows: int = Field(gt=0)
    seats_per_row: int = Field(gt=0)


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    event_date: datetime
    rows: int
    seats_per_row: int
    created_at: datetime


class EventListItem(BaseModel):
    id: int
    name: str
    event_date: datetime
    rows: int
    seats_per_row: int
    created_at: datetime
    total_seats: int
    booked_seats: int
    blocked_seats: int
    available_seats: int


class EventPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    event_date: datetime


class EventDetail(BaseModel):
    id: int
    name: str
    event_date: datetime
    rows: int
    seats_per_row: int
    seats: list[SeatMapSeat]
