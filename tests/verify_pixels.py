"""Pixel check that the two year scales line up vertically.

The year card draws the same span of time twice: the 13 moons on top (28 days
each) and the Gregorian months below. The promise is that a date falls on the
same x in both rows, so this looks at the image rather than the DOM — which
check.py already covers:

  1. the gold marker exists in each row, and both are on the same x;
  2. the Gregorian marker lands where the day of the year says it should;
  3. the day cell is highlighted in both rows;
  4. every cell wide enough has its label drawn.

Usage: python3 tests/verify_pixels.py [YYYY-MM-DD] [lang] [width]
"""
import datetime
import os
import re
import sys

from check import browser, read_png

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, 'tests', 'work')
os.makedirs(WORK, exist_ok=True)

WHEN = sys.argv[1] if len(sys.argv) > 1 else '2026-11-01'
LANG = sys.argv[2] if len(sys.argv) > 2 else 'es'
W = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
H = 2900

GOLD = (229, 192, 123)
INK = 120                       # rgb sum that already stands out from the bg
TOL = 30

# --- geometry declared by the page itself ---------------------------------
out = browser('file://%s/index.html?rects=1&lang=%s&d=%s' % (BASE, LANG, WHEN),
              os.path.join(WORK, '_vp_rects.png'), W, H, capture=True)
rects, cells = {}, {}
for line in out.splitlines():
    m = re.match(r'console\.log: "rect (\w+) (-?\d+) (-?\d+) (\d+) (\d+)"', line)
    if m:
        rects[m.group(1)] = tuple(int(m.group(i)) for i in range(2, 6))
    m = re.match(r'console\.log: "rect (ycell|gcell)(\d+) (-?\d+) (-?\d+) (\d+) (\d+)"', line)
    if m:
        cells.setdefault(m.group(1), {})[int(m.group(2))] = \
            tuple(int(m.group(i)) for i in range(3, 7))

if 'yearStrip' not in rects or 'gregTrack' not in rects:
    sys.exit('the two rows are missing from the geometry dump')

# --- the screenshot -------------------------------------------------------
png = os.path.join(WORK, '_vp_shot.png')
browser('file://%s/index.html?lang=%s&d=%s' % (BASE, LANG, WHEN), png, W, H)
w, h, ch, px = read_png(png)


def at(x, y):
    i = (y * w + x) * ch
    return (px[i], px[i + 1], px[i + 2]) if ch >= 3 else (px[i], px[i], px[i])


def warm_line(box):
    """x of the day marker inside a box, and how much of the row it spans.

    The marker is a gold gradient running behind the number and the name, so it
    is neither flat-coloured nor continuous. The warmest column (red - blue) is
    found first, then measured across how many rows that column is warmer than
    the median of its own row: that tells a marker crossing the cell from a
    patch of text.
    """
    x0, y0, ww, hh = box
    cols = []
    for x in range(x0, x0 + ww):
        s = 0
        for y in range(y0, y0 + hh):
            r, g, b = at(x, y)
            s += r - b
        cols.append((s / hh, x))
    best, mx = max(cols)
    span = 0
    for y in range(y0, y0 + hh):
        row = []
        for x in range(x0, x0 + ww):
            r, g, b = at(x, y)
            row.append(r - b)
        row.sort()
        med = row[len(row) // 2]
        r, g, b = at(mx, y)
        if r - b > med + 12:
            span += 1
    return mx, span / hh, best


moon_box, greg_box = rects['yearStrip'], rects['gregTrack']
mx, mcover, mwarm = warm_line(moon_box)
gx, gcover, gwarm = warm_line(greg_box)

print('screenshot %dx%d · %s · %s' % (w, h, WHEN, LANG))
print('moon row      y=%d..%d  marker at x=%d · spans %d%% of the row'
      % (moon_box[1], moon_box[1] + moon_box[3], mx, mcover * 100))
print('gregorian row y=%d..%d  marker at x=%d · spans %d%% of the row'
      % (greg_box[1], greg_box[1] + greg_box[3], gx, gcover * 100))

fails = []

# --- 2. the Gregorian marker lands where it should ------------------------
d = datetime.date.fromisoformat(WHEN)
start = datetime.date(d.year, 7, 26)
if d < start:
    start = datetime.date(d.year - 1, 7, 26)
doy = (d - start).days + 1

if doy > 364:
    print('\n%s is the day out of time: there must be no marker' % WHEN)
    if mcover > .5 or gcover > .5:
        fails.append('marker on the day out of time')
else:
    # --- 1. both markers on the same x -----------------------------------
    delta = abs(mx - gx)
    print('\n1. vertical alignment: %d px apart %s'
          % (delta, 'OK' if delta <= 2 else 'FAIL'))
    if delta > 2:
        fails.append('the two markers are %d px apart' % delta)
    # the marker must span its row top to bottom, not be a patch of text
    for label, cov in (('moons', mcover), ('gregorian', gcover)):
        if cov < 0.70:
            fails.append('the %s marker spans only %d%% of its row'
                         % (label, cov * 100))

    exp = greg_box[0] + (doy - 0.5) / 364 * greg_box[2]
    err = gx - exp
    print('\n2. day %d of the 13-moon year · expected x≈%.0f, measured x=%d · %s (%+.1f px)'
          % (doy, exp, gx, 'OK' if abs(err) < 6 else 'FAIL', err))
    if abs(err) >= 6:
        fails.append('the Gregorian marker is %+.1f px off target' % err)

    # --- 3. the day cell, highlighted in both rows -----------------------
    def warmth(box):
        """mean of (red - blue): the gold highlight rises, the bg is bluish."""
        n = s = 0
        for y in range(box[1] + 4, box[1] + box[3] - 4):
            for x in range(box[0] + 2, box[0] + box[2] - 2):
                r, g, b = at(x, y)
                s += r - b
                n += 1
        return s / max(n, 1)

    print('\n3. day cell highlighted:')
    for name, key, mark_x in (('moons', 'ycell', mx), ('gregorian', 'gcell', gx)):
        cs = cells.get(key, {})
        cur = [i for i, b in cs.items() if b[0] <= mark_x < b[0] + b[2]]
        if not cur:
            fails.append('the %s marker falls in no cell' % name)
            continue
        own = warmth(cs[cur[0]])
        others = [warmth(b) for i, b in cs.items() if i != cur[0]]
        mean = sum(others) / max(len(others), 1)
        good = own > mean + 4
        print('   %-11s cell %2d · warmth %.0f vs %.0f for the rest · %s'
              % (name, cur[0] + 1, own, mean, 'OK' if good else 'FAIL'))
        if not good:
            fails.append('the day cell is not highlighted in %s' % name)

# --- 4. labels drawn where they fit ---------------------------------------
print('\n4. labels per cell')
blank = []
for key in ('ycell', 'gcell'):
    for i, b in sorted(cells.get(key, {}).items()):
        if b[2] < 26:
            continue
        y0 = b[1] + int(b[3] * 0.2)
        y1 = b[1] + int(b[3] * 0.85)
        ink = sum(1 for y in range(y0, y1)
                  for x in range(b[0] + 2, b[0] + b[2] - 2)
                  if sum(at(x, y)) > INK)
        if ink < 6:
            blank.append('%s%d (%dpx)' % (key[0], i + 1, b[2]))
print('   cells wide enough with no ink: %s'
      % (', '.join(blank) or 'none'))
if blank:
    fails.append('missing labels: %s' % ', '.join(blank))

print('\n%s' % ('ALL OK' if not fails else 'FAILURES: ' + ' · '.join(fails)))
sys.exit(0 if not fails else 1)
