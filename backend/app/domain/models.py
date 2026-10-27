from dataclasses import dataclass
from datetime import datetime
from typing import Literal

SeatCategory = Literal[1, 2, 3, 4]

PricingMap = dict[SeatCategory, int]


@dataclass(frozen=True)
class Event:
    id: int
    title: str
    date: str  # ISO date string
    venue: str
    seat_layout_url: str
    description: str | None = None
    start_time: str | None = None
    end_time: str | None = None


@dataclass(frozen=True)
class Reservation:
    id: str
    seat_id: int
    event_id: int
    created_at: datetime
    expires_at: datetime
