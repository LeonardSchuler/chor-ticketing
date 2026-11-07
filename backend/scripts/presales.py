"""Convert a ticket-vendor Excel export into seed/bookings.local.json.

Usage: uv run python scripts/presales.py EXPORT.xlsx --event-id 1 [--out seed/bookings.local.json]

Only rows with Storniert == "Nein" count. The seat number is the last
comma-separated part of the Sitzplatz column ("Kirche St. Johann, 4, Mittelschiff, 167" -> 167).
The output maps event id -> sorted list of integer seat ids and replaces that
event's entry, leaving other events in the file untouched. The output file holds
customer data and must stay gitignored.
"""

import argparse
import json
from collections import Counter
from pathlib import Path

from openpyxl import load_workbook

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "seed" / "bookings.local.json"


def extract_seats(xlsx: Path) -> list[int]:
    ws = load_workbook(xlsx, read_only=True).active
    rows = ws.iter_rows(values_only=True)
    header = list(next(rows))
    sitz, storno = header.index("Sitzplatz"), header.index("Storniert")
    seats: list[int] = []
    for n, row in enumerate(rows, start=2):
        if row[storno] != "Nein":
            continue
        text = str(row[sitz] or "").strip()
        if not text:
            print(f"row {n}: empty Sitzplatz, skipped")
            continue
        last = text.split(",")[-1].strip()
        if not last.isdigit():
            print(f"row {n}: seat {last!r} is not an integer, skipped")
            continue
        seats.append(int(last))
    return seats


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("xlsx", type=Path)
    p.add_argument("--event-id", type=int, required=True)
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = p.parse_args()

    seats = extract_seats(args.xlsx)
    for seat, count in Counter(seats).items():
        if count > 1:
            print(f"seat {seat} booked {count} times")

    data = json.loads(args.out.read_text()) if args.out.exists() else {}
    data[str(args.event_id)] = sorted(set(seats))
    args.out.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Wrote {len(data[str(args.event_id)])} seats for event {args.event_id} to {args.out}")


if __name__ == "__main__":
    main()
