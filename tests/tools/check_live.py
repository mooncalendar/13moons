#!/usr/bin/env python3
"""Is the published site serving the current working tree?

Pages deploys asynchronously: after a push the site can lag for a minute, and
if a deploy fails the old copy keeps answering — looking perfectly healthy
while being out of date. Comparing the served bytes against the local files
answers "is what I am looking at the code I just wrote?" without guessing.

Only the three files the workflow copies are compared, and by hash, so a
trailing newline or a comment typo shows up.

  uv run python tests/tools/check_live.py
  uv run python tests/tools/check_live.py --base https://example.org/13moons/
"""

import argparse
import hashlib
import os
import sys
import urllib.error
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_BASE = 'https://mooncalendar.github.io/13moons/'
# the files the publish workflow puts in the artefact
FILES = ('index.html', 'app.js', 'i18n.js')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    ap = argparse.ArgumentParser(description='compare the published site with '
                                             'the working tree')
    ap.add_argument('--base', default=DEFAULT_BASE,
                    help='URL the site is served from (default: %s)' % DEFAULT_BASE)
    ap.add_argument('--timeout', type=float, default=30.0)
    args = ap.parse_args()
    base = args.base.rstrip('/') + '/'

    print('published: %s' % base)
    fails = 0
    for name in FILES:
        path = os.path.join(BASE, name)
        if not os.path.isfile(path):
            print('FAIL %-12s missing locally' % name)
            fails += 1
            continue
        local = open(path, 'rb').read()
        try:
            live = urllib.request.urlopen(base + name, timeout=args.timeout).read()
        except (urllib.error.URLError, OSError) as exc:
            print('FAIL %-12s could not be fetched: %s' % (name, exc))
            fails += 1
            continue

        same = digest(local) == digest(live)
        if not same:
            fails += 1
        print('%s %-12s %-8s local %6d B  live %6d B'
              % ('OK  ' if same else 'FAIL', name,
                 'same' if same else 'DIFFERS', len(local), len(live)))
        if not same:
            # the live copy is the old one and the deploy is probably still
            # running, or it failed: say which, from the sizes
            note = ('live is smaller — an older revision' if len(live) < len(local)
                    else 'live is larger — local edits not pushed yet'
                    if len(live) > len(local) else 'same size, different bytes')
            print('     %s' % note)

    print()
    print('ALL OK' if not fails else '%d file(s) out of step' % fails)
    print('(a push takes a minute to propagate; re-run before assuming failure)'
          if fails else '')
    return 0 if not fails else 1


if __name__ == '__main__':
    sys.exit(main())