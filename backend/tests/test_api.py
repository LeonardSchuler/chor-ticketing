import pytest
from fastapi.testclient import TestClient

from pathlib import Path

from app.infrastructure.sqlite import Database
from app.main import create_app
from app.seed import load

FIXTURE = Path(__file__).parent / "fixtures" / "events.json"


@pytest.fixture
def client(tmp_path):
    db_path = tmp_path / "test.db"
    load(Database(db_path), FIXTURE)
    return TestClient(create_app(db_path))


def test_list_events_uses_camel_case(client):
    res = client.get("/api/events")
    assert res.status_code == 200
    events = res.json()
    assert [e["id"] for e in events] == [1, 2, 3]
    assert events[0]["seatLayoutUrl"] == "/seats-layout.svg"


def test_get_event_and_404(client):
    assert client.get("/api/events/1").json()["title"] == "Frühjahrskonzert 2026"
    assert client.get("/api/events/999").status_code == 404


def test_prices(client):
    assert client.get("/api/events/1/prices").json() == {
        "cat-1": 55,
        "cat-2": 65,
        "cat-3": 45,
        "cat-4": 75,
    }
    assert client.get("/api/events/999/prices").status_code == 404


def test_reserve_conflict_and_release(client):
    url = "/api/events/1/reservations"
    res = client.post(url, json={"seatId": "seat-1630"})
    assert res.status_code == 201
    reservation = res.json()
    assert reservation["seatId"] == "seat-1630"

    assert client.post(url, json={"seatId": "seat-1630"}).status_code == 409
    # Same seat on another event is independent
    other = client.post("/api/events/2/reservations", json={"seatId": "seat-1630"})
    assert other.status_code == 201

    assert [r["id"] for r in client.get(url).json()] == [reservation["id"]]

    assert client.delete(f"{url}/{reservation['id']}").status_code == 204
    assert client.delete(f"{url}/{reservation['id']}").status_code == 404
    assert client.post(url, json={"seatId": "seat-1630"}).status_code == 201


def test_reserve_unknown_event_and_bad_duration(client):
    assert (
        client.post("/api/events/999/reservations", json={"seatId": "s"}).status_code
        == 404
    )
    bad = client.post(
        "/api/events/1/reservations", json={"seatId": "s", "durationMinutes": 0}
    )
    assert bad.status_code == 422


def test_expired_reservation_frees_seat(tmp_path):
    from datetime import UTC, datetime, timedelta

    from app.application.reservations import ReservationUseCases
    from app.infrastructure.sqlite import (
        SqliteEventRepository,
        SqliteReservationRepository,
    )

    db = Database(tmp_path / "t.db")
    load(db, FIXTURE)
    now = [datetime(2026, 1, 1, tzinfo=UTC)]
    uc = ReservationUseCases(
        SqliteEventRepository(db), SqliteReservationRepository(db), lambda: now[0]
    )
    uc.reserve(1, "seat-1", duration_minutes=10)
    now[0] += timedelta(minutes=11)
    assert uc.list_active(1) == []
    uc.reserve(1, "seat-1")  # succeeds after expiry


def test_seed_is_idempotent_and_updates(tmp_path):
    import json

    db = Database(tmp_path / "s.db")
    entries = json.loads(FIXTURE.read_text(encoding="utf-8"))
    load(db, FIXTURE)
    entries[0]["venue"] = "New Venue"
    entries[0]["prices"]["cat-1"] = 99
    edited = tmp_path / "edited.json"
    edited.write_text(json.dumps(entries), encoding="utf-8")
    load(db, edited)

    client = TestClient(create_app(tmp_path / "s.db"))
    assert len(client.get("/api/events").json()) == 3
    assert client.get("/api/events/1").json()["venue"] == "New Venue"
    assert client.get("/api/events/1/prices").json()["cat-1"] == 99


def test_booked_seat_cannot_be_reserved(client):
    url = "/api/events/1/reservations"
    assert client.post(url, json={"seatId": "seat-9001"}).status_code == 409
    # Booking is per event
    assert (
        client.post("/api/events/2/reservations", json={"seatId": "seat-9001"}).status_code
        == 201
    )
    assert client.post(url, json={"seatId": "seat-9003"}).status_code == 201


def test_booking_seed_is_additive(tmp_path):
    from datetime import UTC, datetime

    from app.infrastructure.sqlite import SqliteBookingRepository

    db = Database(tmp_path / "b.db")
    repo = SqliteBookingRepository(db)
    load(db, FIXTURE)
    load(db, FIXTURE)  # re-seed adds no duplicates
    assert repo.list_seat_ids(1) == ["seat-9001", "seat-9002"]

    # A booking made later survives a re-seed
    assert repo.add_many(1, ["seat-5", "seat-9001"], "api", datetime.now(UTC)) == 1
    load(db, FIXTURE)
    assert repo.list_seat_ids(1) == ["seat-5", "seat-9001", "seat-9002"]


def test_list_bookings(client):
    res = client.get("/api/events/1/bookings")
    assert res.status_code == 200
    assert res.json() == [{"seatId": "seat-9001"}, {"seatId": "seat-9002"}]
    assert client.get("/api/events/2/bookings").json() == []
    assert client.get("/api/events/999/bookings").status_code == 404


def test_confirm_booking_consumes_reservations(client):
    res = client.post("/api/events/1/reservations", json={"seatId": "seat-10"})
    rid = res.json()["id"]
    other = client.post("/api/events/1/reservations", json={"seatId": "seat-11"}).json()["id"]

    done = client.post("/api/events/1/bookings", json={"reservationIds": [rid, other]})
    assert done.status_code == 201
    assert sorted(b["seatId"] for b in done.json()) == ["seat-10", "seat-11"]
    assert {"seatId": "seat-10"} in client.get("/api/events/1/bookings").json()
    assert client.get("/api/events/1/reservations").json() == []
    # Seat is now permanently taken
    assert client.post("/api/events/1/reservations", json={"seatId": "seat-10"}).status_code == 409


def test_confirm_booking_is_all_or_nothing(client):
    rid = client.post("/api/events/1/reservations", json={"seatId": "seat-20"}).json()["id"]
    res = client.post("/api/events/1/bookings", json={"reservationIds": [rid, "res-nope"]})
    assert res.status_code == 409
    assert {"seatId": "seat-20"} not in client.get("/api/events/1/bookings").json()
    assert len(client.get("/api/events/1/reservations").json()) == 1
    assert client.post("/api/events/1/bookings", json={"reservationIds": []}).status_code == 422
    assert client.post("/api/events/999/bookings", json={"reservationIds": [rid]}).status_code == 404
