from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.bookings.schemas import BookingCreate, BookingResponse
from app.features.bookings.service import BookingService

router = APIRouter(prefix="/events", tags=["bookings"])


@router.post(
    "/{event_id}/book",
    status_code=status.HTTP_201_CREATED,
    response_model=BookingResponse,
)
def book_event(
    event_id: int, payload: BookingCreate, db: Session = Depends(get_db)
) -> BookingResponse:
    return BookingService(db).book(event_id, payload)
