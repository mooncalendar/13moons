"""Sirve el artefacto como lo hará Pages y pasa la suite contra esa copia.

Replica los pasos del workflow: copia a un directorio temporal sólo
`index.html`, `app.js` e `i18n.js`, los sirve bajo `/13moons/` en un puerto
local y ejecuta `tests/check.py --base` apuntando ahí.

La diferencia con `tests/check.py` a secas es cuál es el original: la suite
normal abre el directorio de trabajo con `file://` (donde conviven `tests/` y
`docs/`), y esto comprueba justo lo que se publica —rutas relativas incluidas,
porque el sitio cuelga de un subdirectorio y no de la raíz.

Uso: python3 tests/check_served.py [-l es,de] [--shots]
"""
import functools
import http.server
import os
import shutil
import socket
import subprocess
import sys
import threading

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, 'tests', 'work')
ROOT = os.path.join(WORK, 'pages')
APP = os.path.join(ROOT, '13moons')
FILES = ('index.html', 'app.js', 'i18n.js')

# 1. el artefacto, igual que en el workflow
shutil.rmtree(ROOT, ignore_errors=True)
os.makedirs(APP)
for f in FILES:
    src = os.path.join(BASE, f)
    if not os.path.isfile(src) or os.path.getsize(src) == 0:
        sys.exit('falta %s' % f)
    shutil.copy2(src, os.path.join(APP, f))
open(os.path.join(APP, '.nojekyll'), 'w').close()
print('artefacto: %s (%d archivos)' % (os.path.relpath(APP, BASE), len(FILES) + 1),
      flush=True)

# 2. servidor local en un puerto libre
with socket.socket() as s:
    s.bind(('127.0.0.1', 0))
    PORT = s.getsockname()[1]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):                      # sin ruido en la salida
        pass


handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/13moons' % PORT
print('sirviendo: %s\n' % URL, flush=True)

# 3. la suite, contra el artefacto
try:
    rc = subprocess.call([sys.executable, os.path.join(BASE, 'tests', 'check.py'),
                          '--base', URL] + sys.argv[1:], cwd=BASE)
finally:
    srv.shutdown()
sys.exit(rc)