from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.features.admin.router import router as admin_router
from app.features.bookings.router import router as bookings_router
from app.features.events.router import router as events_router
from app.features.seats.router import router as seats_router

settings = get_settings()

app = FastAPI(title="Event Seat Booking API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(events_router)
app.include_router(seats_router)
app.include_router(bookings_router)
app.include_router(admin_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
