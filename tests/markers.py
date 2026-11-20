"""Raya del día en las dos escalas, a varias fechas (sonda ?rects=1)."""
import os
import re
import sys

from check import browser

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, 'tests', 'work')
os.makedirs(WORK, exist_ok=True)

for DATE in sys.argv[1:] or ['2026-07-25', '2026-07-26', '2026-11-01', '2027-02-15']:
    out = browser('file://%s/index.html?rects=1&lang=es&d=%s' % (BASE, DATE),
                  os.path.join(WORK, '_rects.png'), 1280, 2900, capture=True)
    gcur = ymark = None
    for line in out.splitlines():
        m = re.match(r'console\.log: "rect gcur (\S+)', line)
        if m:
            gcur = int(m.group(1))
        m = re.match(r'console\.log: "rect ymark (\S+) \S+ \S+ \S+ cell (\S+) (\S+)"', line)
        if m:
            ymark = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    if ymark:
        moon = 'raya en la luna al %.1f%% de la celda' % ((ymark[0] - ymark[1] + 1) / ymark[2] * 100)
    else:
        moon = 'sin raya en la luna'
    print('%-12s gregoriana: %-8s · %s'
          % (DATE, ('x=%d' % gcur) if gcur is not None else 'sin raya', moon))
