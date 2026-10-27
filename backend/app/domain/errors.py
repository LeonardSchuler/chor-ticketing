class EventNotFound(Exception):
    def __init__(self, event_id: int):
        super().__init__(f"Event '{event_id}' not found")


class SeatUnavailable(Exception):
    def __init__(self, seat_id: int):
        super().__init__(f"Seat '{seat_id}' is not available")


class ReservationInvalid(Exception):
    def __init__(self):
        super().__init__("One or more reservations are unknown or have expired")
