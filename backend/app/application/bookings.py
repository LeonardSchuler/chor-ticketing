from app.domain.errors import EventNotFound
from app.domain.ports import BookingRepository, EventRepository


class BookingUseCases:
    def __init__(self, events: EventRepository, bookings: BookingRepository):
        self._events = events
        self._bookings = bookings

    def list_booked_seat_ids(self, event_id: int) -> list[str]:
        if self._events.get(event_id) is None:
            raise EventNotFound(event_id)
        return self._bookings.list_seat_ids(event_id)
