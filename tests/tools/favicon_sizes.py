#!/usr/bin/env python3
"""How the tab icon degrades: does the ring survive at 16 px?

The icon is drawn once and scaled by the browser, so the question is not
whether the detail exists but whether it is still visible at the size a tab
actually uses. Renders the static href at 16, 32 and 64 px and reports, in
pixels, the warmest point of the ring band and the contrast between the lit and
the dark half — the phase has to stay readable at every size.

  python3 tests/tools/favicon_sizes.py           # 16, 32 and 64 px
  python3 tests/tools/favicon_sizes.py 16 48     # only these
"""

import math
import os
import re
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
from check import BASE, WORK, browser, read_png

html = open(os.path.join(BASE, 'index.html'), encoding='utf-8').read()
href = re.search(r'<link rel="icon" id="favicon" href="([^"]*)"', html).group(1)

SIZES = [int(a) for a in sys.argv[1:]] or [16, 32, 64]

print(' size   ring warmth   lit    dark   contrast')
for size in SIZES:
    page = ("<!DOCTYPE html><html><body style='margin:0;background:#fff'>"
            "<img src=\"%s\" width='%d' height='%d' style='display:block'>"
            "</body></html>" % (href, size, size))
    path = os.path.join(WORK, 'favicon_%d.html' % size)
    open(path, 'w', encoding='utf-8').write(page)
    png = os.path.join(WORK, 'favicon_%d.png' % size)
    browser('file://%s' % path, png, size, size)

    w, h, ch, px = read_png(png)
    cx = cy = w / 2.0

    # the warmest pixel anywhere in the band the ring occupies
    warmth = 0
    for step in range(int(12 * w / 32) * 4, int(15 * w / 32) * 4):
        r = step / 4.0
        for k in range(72):
            a = 2 * math.pi * k / 72
            x = int(round(cx + r * math.cos(a)))
            y = int(round(cy + r * math.sin(a)))
            if not (0 <= x < w and 0 <= y < h):
                continue
            i = (y * w + x) * ch
            warmth = max(warmth, px[i] - px[i + 2])

    def lum(x, y):
        i = (y * w + x) * ch
        return (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255.0

    # sample inside the disc on both sides of the terminator
    lit = lum(int(cx - 3 * w / 32), int(cy))
    dark = lum(int(cx + 3 * w / 32), int(cy))
    print('%4d px %8d      %.2f   %.2f    %.2f'
          % (size, warmth, lit, dark, abs(lit - dark)))