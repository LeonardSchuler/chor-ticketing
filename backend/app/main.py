import os
from pathlib import Path

from fastapi import FastAPI

from app.api.routes import register_exception_handlers, router
from app.application.bookings import BookingUseCases
from app.application.events import EventUseCases
from app.application.reservations import ReservationUseCases
from app.infrastructure.sqlite import (
    Database,
    SqliteBookingRepository,
    SqliteEventRepository,
    SqliteReservationRepository,
)

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "ticketing.db"


def create_app(db_path: str | Path | None = None) -> FastAPI:
    """Composition root: wire repositories into use cases."""
    db = Database(db_path or os.environ.get("TICKETING_DB", DEFAULT_DB_PATH))
    db.init()

    events = SqliteEventRepository(db)
    bookings = SqliteBookingRepository(db)
    reservations = SqliteReservationRepository(db)

    app = FastAPI(title="Chor Ticketing API")
    app.state.event_use_cases = EventUseCases(events)
    app.state.booking_use_cases = BookingUseCases(events, bookings)
    app.state.reservation_use_cases = ReservationUseCases(events, reservations)
    register_exception_handlers(app)
    app.include_router(router)
    return app


app = create_app()
