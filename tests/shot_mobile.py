"""Screenshot at 390 px wide (mobile), saved in tests/shots/."""
import os
import sys

from check import browser

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(BASE, 'tests', 'shots')
os.makedirs(SHOTS, exist_ok=True)

lang = sys.argv[1] if len(sys.argv) > 1 else 'es'
browser('file://%s/index.html?lang=%s&d=2026-11-01' % (BASE, lang),
        os.path.join(SHOTS, 'mobile_%s.png' % lang), 390, 4200)
print('tests/shots/mobile_%s.png' % lang)
