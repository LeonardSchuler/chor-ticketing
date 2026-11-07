"""Load events and prices from a JSON file into the database.

Usage: uv run python -m app.seed [path/to/events.json]

Idempotent: events are upserted by their "id" and their prices replaced, so you can
edit the file and re-run it. Events and prices are overwritten from the file. Bookings listed under an
event's "bookings" key are additive: missing seats are inserted, nothing is
ever updated or removed, so real bookings made later survive a re-seed.
Bookings from the gitignored seed/bookings.local.json ({"<eventId>": [seatId, ...]}) are merged in the same way.
Existing reservations are left untouched.
"""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from app.infrastructure.sqlite import Database, insert_bookings

DEFAULT_SEED_FILE = Path(__file__).resolve().parents[1] / "seed" / "events.json"
# Gitignored file next to the events file, holds real customer bookings:
# {"<eventId>": [seatId, ...]}
LOCAL_BOOKINGS_NAME = "bookings.local.json"


def _local_bookings(path: Path) -> dict[int, list[int]]:
    if not path.exists():
        return {}
    return {int(k): v for k, v in json.loads(path.read_text(encoding="utf-8")).items()}


def load(
    db: Database,
    path: str | Path = DEFAULT_SEED_FILE,
    bookings_path: str | Path | None = None,
) -> int:
    entries = json.loads(Path(path).read_text(encoding="utf-8"))
    local = _local_bookings(
        Path(bookings_path)
        if bookings_path
        else Path(path).with_name(LOCAL_BOOKINGS_NAME)
    )
    db.init()
    with db.connect() as conn:
        conn.execute("BEGIN")
        for e in entries:
            event_id = conn.execute(
                """
                INSERT INTO events
                    (id, title, date, venue, seat_layout_url, description, start_time, end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    date = excluded.date,
                    venue = excluded.venue,
                    seat_layout_url = excluded.seat_layout_url,
                    description = excluded.description,
                    start_time = excluded.start_time,
                    end_time = excluded.end_time
                RETURNING id
                """,
                (
                    e["id"],
                    e["title"],
                    e["date"],
                    e["venue"],
                    e["seatLayoutUrl"],
                    e.get("description"),
                    e.get("startTime"),
                    e.get("endTime"),
                ),
            ).fetchone()["id"]
            conn.execute("DELETE FROM prices WHERE event_id = ?", (event_id,))
            conn.executemany(
                "INSERT INTO prices (event_id, category, price) VALUES (?, ?, ?)",
                [(event_id, int(c), p) for c, p in e["prices"].items()],
            )
            insert_bookings(
                conn,
                event_id,
                [*e.get("bookings", []), *local.get(event_id, [])],
                "presale",
                datetime.now(UTC),
            )
        conn.execute("COMMIT")
    return len(entries)


if __name__ == "__main__":
    from app.main import DEFAULT_DB_PATH
    import os

    db = Database(os.environ.get("TICKETING_DB", DEFAULT_DB_PATH))
    file = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SEED_FILE
    print(f"Seeded {load(db, file)} event(s) from {file}")
