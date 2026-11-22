"""Day marker on both scales, across several dates (?rects=1 probe)."""
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
    marks = {}
    for line in out.splitlines():
        m = re.match(r'console\.log: "rect (ymark|gmark) (\S+) \S+ \S+ \S+ cell (\S+) (\S+)"', line)
        if m:
            marks[m.group(1)] = (int(m.group(2)), int(m.group(3)), int(m.group(4)))
    if not marks:
        print('%-12s no markers (day out of time?)' % DATE)
        continue
    # day 365 belongs to no moon and no month of the 13-moon year
    y, gm = marks.get('ymark'), marks.get('gmark')
    if not (y and gm):
        print('%-12s only one marker: %s' % (DATE, sorted(marks)))
        continue
    delta = abs(y[0] - gm[0])
    print('%-12s moon x=%-4d (%4.1f%% of its cell) · gregorian x=%-4d · delta %d px %s'
          % (DATE, y[0], (y[0] - y[1] + 1) / y[2] * 100, gm[0], delta,
             'OK' if delta <= 1 else 'MISALIGNED'))
