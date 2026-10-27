import secrets
from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from app.domain.errors import EventNotFound, SeatUnavailable
from app.domain.models import Reservation
from app.domain.ports import EventRepository, ReservationRepository

DEFAULT_DURATION_MINUTES = 15


def _utcnow() -> datetime:
    return datetime.now(UTC)


class ReservationUseCases:
    def __init__(
        self,
        events: EventRepository,
        reservations: ReservationRepository,
        clock: Callable[[], datetime] = _utcnow,
    ):
        self._events = events
        self._reservations = reservations
        self._clock = clock

    def list_active(self, event_id: int) -> list[Reservation]:
        self._require_event(event_id)
        return self._reservations.list_active(event_id, self._clock())

    def reserve(
        self,
        event_id: int,
        seat_id: int,
        duration_minutes: int = DEFAULT_DURATION_MINUTES,
    ) -> Reservation:
        self._require_event(event_id)
        now = self._clock()
        reservation = Reservation(
            id=f"res-{secrets.token_hex(6)}",
            seat_id=seat_id,
            event_id=event_id,
            created_at=now,
            expires_at=now + timedelta(minutes=duration_minutes),
        )
        if not self._reservations.create(reservation, now):
            raise SeatUnavailable(seat_id)
        return reservation

    def release(self, event_id: int, reservation_id: str) -> bool:
        self._require_event(event_id)
        return self._reservations.delete(event_id, reservation_id)

    def _require_event(self, event_id: int) -> None:
        if self._events.get(event_id) is None:
            raise EventNotFound(event_id)
