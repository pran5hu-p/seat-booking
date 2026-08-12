from fastapi import APIRouter

router = APIRouter(prefix="/events/{event_id}/seats", tags=["seats"])
