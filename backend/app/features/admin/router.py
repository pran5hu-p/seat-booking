from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.admin.schemas import (
    EventDashboard,
    SeatBlockResult,
    SeatIdsRequest,
)
from app.features.admin.service import AdminService
from app.features.events.schemas import EventCreate, EventListItem, EventOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post(
    "/events", response_model=EventOut, status_code=status.HTTP_201_CREATED
)
def create_event(
    payload: EventCreate, db: Session = Depends(get_db)
) -> EventOut:
    return AdminService(db).create_event(payload)


@router.get("/events", response_model=list[EventListItem])
def list_events(db: Session = Depends(get_db)) -> list[EventListItem]:
    return AdminService(db).list_events()


@router.post(
    "/events/{event_id}/seats/block", response_model=SeatBlockResult
)
def block_seats(
    event_id: int, payload: SeatIdsRequest, db: Session = Depends(get_db)
) -> SeatBlockResult:
    return AdminService(db).set_seats_blocked(event_id, payload, is_blocked=True)


@router.post(
    "/events/{event_id}/seats/unblock", response_model=SeatBlockResult
)
def unblock_seats(
    event_id: int, payload: SeatIdsRequest, db: Session = Depends(get_db)
) -> SeatBlockResult:
    return AdminService(db).set_seats_blocked(event_id, payload, is_blocked=False)


@router.get("/events/{event_id}/dashboard", response_model=EventDashboard)
def get_dashboard(
    event_id: int, db: Session = Depends(get_db)
) -> EventDashboard:
    return AdminService(db).get_dashboard(event_id)
