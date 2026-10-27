from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.api.schemas import BookingOut, EventOut, ReservationIn, ReservationOut
from app.application.bookings import BookingUseCases
from app.application.events import EventUseCases
from app.application.reservations import ReservationUseCases
from app.domain.errors import EventNotFound, SeatUnavailable
from app.domain.models import PricingMap

router = APIRouter(prefix="/api")


def get_event_use_cases(request: Request) -> EventUseCases:
    return request.app.state.event_use_cases


def get_booking_use_cases(request: Request) -> BookingUseCases:
    return request.app.state.booking_use_cases


def get_reservation_use_cases(request: Request) -> ReservationUseCases:
    return request.app.state.reservation_use_cases


@router.get("/events", response_model=list[EventOut], response_model_by_alias=True)
def list_events(uc: EventUseCases = Depends(get_event_use_cases)):
    return uc.list_events()


@router.get(
    "/events/{event_id}", response_model=EventOut, response_model_by_alias=True
)
def get_event(event_id: int, uc: EventUseCases = Depends(get_event_use_cases)):
    return uc.get_event(event_id)


@router.get("/events/{event_id}/prices")
def get_prices(
    event_id: int, uc: EventUseCases = Depends(get_event_use_cases)
) -> PricingMap:
    return uc.get_prices(event_id)


@router.get(
    "/events/{event_id}/bookings",
    response_model=list[BookingOut],
    response_model_by_alias=True,
)
def list_bookings(
    event_id: int, uc: BookingUseCases = Depends(get_booking_use_cases)
):
    return [BookingOut(seat_id=s) for s in uc.list_booked_seat_ids(event_id)]


@router.get(
    "/events/{event_id}/reservations",
    response_model=list[ReservationOut],
    response_model_by_alias=True,
)
def list_reservations(
    event_id: int, uc: ReservationUseCases = Depends(get_reservation_use_cases)
):
    return uc.list_active(event_id)


@router.post(
    "/events/{event_id}/reservations",
    response_model=ReservationOut,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def create_reservation(
    event_id: int,
    body: ReservationIn,
    uc: ReservationUseCases = Depends(get_reservation_use_cases),
):
    return uc.reserve(event_id, body.seat_id, body.duration_minutes)


@router.delete(
    "/events/{event_id}/reservations/{reservation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def release_reservation(
    event_id: int,
    reservation_id: str,
    uc: ReservationUseCases = Depends(get_reservation_use_cases),
):
    if not uc.release(event_id, reservation_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reservation not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def register_exception_handlers(app) -> None:
    from fastapi.responses import JSONResponse

    @app.exception_handler(EventNotFound)
    async def _event_not_found(_: Request, exc: EventNotFound):
        return JSONResponse({"detail": str(exc)}, status_code=404)

    @app.exception_handler(SeatUnavailable)
    async def _seat_unavailable(_: Request, exc: SeatUnavailable):
        return JSONResponse({"detail": str(exc)}, status_code=409)
