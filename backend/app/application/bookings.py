from collections.abc import Callable
from datetime import UTC, datetime

from app.domain.errors import EventNotFound, ReservationInvalid
from app.domain.ports import BookingRepository, EventRepository


def _utcnow() -> datetime:
    return datetime.now(UTC)


class BookingUseCases:
    def __init__(
        self,
        events: EventRepository,
        bookings: BookingRepository,
        clock: Callable[[], datetime] = _utcnow,
    ):
        self._events = events
        self._bookings = bookings
        self._clock = clock

    def list_booked_seat_ids(self, event_id: int) -> list[str]:
        self._require_event(event_id)
        return self._bookings.list_seat_ids(event_id)

    def confirm(self, event_id: int, reservation_ids: list[str]) -> list[str]:
        self._require_event(event_id)
        seat_ids = self._bookings.confirm(
            event_id, reservation_ids, "purchase", self._clock()
        )
        if seat_ids is None:
            raise ReservationInvalid()
        return seat_ids

    def _require_event(self, event_id: int) -> None:
        if self._events.get(event_id) is None:
            raise EventNotFound(event_id)
