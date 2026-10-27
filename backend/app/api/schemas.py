from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Serializes as camelCase to match the frontend models."""

    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


class EventOut(CamelModel):
    id: int
    title: str
    date: str
    venue: str
    seat_layout_url: str
    description: str | None = None
    start_time: str | None = None
    end_time: str | None = None


class ReservationOut(CamelModel):
    id: str
    seat_id: int
    event_id: int
    created_at: datetime
    expires_at: datetime


class BookingOut(CamelModel):
    seat_id: int


class ReservationIn(CamelModel):
    seat_id: int = Field(ge=1)
    duration_minutes: int = Field(default=10, ge=1, le=60)


class BookingIn(CamelModel):
    reservation_ids: list[str] = Field(min_length=1)
