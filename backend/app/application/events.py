from app.domain.errors import EventNotFound
from app.domain.models import Event, PricingMap
from app.domain.ports import EventRepository


class EventUseCases:
    def __init__(self, events: EventRepository):
        self._events = events

    def list_events(self) -> list[Event]:
        return self._events.list()

    def get_event(self, event_id: int) -> Event:
        event = self._events.get(event_id)
        if event is None:
            raise EventNotFound(event_id)
        return event

    def get_prices(self, event_id: int) -> PricingMap:
        self.get_event(event_id)
        return self._events.get_prices(event_id)
