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


@dataclass(frozen=True)
class PurchaseItem:
    """One reserved seat in a purchase, with the price the customer paid for it."""

    reservation_id: str
    price: int
    discount: float  # percentage (0-100)


@dataclass(frozen=True)
class PurchasedSeat:
    seat_id: int
    price: int
    discount: float


@dataclass(frozen=True)
class Order:
    """Seats purchased together in one checkout."""

    id: int
    event_id: int
    total: float
    created_at: datetime
    seats: list[PurchasedSeat]
