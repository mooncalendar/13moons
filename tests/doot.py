"""Atajo: el desplegable del día fuera del tiempo vive ahora en check.py.

`python3 tests/doot.py` sigue funcionando y equivale a
`python3 tests/check.py --only doot`.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import check

if __name__ == '__main__':
    langs = [l.strip() for l in (sys.argv[1].split(',') if len(sys.argv) > 1 else check.LANGS)]
    os.makedirs(check.WORK, exist_ok=True)
    sys.exit(1 if check.test_doot(langs) else 0)
