import sqlite3
from contextlib import contextmanager
from collections.abc import Iterator
from datetime import datetime
from pathlib import Path

from app.domain.models import Event, PricingMap, Reservation

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    seat_layout_url TEXT NOT NULL,
    description TEXT,
    start_time TEXT,
    end_time TEXT,
    UNIQUE (title, date)
);

CREATE TABLE IF NOT EXISTS prices (
    event_id INTEGER NOT NULL REFERENCES events(id),
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    PRIMARY KEY (event_id, category)
);

CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    seat_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    UNIQUE (event_id, seat_id)
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id),
    seat_id TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (event_id, seat_id)
);
"""


class Database:
    """Opens a short-lived SQLite connection per operation (safe across threads)."""

    def __init__(self, path: str | Path):
        self.path = str(path)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
        finally:
            conn.close()

    def init(self) -> None:
        """Create the schema if it does not exist yet."""
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as conn:
            conn.executescript(SCHEMA)


def insert_bookings(
    conn: sqlite3.Connection,
    event_id: int,
    seat_ids: list[str],
    source: str,
    now: datetime,
) -> int:
    """Insert missing bookings, ignoring seats already booked. Returns rows added."""
    added = 0
    for seat_id in dict.fromkeys(seat_ids):
        cursor = conn.execute(
            "INSERT OR IGNORE INTO bookings (event_id, seat_id, source, created_at)"
            " VALUES (?, ?, ?, ?)",
            (event_id, seat_id, source, now.isoformat()),
        )
        added += cursor.rowcount
    return added


def _event_from_row(row: sqlite3.Row) -> Event:
    return Event(**dict(row))


class SqliteEventRepository:
    def __init__(self, db: Database):
        self._db = db

    def list(self) -> list[Event]:
        with self._db.connect() as conn:
            rows = conn.execute("SELECT * FROM events ORDER BY date").fetchall()
        return [_event_from_row(r) for r in rows]

    def get(self, event_id: str) -> Event | None:
        with self._db.connect() as conn:
            row = conn.execute(
                "SELECT * FROM events WHERE id = ?", (event_id,)
            ).fetchone()
        return _event_from_row(row) if row else None

    def get_prices(self, event_id: str) -> PricingMap:
        with self._db.connect() as conn:
            rows = conn.execute(
                "SELECT category, price FROM prices WHERE event_id = ?", (event_id,)
            ).fetchall()
        return {r["category"]: r["price"] for r in rows}


class SqliteBookingRepository:
    def __init__(self, db: Database):
        self._db = db

    def add_many(
        self, event_id: int, seat_ids: list[str], source: str, now: datetime
    ) -> int:
        with self._db.connect() as conn:
            conn.execute("BEGIN")
            added = insert_bookings(conn, event_id, seat_ids, source, now)
            conn.execute("COMMIT")
            return added

    def list_seat_ids(self, event_id: int) -> list[str]:
        with self._db.connect() as conn:
            rows = conn.execute(
                "SELECT seat_id FROM bookings WHERE event_id = ? ORDER BY seat_id",
                (event_id,),
            ).fetchall()
        return [r["seat_id"] for r in rows]

    def confirm(
        self, event_id: int, reservation_ids: list[str], source: str, now: datetime
    ) -> list[str] | None:
        ids = list(dict.fromkeys(reservation_ids))
        marks = ",".join("?" * len(ids))
        with self._db.connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            rows = conn.execute(
                f"SELECT seat_id FROM reservations WHERE event_id = ?"
                f" AND expires_at > ? AND id IN ({marks})",
                (event_id, now.isoformat(), *ids),
            ).fetchall()
            if len(rows) != len(ids):
                conn.execute("ROLLBACK")
                return None
            seat_ids = [r["seat_id"] for r in rows]
            insert_bookings(conn, event_id, seat_ids, source, now)
            conn.execute(
                f"DELETE FROM reservations WHERE event_id = ? AND id IN ({marks})",
                (event_id, *ids),
            )
            conn.execute("COMMIT")
            return seat_ids


class SqliteReservationRepository:
    def __init__(self, db: Database):
        self._db = db

    def list_active(self, event_id: str, now: datetime) -> list[Reservation]:
        with self._db.connect() as conn:
            rows = conn.execute(
                "SELECT * FROM reservations WHERE event_id = ? AND expires_at > ?",
                (event_id, now.isoformat()),
            ).fetchall()
        return [_reservation_from_row(r) for r in rows]

    def create(self, reservation: Reservation, now: datetime) -> bool:
        with self._db.connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            try:
                conn.execute(
                    "DELETE FROM reservations WHERE expires_at <= ?",
                    (now.isoformat(),),
                )
                booked = conn.execute(
                    "SELECT 1 FROM bookings WHERE event_id = ? AND seat_id = ?",
                    (reservation.event_id, reservation.seat_id),
                ).fetchone()
                if booked:
                    conn.execute("ROLLBACK")
                    return False
                conn.execute(
                    "INSERT INTO reservations VALUES (?, ?, ?, ?, ?)",
                    (
                        reservation.id,
                        reservation.event_id,
                        reservation.seat_id,
                        reservation.created_at.isoformat(),
                        reservation.expires_at.isoformat(),
                    ),
                )
            except sqlite3.IntegrityError:
                conn.execute("ROLLBACK")
                return False
            conn.execute("COMMIT")
            return True

    def delete(self, event_id: str, reservation_id: str) -> bool:
        with self._db.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM reservations WHERE id = ? AND event_id = ?",
                (reservation_id, event_id),
            )
            return cursor.rowcount > 0


def _reservation_from_row(row: sqlite3.Row) -> Reservation:
    return Reservation(
        id=row["id"],
        seat_id=row["seat_id"],
        event_id=row["event_id"],
        created_at=datetime.fromisoformat(row["created_at"]),
        expires_at=datetime.fromisoformat(row["expires_at"]),
    )
