from datetime import datetime
from typing import Protocol

from app.domain.models import Event, PricingMap, Reservation


class EventRepository(Protocol):
    def list(self) -> list[Event]: ...

    def get(self, event_id: int) -> Event | None: ...

    def get_prices(self, event_id: int) -> PricingMap: ...


class BookingRepository(Protocol):
    def add_many(
        self, event_id: int, seat_ids: list[int], source: str, now: datetime
    ) -> int:
        """Insert bookings for seats not yet booked; returns how many were added."""
        ...

    def list_seat_ids(self, event_id: int) -> list[int]: ...

    def confirm(
        self, event_id: int, reservation_ids: list[str], source: str, now: datetime
    ) -> list[int] | None:
        """Atomically turn active reservations into bookings.

        Returns the booked seat ids, or None (changing nothing) if any
        reservation is unknown or expired.
        """
        ...


class ReservationRepository(Protocol):
    def list_active(self, event_id: int, now: datetime) -> list[Reservation]:
        """Active (non-expired) reservations for an event."""
        ...

    def create(self, reservation: Reservation, now: datetime) -> bool:
        """Atomically store a reservation.

        Expired reservations are purged first. Returns False if the seat is
        booked or still held by another active reservation.
        """
        ...

    def delete(self, event_id: int, reservation_id: str) -> bool: ...
