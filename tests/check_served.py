"""Serve the artefact the way Pages will and run the suite against that copy.

Replicates the workflow steps: copy only `index.html`, `app.js` and `i18n.js`
to a temporary directory, serve them under `/13moons/` on a local port and run
`tests/check.py --base` pointing there.

The difference from plain `tests/check.py` is which copy is the original: the
normal suite opens the working directory over `file://` (where `tests/` and
`docs/` live side by side), and this checks exactly what gets published —
relative paths included, because the site hangs off a subdirectory, not the
root.

Usage: python3 tests/check_served.py [-l es,de] [--shots]
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

# 1. the artefact, same as in the workflow
shutil.rmtree(ROOT, ignore_errors=True)
os.makedirs(APP)
for f in FILES:
    src = os.path.join(BASE, f)
    if not os.path.isfile(src) or os.path.getsize(src) == 0:
        sys.exit('missing %s' % f)
    shutil.copy2(src, os.path.join(APP, f))
open(os.path.join(APP, '.nojekyll'), 'w').close()
print('artefact: %s (%d files)' % (os.path.relpath(APP, BASE), len(FILES) + 1),
      flush=True)

# 2. local server on a free port
with socket.socket() as s:
    s.bind(('127.0.0.1', 0))
    PORT = s.getsockname()[1]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):                      # no noise in the output
        pass


handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/13moons' % PORT
print('serving: %s\n' % URL, flush=True)

# 3. the suite, against the artefact
try:
    rc = subprocess.call([sys.executable, os.path.join(BASE, 'tests', 'check.py'),
                          '--base', URL] + sys.argv[1:], cwd=BASE)
finally:
    srv.shutdown()
sys.exit(rc)