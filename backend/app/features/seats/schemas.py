"""Pydantic schemas for seats."""

from enum import Enum

from pydantic import BaseModel


class SeatStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    BLOCKED = "blocked"


class SeatMapSeat(BaseModel):
    id: int
    row_label: str
    seat_number: int
    status: SeatStatus
