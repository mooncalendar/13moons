#!/usr/bin/env python3
"""Generate the static tab icon — the copy that lives in index.html.

The browser shows the href in `index.html` before `app.js` runs, so it cannot
come from `faviconSVG()`; it has to be written out by hand. This is the hand.
The numbers (ring radius, dash, rotation) are computed rather than pasted, so
the ring stays closed: 13 dashes over the exact circumference, rotated half a
dash so the top of the circle falls in the middle of a segment instead of on a
gap.

  uv run python tests/tools/favicon_gen.py           # print the SVG
  uv run python tests/tools/favicon_gen.py --write   # rewrite the href in index.html

The crater list is the same as ICON_CRATERS in app.js — it is duplicated
because neither copy can be at runtime the source of the other.
tests/check.py --only favicon catches them drifting apart.
"""

import math
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# last quarter: the left half lit, matching what the tests expect of the no-JS
# icon. Kept as an arc rather than a rectangle so it scales with the viewBox.
LIT = "M0 -1A1 1 0 0 0 0 1Z"

CRATERS = [(0.34, -0.28, 0.155), (-0.32, -0.36, 0.120),
           (-0.18, 0.34, 0.140), (0.40, 0.24, 0.100),
           (0.02, -0.04, 0.095), (-0.54, 0.10, 0.075)]

R_RING, STROKE, DASH, SEGMENTS = 13.9, 1.1, 4.0, 13


def build():
    """The icon as an SVG string, in the 32x32 grid the href uses."""
    circumference = 2 * math.pi * R_RING
    gap = circumference / SEGMENTS - DASH
    # start half a dash before the top, so a segment is centred at 12 o'clock
    rotate = -90.0 + (DASH / 2.0) / circumference * 360.0

    craters = ''.join("<circle cx='%.2f' cy='%.2f' r='%.3f'/>" % c
                      for c in CRATERS)

    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>"
        "<defs><linearGradient id='lit' x1='.3' y1='.05' x2='.85' y2='1'>"
        "<stop offset='0' stop-color='#fffaf0'/>"
        "<stop offset='1' stop-color='#dccdae'/></linearGradient>"
        "<clipPath id='face'><path d='%s'/></clipPath></defs>" % LIT
        + "<circle cx='16' cy='16' r='15' fill='#090a12'/>"
        # one dash per moon of the year
        + "<circle cx='16' cy='16' r='%.1f' fill='none' stroke='#e5c07b'"
        " stroke-opacity='.6' stroke-width='%.1f'"
        " stroke-dasharray='%.2f %.2f' transform='rotate(%.2f 16 16)'/>"
        % (R_RING, STROKE, DASH, gap, rotate)
        + "<g transform='translate(16 16) scale(13)'>"
        "<circle r='1' fill='#252a42'/>"
        "<circle r='.95' fill='none' stroke='#3d4568' stroke-opacity='.55'"
        " stroke-width='.1'/>"
        "<path d='%s' fill='url(#lit)'/>" % LIT
        # clipped to the lit face: craters only where the Sun lands
        + "<g clip-path='url(#face)' fill='#d6c6a4' fill-opacity='.8'>"
        + craters + "</g></g></svg>")


def href(svg):
    """The SVG as a data URI, encoding only what has to be encoded."""
    return ('data:image/svg+xml,'
            + svg.replace('#', '%23').replace('<', '%3C').replace('>', '%3E'))


def write(svg):
    """Replace the static href in index.html; returns the previous length."""
    path = os.path.join(BASE, 'index.html')
    src = open(path, encoding='utf-8').read()
    pattern = re.compile(r'(<link rel="icon" id="favicon" href=")[^"]*(">)')
    found = pattern.findall(src)
    if len(found) != 1:
        raise SystemExit('expected exactly one favicon link in index.html, '
                         'found %d' % len(found))
    new = href(svg)
    open(path, 'w', encoding='utf-8').write(
        pattern.sub(lambda m: m.group(1) + new + m.group(2), src))
    return len(new)


if __name__ == '__main__':
    svg = build()
    if '--write' in sys.argv[1:]:
        print('wrote %d chars into index.html' % write(svg))
    else:
        print(svg)