"""Prototype + validation of the math that will power the web app.

1. Dreamspell / Sincronario 13 Lunas  (starroot anchors)
2. Moon ecliptic longitude + phase   (USNO 2026 phase table)
"""
import math
from datetime import datetime, timedelta, timezone

# ---------------------------------------------------------------- Dreamspell
EPOCH = datetime(1987, 7, 26, tzinfo=timezone.utc)   # Kin 34, moon 1 day 1
EPOCH_KIN = 34


def is_leap(y):
    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)


def counted_days(d0, d1):
    """Days from d0 to d1 ignoring every Feb 29 (they are 0.0 Hunab Ku)."""
    n = (d1 - d0).days
    # count Feb 29 in (d0, d1]
    y = d0.year
    total = 0
    while y <= d1.year:
        if is_leap(y):
            feb29 = datetime(y, 2, 29, tzinfo=timezone.utc)
            if d0 < feb29 <= d1:
                total += 1
        y += 1
    return n - total


def dreamspell(date):
    d = date
    if date.month == 2 and date.day == 29:          # same as Feb 28
        d = datetime(date.year, 2, 28, tzinfo=timezone.utc)
    kin = (EPOCH_KIN - 1 + counted_days(EPOCH, d)) % 260 + 1
    # 13-moon year starts on the July 26 on/before d
    start_year = d.year if (d.month, d.day) >= (7, 26) else d.year - 1
    start = datetime(start_year, 7, 26, tzinfo=timezone.utc)
    doy = counted_days(start, d) + 1                 # 1..364, 365 = day out of time
    moon = (doy - 1) // 28 + 1
    day = (doy - 1) % 28 + 1
    return dict(kin=kin, doy=doy, moon=moon, day=day, ns=d.year - 1987 + (1 if (d.month, d.day) >= (7, 26) else 0))


for iso, want in [("1987-07-26", 34), ("2026-11-20", 86), ("2028-02-29", 31), ("2012-12-21", None)]:
    y, m, dd = map(int, iso.split("-"))
    r = dreamspell(datetime(y, m, dd, tzinfo=timezone.utc))
    ok = "" if want is None else ("OK" if r["kin"] == want else "MISMATCH")
    print(f"{iso}: kin {r['kin']:3d}  moon {r['moon']:2d} day {r['day']:2d}  NS{r['ns']}  {ok}")

print("starroot: 2028-02-29 -> kin 31, moon 8 day 22")
print("starroot: 2026-11-20 -> kin 86, moon 5 day 6")

# ---------------------------------------------------------------- Astronomy
RAD = math.pi / 180.0


def jd_from_dt(dt):
    """UTC datetime -> Julian Day."""
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24
    if m <= 2:
        y -= 1
        m += 12
    A = y // 100
    B = 2 - A + A // 4
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + B - 1524.5


def moon_pos(jd):
    T = (jd - 2451545.0) / 36525.0
    Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T**2 + T**3 / 538841 - T**4 / 65194000
    D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T**2 + T**3 / 545868 - T**4 / 113065000
    M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T**2 + T**3 / 24490000
    Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T**2 + T**3 / 69699 - T**4 / 14712000
    F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T**2 - T**3 / 3526000 + T**4 / 863310000
    terms = [
        (6288774, 0, 0, 1, 0), (1274027, 2, 0, -1, 0), (658314, 2, 0, 0, 0),
        (213618, 0, 0, 2, 0), (-185116, 0, 1, 0, 0), (-114332, 0, 0, 0, 2),
        (58793, 2, 0, -2, 0), (57066, 2, -1, -1, 0), (53322, 2, 0, 1, 0),
        (45758, 2, -1, 0, 0), (-40923, 0, 1, -1, 0), (-34720, 1, 0, 0, 0),
        (-30383, 0, 1, 1, 0), (15327, 2, 0, 0, -2), (-12528, 0, 0, 1, 2),
        (10980, 0, 0, 1, -2), (10675, 4, 0, -1, 0), (10034, 0, 0, 3, 0),
        (8548, 4, -1, -2, 0), (-7888, 2, 1, -1, 0), (-6766, 2, 1, 0, 0),
        (-5163, 1, 0, -1, 0), (4987, 1, 1, 0, 0), (4036, 2, -1, 1, 0),
        (3994, 2, 0, 2, 0), (3861, 4, 0, 0, 0), (3665, 2, 0, -3, 0),
        (-2689, 0, 1, -2, 0), (-2602, 2, 0, -1, 2), (2390, 2, -1, -2, 0),
        (-2348, 1, 0, 1, 0), (2236, 2, -2, 0, 0), (-2120, 0, 1, 2, 0),
        (-2069, 0, 2, 0, 0), (2048, 2, -2, -1, 0), (-1773, 2, 0, 1, -2),
        (-1595, 2, 0, 0, 2), (1215, 4, -1, -1, 0), (-1110, 0, 0, 2, 2),
    ]
    lon = Lp
    for c, d_, m_, mp_, f_ in terms:
        lon += c * math.sin((d_ * D + m_ * M + mp_ * Mp + f_ * F) * RAD) / 1e6
    # latitude
    lat_terms = [
        (5128122, 0, 0, 0, 1), (280602, 0, 0, 1, 1), (277693, 0, 0, 1, -1),
        (173237, 2, 0, 0, -1), (55413, 2, 0, -1, 1), (46271, 2, 0, -1, -1),
        (32573, 2, 0, 0, 1), (17198, 0, 0, 2, 1), (9266, 2, 0, 1, -1),
        (8822, 0, 0, 2, -1), (8216, 2, -1, 0, -1), (4324, 2, 0, -2, -1),
        (4200, 2, 0, 1, 1), (-3359, 2, 1, 0, -1), (2463, 2, -1, -1, 1),
        (2211, 2, -1, 0, 1), (2065, 2, -1, -1, -1), (-1870, 0, 1, -1, -1),
        (1828, 4, 0, -1, -1), (-1794, 0, 1, 0, 1), (-1749, 0, 0, 0, 3),
        (-1565, 0, 1, -1, 1), (-1491, 1, 0, 0, 1), (-1475, 0, 1, 1, 1),
        (-1410, 0, 1, 1, -1), (-1344, 0, 1, 0, -1), (-1335, 1, 0, 0, -1),
        (1107, 0, 0, 3, 1), (1021, 4, 0, 0, -1), (833, 4, -1, -1, -1),
    ]
    lat = 0.0
    for c, d_, m_, mp_, f_ in lat_terms:
        lat += c * math.sin((d_ * D + m_ * M + mp_ * Mp + f_ * F) * RAD) / 1e6
    return lon % 360, lat


def sun_pos(jd):
    T = (jd - 2451545.0) / 36525.0
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T**2
    M = 357.52911 + 35999.05029 * T - 0.0001537 * T**2
    C = ((1.914602 - 0.004817 * T - 0.000014 * T**2) * math.sin(M * RAD)
         + (0.019993 - 0.000101 * T) * math.sin(2 * M * RAD)
         + 0.000289 * math.sin(3 * M * RAD))
    om = 125.04 - 1934.136 * T
    return (L0 + C - 0.00569 - 0.00478 * math.sin(om * RAD)) % 360


def elongation(jd):
    lm, bm = moon_pos(jd)
    ls = sun_pos(jd)
    return (lm - ls) % 360, bm


def phase_instants(year):
    """Find the 4 principal phases by scanning + bisection."""
    t0 = jd_from_dt(datetime(year, 1, 1, tzinfo=timezone.utc))
    targets = {"New Moon": 0.0, "First Quarter": 90.0, "Full Moon": 180.0, "Last Quarter": 270.0}
    out = []
    prev_jd = t0
    prev = elongation(t0)[0]
    step = 0.25          # 6 h
    jd = t0
    end = t0 + 366
    while jd < end:
        jd += step
        e = elongation(jd)[0]
        for name, tgt in targets.items():
            a = (prev - tgt) % 360
            b = (e - tgt) % 360
            if a > 180:      # convert to signed difference around target
                a -= 360
            if b > 180:
                b -= 360
            if a < 0 <= b and (b - a) < 30:
                lo, hi = prev_jd, jd
                for _ in range(40):
                    mid = (lo + hi) / 2
                    dm = (elongation(mid)[0] - tgt) % 360
                    if dm > 180:
                        dm -= 360
                    if dm < 0:
                        lo = mid
                    else:
                        hi = mid
                out.append((name, (lo + hi) / 2))
        prev, prev_jd = e, jd
    return out


def jd_to_dt(jd):
    jd += 0.5
    Z = math.floor(jd)
    F = jd - Z
    if Z < 2299161:
        A = Z
    else:
        alpha = math.floor((Z - 1867216.25) / 36524.25)
        A = Z + 1 + alpha - math.floor(alpha / 4)
    B = A + 1524
    C = math.floor((B - 122.1) / 365.25)
    D = math.floor(365.25 * C)
    E = math.floor((B - D) / 30.6001)
    day = B - D - math.floor(30.6001 * E) + F
    month = E - 1 if E < 14 else E - 13
    year = C - 4716 if month > 2 else C - 4715
    di = int(day)
    frac = (day - di) * 24
    h = int(frac)
    mi = int(round((frac - h) * 60))
    if mi == 60:
        mi = 0
        h += 1
    return datetime(year, month, di, h, mi, tzinfo=timezone.utc)


# USNO reference, UTC
ref = [
    ("Full Moon", 2026, 11, 24, "14:53"), ("New Moon", 2026, 11, 9, "07:02"),
    ("First Quarter", 2026, 11, 17, "11:48"), ("Last Quarter", 2026, 11, 1, "20:28"),
    ("New Moon", 2026, 1, 18, "19:52"), ("Full Moon", 2026, 1, 3, "10:03"),
]
calc = phase_instants(2026)
print("\nPhase check vs USNO (UTC):")
for name, y, m, d, hm in ref:
    hh, mm = map(int, hm.split(":"))
    target = datetime(y, m, d, hh, mm, tzinfo=timezone.utc)
    best = min(calc, key=lambda p: abs(jd_from_dt(jd_to_dt(p[1])) - jd_from_dt(target)))
    got = jd_to_dt(best[1])
    diff = (got - target).total_seconds() / 60
    print(f"  {name:14s} ref {target:%Y-%m-%d %H:%M}  calc {got:%Y-%m-%d %H:%M}  delta {diff:+.1f} min  (name {best[0]})")

# moon longitude spot check
for iso in ["2026-11-20 12:00", "2026-01-01 00:00"]:
    dt = datetime.strptime(iso, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    lm, bm = moon_pos(jd_from_dt(dt))
    print(f"moon lon {iso} -> {lm:.4f} deg, lat {bm:.3f}")
