"""Exact geometry of the key pieces, dumped from ?rects=1."""
import os
import re
import sys

from check import browser

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, 'tests', 'work')
os.makedirs(WORK, exist_ok=True)

W = int(sys.argv[1]) if len(sys.argv) > 1 else 390
H = int(sys.argv[2]) if len(sys.argv) > 2 else 4200
LANG = sys.argv[3] if len(sys.argv) > 3 else 'es'
out = browser('file://%s/index.html?rects=1&lang=%s&d=2026-11-01' % (BASE, LANG),
              os.path.join(WORK, '_rects.png'), W, H, capture=True)
for line in out.splitlines():
    m = re.match(r'console\.log: "rect (\S+) (-?\d+) (-?\d+) (\d+) (\d+)"', line)
    if m:
        print('%-12s x=%4s y=%5s w=%4s h=%3s' % m.groups())
