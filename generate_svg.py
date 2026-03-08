SEAT_TEMPLATE = """
  <g class="seat cat-{category}" data-number="{seat_no}">
    <rect class="seat-box" x="{x_box}" y="{y_box}"/>
    <text class="seat-label" x="{x_text}" y="{y_text}">{seat_no}</text>
  </g>
"""

RECTANGLE = 30
SEPARATOR = 15

MITTELSCHIFF_Y_OFFSET = 11 * 45
MITTELSCHIFF_X_OFFSET = 24 * 30  # 24 seats a 30px
MITTELSCHIFF_START_COLUMN = 0
CHOR_START_COLUMN = MITTELSCHIFF_START_COLUMN + 26
CHOR_Y_OFFSET = MITTELSCHIFF_Y_OFFSET + 150
SEITSCHIFF_LINKS_START_ROW = 27

YELLOW = {*range(100, 142), *range(1100, 1330)}
BLUE = {
    210,
    211,
    231,
    232,
    233,
    234,
    252,
    253,
    254,
    255,
    345,
    346,
    347,
    348,
    366,
    367,
    368,
    369,
    *range(1656, 1701, 2),
    *range(1574, 1611, 2),
    *range(1702, 1727, 2),
    *range(1612, 1627, 2),
    *range(1400, 1469, 2),
    *range(1401, 1480, 2),
    *range(1599, 1656, 2),
    *range(1693, 1762, 2),
    *range(1000, 1096),
}
GREEN = {
    *range(1554, 1573, 2),
    *range(1630, 1655, 2),
    *range(1569, 1598, 2),
    *range(1657, 1692, 2),
}


def get_seat_category(seat: int) -> int:
    if seat in YELLOW:
        return 2
    elif seat in BLUE:
        return 3
    elif seat in GREEN:
        return 4
    else:
        return 1


# print(seat.format(seat_no=120, x_box=0, y_box=0, x_text=15, y_text=15))
def create_mittelschiff_column(
    start_seat_top,
    end_seat_desc,
    start_seat_asc,
    end_seat_asc,
    col_index,
    y_offset=0,
    x_offset=0,
    remove_seats_from_top=0,
    remove_seats_from_bottom=0,
):
    y_box = y_offset - 30  # correct for first iter in for loop
    x_box = x_offset + col_index * 45
    for i, seat_no in enumerate(range(start_seat_top, end_seat_desc - 1, -2)):
        y_box = y_box + 30
        x_text = x_box + 15
        y_text = y_box + 15
        if i + 1 <= remove_seats_from_top:
            continue
        print(
            SEAT_TEMPLATE.format(
                seat_no=seat_no,
                x_box=x_box,
                y_box=y_box,
                x_text=x_text,
                y_text=y_text,
                category=get_seat_category(seat_no),
            )
        )
    for i, seat_no in enumerate(range(start_seat_asc, end_seat_asc + 1, 2)):
        y_box = y_box + 30
        x_text = x_box + 15
        y_text = y_box + 15
        if seat_no + 2 * remove_seats_from_bottom > end_seat_asc:
            break
        print(
            SEAT_TEMPLATE.format(
                seat_no=seat_no,
                x_box=x_box,
                y_box=y_box,
                x_text=x_text,
                y_text=y_text,
                category=get_seat_category(seat_no),
            )
        )


def create_chor_column(
    start_seat,
    end_seat,
    col_index,
    y_offset=150,
    x_offset=0,
    remove_seats_from_top=0,
    remove_seats_from_bottom=0,
):
    y_box = y_offset - 30  # correct for first iter in for loop
    x_box = x_offset + col_index * 45
    for i, seat_no in enumerate(range(start_seat, end_seat + 1)):
        y_box = y_box + 30
        x_text = x_box + 15
        y_text = y_box + 15
        if i + 1 <= remove_seats_from_top:
            continue
        print(
            SEAT_TEMPLATE.format(
                seat_no=seat_no,
                x_box=x_box,
                y_box=y_box,
                x_text=x_text,
                y_text=y_text,
                category=get_seat_category(seat_no),
            )
        )
        if seat_no + remove_seats_from_bottom >= end_seat:
            break


import math


def get_pillar(x, y, r_in=26, r_out=30):
    """
    Draw two concentric octagons with flat top.

    Args:
        r_out: Outer octagon radius
        r_in: Inner octagon radius
        x: X center position
        y: Y center position

    Returns:
        SVG string for the two octagons
    """
    # Calculate octagon points with flat top (rotated 22.5°)
    angle_offset = math.radians(22.5)

    # Outer octagon points
    outer_points = []
    for i in range(8):
        angle = angle_offset + i * math.radians(45)
        px = r_out * math.cos(angle)
        py = r_out * math.sin(angle)
        outer_points.append(f"{px:.1f},{py:.1f}")

    # Inner octagon points
    inner_points = []
    for i in range(8):
        angle = angle_offset + i * math.radians(45)
        px = r_in * math.cos(angle)
        py = r_in * math.sin(angle)
        inner_points.append(f"{px:.1f},{py:.1f}")

    svg = f'''  <g class="pillar" transform="translate({x}, {y})">
    <!-- Outer octagon (radius: {r_out}) with flat top -->
    <polygon 
      points="{" ".join(outer_points)}"
      fill="white"
      stroke="black"
      stroke-width="1"
    />
    
    <!-- Inner octagon (radius: {r_in}) with flat top -->
    <polygon 
      points="{" ".join(inner_points)}"
      fill="grey"
      stroke="black"
      stroke-width="0.5"
    />
  </g>'''

    return svg


def draw_row(
    seats: list[None | str | int], row: int, x_offset: int = 0, y_offset: int = 0
):
    x_box = x_offset - 30  # correct for first iter in for loop
    y_box = y_offset + row * 45
    for seat in seats:
        x_box += 30
        x_text = x_box + 15
        y_text = y_box + 15
        if seat is None:
            continue
        elif seat == "pillar":
            x_box += 30
            x_text = x_box + 15
            print(get_pillar(x_box, y_text))
        else:
            seat = int(seat)
            print(
                SEAT_TEMPLATE.format(
                    seat_no=seat,
                    x_box=x_box,
                    y_box=y_box,
                    x_text=x_text,
                    y_text=y_text,
                    category=get_seat_category(seat),
                )
            )


print(
    '<svg id="seats" width="1200" height="auto" viewBox="150 0 2000 2000" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">'
)

EINGANG = 4 * [None]
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        *range(1630, 1701, 2),
        *EINGANG,
        *range(1702, 1727, 2),
    ],
    0,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1554, 1573, 2),
        None,
        None,
        None,
        *range(1574, 1611, 2),
        None,
        None,
        *EINGANG,
        None,
        None,
        *range(1612, 1627, 2),
        None,
        None,
    ],
    1,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        "pillar",
        None,
        *range(1080, 1095, 2),
        "pillar",
        None,
        None,
        *range(1180, 1193, 2),
        "pillar",
        1194,
        *range(1296, 1309, 2),
        None,
        "pillar",
        None,
        None,
        *EINGANG,
        None,
        None,
        "pillar",
    ],
    4,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1060, 1079, 2),
        None,
        None,
        *range(1160, 1179, 2),
        *range(1272, 1295, 2),
        *EINGANG,
        *range(1452, 1469, 2),
    ],
    5,
)

draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1040, 1059, 2),
        None,
        None,
        *range(1140, 1159, 2),
        *range(1248, 1271, 2),
        *EINGANG,
        *range(1434, 1451, 2),
    ],
    6,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1020, 1039, 2),
        None,
        None,
        *range(1120, 1139, 2),
        *range(1224, 1247, 2),
        *EINGANG,
        *range(1416, 1433, 2),
    ],
    7,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1000, 1019, 2),
        None,
        None,
        *range(1100, 1119, 2),
        *range(1200, 1223, 2),
        *EINGANG,
        *range(1400, 1413, 2),
        None,
        None,
    ],
    8,
)


create_mittelschiff_column(
    120,
    100,
    101,
    119,
    MITTELSCHIFF_START_COLUMN + 0,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    140,
    122,
    121,
    141,
    MITTELSCHIFF_START_COLUMN + 1,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    162,
    142,
    143,
    161,
    MITTELSCHIFF_START_COLUMN + 2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    182,
    164,
    163,
    183,
    MITTELSCHIFF_START_COLUMN + 3,
    remove_seats_from_top=3,
    remove_seats_from_bottom=3,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    198,
    178,
    179,
    197,
    MITTELSCHIFF_START_COLUMN + 4,
    remove_seats_from_top=3,
    remove_seats_from_bottom=3,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    212,
    194,
    193,
    213,
    MITTELSCHIFF_START_COLUMN + 5,
    remove_seats_from_top=1,
    remove_seats_from_bottom=1,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    234,
    214,
    215,
    233,
    MITTELSCHIFF_START_COLUMN + 6,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    254,
    236,
    235,
    255,
    MITTELSCHIFF_START_COLUMN + 7,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    276,
    256,
    257,
    275,
    MITTELSCHIFF_START_COLUMN + 8,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    296,
    278,
    277,
    297,
    MITTELSCHIFF_START_COLUMN + 9,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    318,
    298,
    299,
    317,
    MITTELSCHIFF_START_COLUMN + 10,
    remove_seats_from_top=3,
    remove_seats_from_bottom=3,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    332,
    314,
    313,
    333,
    MITTELSCHIFF_START_COLUMN + 11,
    remove_seats_from_top=3,
    remove_seats_from_bottom=3,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    348,
    328,
    329,
    347,
    MITTELSCHIFF_START_COLUMN + 12,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    368,
    350,
    349,
    369,
    MITTELSCHIFF_START_COLUMN + 13,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    390,
    370,
    371,
    389,
    MITTELSCHIFF_START_COLUMN + 14,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    410,
    392,
    391,
    411,
    MITTELSCHIFF_START_COLUMN + 15,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    432,
    412,
    413,
    431,
    MITTELSCHIFF_START_COLUMN + 16,
    remove_seats_from_top=2,
    remove_seats_from_bottom=3,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    450,
    430,
    429,
    447,
    MITTELSCHIFF_START_COLUMN + 17,
    remove_seats_from_top=3,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    464,
    446,
    445,
    465,
    MITTELSCHIFF_START_COLUMN + 18,
    remove_seats_from_top=2,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    482,
    462,
    463,
    481,
    MITTELSCHIFF_START_COLUMN + 19,
    remove_seats_from_top=2,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    498,
    480,
    479,
    499,
    MITTELSCHIFF_START_COLUMN + 20,
    remove_seats_from_top=2,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)
create_mittelschiff_column(
    522,
    496,
    497,
    509,
    MITTELSCHIFF_START_COLUMN + 21,
    remove_seats_from_top=11,
    remove_seats_from_bottom=4,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=MITTELSCHIFF_Y_OFFSET,
)

create_chor_column(
    598,
    608,
    CHOR_START_COLUMN,
    remove_seats_from_top=2,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=CHOR_Y_OFFSET,
)
create_chor_column(
    606,
    616,
    CHOR_START_COLUMN + 1,
    remove_seats_from_top=1,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=CHOR_Y_OFFSET,
)
create_chor_column(
    615,
    625,
    CHOR_START_COLUMN + 2,
    remove_seats_from_top=0,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=CHOR_Y_OFFSET,
)
create_chor_column(
    624,
    634,
    CHOR_START_COLUMN + 3,
    remove_seats_from_top=0,
    remove_seats_from_bottom=2,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=CHOR_Y_OFFSET,
)
create_chor_column(
    633,
    643,
    CHOR_START_COLUMN + 4,
    remove_seats_from_top=0,
    remove_seats_from_bottom=0,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=CHOR_Y_OFFSET,
)
create_chor_column(
    644,
    654,
    CHOR_START_COLUMN + 5,
    remove_seats_from_top=0,
    remove_seats_from_bottom=0,
    x_offset=MITTELSCHIFF_X_OFFSET,
    y_offset=CHOR_Y_OFFSET,
)


draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1001, 1020, 2),
        None,
        None,
        *range(1101, 1120, 2),
        *range(1201, 1228, 2),
        *EINGANG,
        *range(1401, 1420, 2),
    ],
    SEITSCHIFF_LINKS_START_ROW,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1021, 1040, 2),
        None,
        None,
        *range(1121, 1140, 2),
        *range(1229, 1256, 2),
        *EINGANG,
        *range(1421, 1440, 2),
    ],
    SEITSCHIFF_LINKS_START_ROW + 1,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1041, 1060, 2),
        None,
        None,
        *range(1141, 1160, 2),
        *range(1257, 1284, 2),
        *EINGANG,
        *range(1441, 1460, 2),
    ],
    SEITSCHIFF_LINKS_START_ROW + 2,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        *range(1061, 1080, 2),
        None,
        None,
        *range(1161, 1180, 2),
        *range(1285, 1312, 2),
        *EINGANG,
        *range(1461, 1480, 2),
    ],
    SEITSCHIFF_LINKS_START_ROW + 3,
)
draw_row(
    [
        *EINGANG,
        None,
        None,
        None,
        "pillar",
        None,
        None,
        *range(1081, 1096, 2),
        "pillar",
        None,
        None,
        *range(1181, 1194, 2),
        "pillar",
        1195,
        *range(1313, 1330, 2),
        "pillar",
        None,
        None,
        None,
        *EINGANG,
        None,
        None,
        None,
        "pillar",
    ],
    SEITSCHIFF_LINKS_START_ROW + 4,
)


draw_row(
    [
        *EINGANG,
        None,
        None,
        *range(1569, 1598, 2),
        None,
        None,
        *range(1599, 1640, 2),
        None,
        None,
        *EINGANG,  # bigger EINGANG
        None,
        None,
        None,
        None,
        None,
        *range(1641, 1656, 2),
    ],
    SEITSCHIFF_LINKS_START_ROW + 7,
)
draw_row(
    [
        *EINGANG,
        *range(1657, 1742, 2),
        *EINGANG,
        None,
        None,
        1743,
        1745,
        None,
        *range(1747, 1761, 2),
    ],
    SEITSCHIFF_LINKS_START_ROW + 8,
)

print(f'''
  <g class="stage">
    <rect class="stage-box" y="{17 * 30}" x="{10 * 30}" height="{20 * 30}px" width="{10 * 30}px" fill="white" stroke="black" stroke-width="1px"/>
    <text class="stage-label" font-size="40px" y="{27 * 30 + 10}" x="{13 * 30 + 10}">Bühne</text>
  </g>
''')

for y in [17, 37]:
    for x in [10, 20, 30, 40, 50]:
        print(get_pillar(x * 30, y * 30))


print("</svg>")
