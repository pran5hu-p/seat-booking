from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.events.schemas import EventDetail, EventPublicOut
from app.features.events.service import EventService

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventPublicOut])
def list_events(db: Session = Depends(get_db)) -> list[EventPublicOut]:
    return EventService(db).list_public()


@router.get("/{event_id}", response_model=EventDetail)
def get_event_detail(
    event_id: int, db: Session = Depends(get_db)
) -> EventDetail:
    return EventService(db).get_detail(event_id)
