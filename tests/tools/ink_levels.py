import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from check import read_png
from datetime import date, timedelta

PNG = sys.argv[1]
LEFT, WIDTH = float(sys.argv[2]), float(sys.argv[3])
WHEN = date.fromisoformat(sys.argv[4] if len(sys.argv) > 4 else '2026-11-01')
SPAN = 364
start = date(WHEN.year, 7, 26) if WHEN >= date(WHEN.year, 7, 26) else date(WHEN.year - 1, 7, 26)

w, h, ch, px = read_png(PNG)


def at(x, y):
    i = (y * w + x) * ch
    return (px[i], px[i + 1], px[i + 2]) if ch >= 3 else (px[i], px[i], px[i])


# text row: the one with the most light pixels inside the strip
def band(y_from, y_to, left, width):
    best = (0, 0, 0)
    for y in range(y_from, y_to):
        n = sum(1 for x in range(int(left) + 4, int(left + width) - 4) if sum(at(x, y)) > 150)
        if n > best[0]:
            best = (n, y, y)
    return best


# locate the strip: gold marker 16..30 px wide
cands = []
for x in range(w):
    run = ys = 0
    for y in range(1900, h):
        r, g, b = at(x, y)
        if abs(r - 229) < 26 and abs(g - 192) < 26 and abs(b - 123) < 26:
            if run == 0:
                ys = y
            run += 1
            if 16 <= run <= 30:
                cands.append((run, x, ys))
        else:
            run = 0
run, mx, my = max(cands, key=lambda c: (c[2], c[0]))
y0, y1 = my + 4, my + run - 4
print('strip at y %d..%d (marker x=%d)' % (y0, y1, mx))

segs, i = [], 0
while i < SPAN:
    d0 = start + timedelta(days=i)
    n = 1
    while i + n < SPAN and (start + timedelta(days=i + n)).month == d0.month:
        n += 1
    segs.append((i, n, d0.strftime('%b').lower()))
    i += n

print('%-5s %s' % ('month', '   '.join('>%d' % t for t in (100, 150, 200, 300))))
for st, n, name in segs:
    xa = int(LEFT + st / SPAN * WIDTH) + 3
    xb = int(LEFT + (st + n) / SPAN * WIDTH) - 3
    xs = [sum(at(x, y)) for y in range(y0, y1) for x in range(xa, xb)]
    print('%-5s %s' % (name, '   '.join('%4d' % sum(1 for v in xs if v > t) for t in (100, 150, 200, 300))))