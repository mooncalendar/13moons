import math
from datetime import datetime, timezone
from verify import sun_pos, moon_pos, jd_from_dt, elongation

RAD = math.pi / 180

# USNO 2026 seasons (UTC)
ref = [
    ("Equinox marzo",   datetime(2026, 3, 20, 14, 46, tzinfo=timezone.utc), 0),
    ("Solsticio junio", datetime(2026, 6, 21, 8, 24, tzinfo=timezone.utc), 90),
    ("Equinoccio sept", datetime(2026, 9, 23, 0, 5, tzinfo=timezone.utc), 180),
    ("Solsticio dic",   datetime(2026, 12, 21, 20, 50, tzinfo=timezone.utc), 270),
]
print("Sol absolute longitude check (USNO seasons):")
for name, dt, want in ref:
    jd = jd_from_dt(dt)
    got = sun_pos(jd)
    diff = ((got - want + 540) % 360) - 180
    print(f"  {name:16s} want {want:5.1f}  got {got:7.3f}  delta {diff*60:+.1f}' ")

# moon sign check for 2026-11-20 12:00 UTC
dt = datetime(2026, 11, 20, 12, 0, tzinfo=timezone.utc)
jd = jd_from_dt(dt)
lm, bm = moon_pos(jd)          # sin corrección de DeltaT (UT directo)
ls = sun_pos(jd)
print(f"\n2026-11-20 12Z: sun {ls:.3f}  moon {lm:.3f}  elong {((lm-ls)%360):.3f}")
print(f"  signo: {lm/30:.3f} -> idx {int(lm//30)}  grado {lm%30:.2f}")
