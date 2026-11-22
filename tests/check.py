#!/usr/bin/env python3
"""Automated tests for moon-calendar.

Everything is checked in a real headless Firefox against the published page,
no frameworks: the app itself exposes instrumented modes through the URL
(?selftest, ?barcode=1, ?barcode=layout) and this reads them back.

  python3 tests/check.py             # data + layout + selftest, 4 languages
  python3 tests/check.py --shots     # plus full-page screenshots
  python3 tests/check.py -l es,de    # only some languages

Exit code 0 if everything passes, 1 if anything fails.
"""

import argparse
import ast
import os
import re
import struct
import subprocess
import sys
import zlib

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# where the page is served from: this directory by default (file://), but
# --base points at any URL — a local server or the site published on Pages —
# and the same suite checks that original.
URL_BASE = 'file://' + BASE
WORK = os.path.join(BASE, 'tests', 'work')
PROFILE = os.path.join(BASE, 'tests', 'profile')
LANGS = ['es', 'pt', 'en', 'de']
ENV = dict(os.environ, MOZ_HEADLESS='1')

# values exposed by ?barcode=1, in order (12 bits per cell).
# (expected, label, optional tolerance)
DATA_CASES = [
    (34, 'kin 1987-07-26', 0), (86, 'kin 2026-11-20', 0),
    (31, 'kin 2028-02-29', 0), (31, 'kin 2028-02-28', 0),
    (207, 'kin 2012-12-21', 0), (0, 'moon on the day out of time', 0),
    (5, 'moon 2026-11-20', 0), (6, 'day 2026-11-20', 0),
    (22, 'day 2028-02-29', 0), (229, 'year bearer 2026', 0),
    (3389, 'moon longitude x1000', 50),      # ±0.05°: different series give 3389–3401
    (180, 'full moon elongation', 1),
    (12, 'constellation index', 0), (30, 'days in Nov 2026', 0),
]

# values exposed by ?barcode=layout, in order (14 bits per cell)
LAYOUT_NAMES = ['innerWidth', 'scrollWidth', 'scrollHeight', 'hero1.w', 'hero2.w',
                'hero2.left', 'card1.w', 'card3.right', 'days/row', 'yearStrip',
                'tzolkin', 'moonSvg.w', 'wheel.w', 'calCard.w', 'today', 'overflows',
                'gregSegs', 'gregWidth%', 'gregMarker', 'gregCur', 'gregLabelOut',
                'greg.left', 'greg.w', 'ymoonMark', 'ymoonPos%', 'markDelta']


# --- utilidades ------------------------------------------------------------

def ensure_profile():
    """Disposable Firefox profile with the console copied to stdout."""
    os.makedirs(PROFILE, exist_ok=True)
    prefs = os.path.join(PROFILE, 'user.js')
    want = ('user_pref("devtools.console.stdout.content", true);\n'
            'user_pref("browser.shell.checkDefaultBrowser", false);\n'
            'user_pref("datareporting.policy.dataSubmissionEnabled", false);\n'
            'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);\n'
            # no animations: otherwise the screenshot catches them mid-entry
            'user_pref("ui.prefersReducedMotion", 1);\n')
    if not os.path.exists(prefs) or open(prefs).read() != want:
        open(prefs, 'w').write(want)


def browser(url, png, w, h, capture=False):
    """Open `url` in headless Firefox; save the screenshot and return stdout."""
    ensure_profile()
    cmd = ['firefox', '--headless', '-no-remote', '--profile', PROFILE,
           '--window-size=%d,%d' % (w, h)]
    if png:
        cmd += ['--screenshot', png]
    cmd.append(url)
    r = subprocess.run(cmd, env=ENV, timeout=180,
                       stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL)
    return r.stdout.decode('utf-8', 'replace') if capture else ''


def read_png(path, max_rows=None):
    """Decode an 8-bit PNG (grey, rgb, rgba) to bytes; optionally the first rows."""
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG: ' + path
    pos, idat, w, h, depth, ctype = 8, b'', None, None, None, None
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', chunk[:10])
        elif typ == b'IDAT':
            idat += chunk
        elif typ == b'IEND':
            break
        pos += 12 + ln
    assert depth == 8, 'only 8 bits per channel (%s)' % path
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * ch
    rows = h if max_rows is None else min(h, max_rows)
    out, prev, p = bytearray(), bytearray(stride), 0
    for _ in range(rows):
        f = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if f == 1:
            for i in range(ch, stride):
                line[i] = (line[i] + line[i - ch]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]
                c = prev[i - ch] if i >= ch else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else
                                      (b if pb <= pc else c))) & 255
        out += line
        prev = line
    return w, h, ch, bytes(out)


def read_barcode(png, n, bits, cw):
    """Read `n` integers from a strip of black/white squares in the top corner."""
    w, h, ch, px = read_png(png, max_rows=n * cw)
    vals = []
    for i in range(n):
        v = 0
        for b in range(bits):
            x, y = b * cw + cw // 2, i * cw + cw // 2
            if px[(y * w + x) * ch] < 128:
                v |= 1 << b
        vals.append(v)
    return w, h, vals


# --- pruebas ---------------------------------------------------------------

def test_data(langs):
    """The native calculation (tzolkin, moons, ephemerides) matches the anchors."""
    fails = 0
    for lang in langs:
        png = os.path.join(WORK, 'data_%s.png' % lang)
        url = '%s/index.html?barcode=1&lang=%s&d=2026-11-01' % (URL_BASE, lang)
        browser(url, png, 240, 290)
        _, _, vals = read_barcode(png, len(DATA_CASES), 12, 20)
        bad = [(lab, got, want) for (want, lab, tol), got in zip(DATA_CASES, vals)
               if abs(got - want) > tol]
        for lab, got, want in bad:
            print('  FAIL [%s] %-28s got %d, want %d' % (lang, lab, got, want))
        fails += bool(bad)
        print('%s data       %-2s  %d/%d' % ('OK  ' if not bad else 'FAIL',
                                            lang, len(DATA_CASES) - len(bad),
                                            len(DATA_CASES)))
    return fails


def test_layout(langs):
    """No horizontal overflow and no overflowing boxes, on desktop and mobile."""
    fails = 0
    for lang in langs:
        for w, h, tag in [(1280, 900, 'desk'), (390, 844, 'mob')]:
            png = os.path.join(WORK, 'layout_%s_%s.png' % (lang, tag))
            url = '%s/index.html?barcode=layout&lang=%s&d=2026-11-01' % (URL_BASE, lang)
            browser(url, png, w, h)
            _, _, vals = read_barcode(png, len(LAYOUT_NAMES), 14, 16)
            g = dict(zip(LAYOUT_NAMES, vals))
            bad = []
            if g['innerWidth'] != w:
                bad.append('viewport %d != %d' % (g['innerWidth'], w))
            if g['scrollWidth'] > g['innerWidth'] + 1:
                bad.append('horizontal scroll %d > %d' % (g['scrollWidth'], g['innerWidth']))
            if g['overflows']:
                bad.append('%d overflowing boxes' % g['overflows'])
            if g['tzolkin'] != 260:
                bad.append('tzolkin cells %d' % g['tzolkin'])
            if g['yearStrip'] != 13:
                bad.append('year strip cells %d' % g['yearStrip'])
            if g['days/row'] != 7:
                bad.append('days per row %d' % g['days/row'])
            if g['today'] != 1:
                bad.append('today marks %d' % g['today'])
            if g['card3.right'] > g['innerWidth']:
                bad.append('third card outside the viewport')
            # parallel Gregorian strip
            if g['gregSegs'] != 13:
                bad.append('Gregorian segments %d (26 Jul-24 Jul = 13)' % g['gregSegs'])
            if not 98 <= g['gregWidth%'] <= 101:
                bad.append('Gregorian strip covers %d%% of the width' % g['gregWidth%'])
            if g['gregMarker'] != 1:
                bad.append('day markers %d' % g['gregMarker'])
            if g['gregCur'] != 1:
                bad.append('active months %d' % g['gregCur'])
            if g['gregLabelOut']:
                bad.append('%d month labels spill out of their segment' % g['gregLabelOut'])
            if g['greg.left'] < 0 or g['greg.left'] + g['greg.w'] > g['innerWidth']:
                bad.append('Gregorian strip outside the viewport (%d+%d > %d)'
                           % (g['greg.left'], g['greg.w'], g['innerWidth']))
            if g['greg.w'] < 200:
                bad.append('Gregorian strip too narrow (%d px)' % g['greg.w'])
            # the marker has to be on both scales and on the same day
            # (the probe uses d=2026-11-01: moon 4, day 15 -> 51.8% of the moon)
            if g['ymoonMark'] != 1:
                bad.append('markers in the moon strip: %d' % g['ymoonMark'])
            if abs(g['ymoonPos%'] - 52) > 3:
                bad.append('moon marker at %d%% (expected 52%%)' % g['ymoonPos%'])
            # both scales, comparable vertically: same x (±1 px)
            if g['markDelta'] > 1:
                bad.append('the two markers disagree: %d px apart' % g['markDelta'])
            for b in bad:
                print('  FAIL [%s/%s] %s' % (lang, tag, b))
            fails += bool(bad)
            print('%s layout     %-2s %-4s height %dpx  hero %d/%d  calendar %d  months %d/%d%%'
                  % ('OK  ' if not bad else 'FAIL', lang, tag,
                     g['scrollHeight'], g['hero1.w'], g['hero2.w'], g['calCard.w'],
                     g['gregSegs'], g['gregWidth%']))
            print('     Gregorian strip x=%d..%d  %d px wide · moon marker at %d%%'
                  % (g['greg.left'], g['greg.left'] + g['greg.w'], g['greg.w'], g['ymoonPos%']))
    return fails


def test_selftest(langs):
    """The app self-test prints no FAIL and the names come out translated."""
    fails = 0
    for lang in langs:
        url = '%s/index.html?selftest=1&lang=%s' % (URL_BASE, lang)
        shot = os.path.join(WORK, 'selftest_%s.png' % lang)
        # without --screenshot Firefox stays open; the capture also leaves
        # the self-test panel as a visual record in tests/work/
        out = browser(url, shot, 980, 470, capture=True)
        text = ''
        for line in out.splitlines():
            if line.startswith('console.log: '):
                try:
                    text += ast.literal_eval(line[len('console.log: '):]) + '\n'
                except (ValueError, SyntaxError):
                    pass
        if not text:
            print('  FAIL [%s] console output not captured' % lang)
            fails += 1
            print('FAIL selftest   %-2s  no output' % lang)
            continue
        cases = [l for l in text.splitlines() if l.startswith(('OK ', 'FAIL '))]
        bad = [l for l in cases if l.startswith('FAIL')]
        for l in bad:
            print('  FAIL [%s] %s' % (lang, l))
        first = text.splitlines()[0] if text else ''
        if not first.startswith('lang=%s' % lang):
            bad.append('page language: %r' % first)
            print('  FAIL [%s] %s' % (lang, first))
        # the seal name and the moon phase must be translated, not fixed English
        if lang == 'de' and 'Blauer' not in text and 'Gelber' not in text:
            print('  FAIL [%s] seal names not translated' % lang)
            bad.append('seals')
        fails += bool(bad)
        print('%s selftest   %-2s  %d/%d anchors'
              % ('OK  ' if not bad else 'FAIL', lang,
                 len(cases) - len([l for l in bad if l.startswith('FAIL')]), len(cases)))
    return fails


def test_shots(langs):
    """Full-page screenshots per language (visual review)."""
    outdir = os.path.join(BASE, 'tests', 'shots')
    os.makedirs(outdir, exist_ok=True)
    fails = 0
    for lang in langs:
        probe = os.path.join(WORK, 'probe_%s.png' % lang)
        url = '%s/index.html?barcode=layout&lang=%s&d=2026-11-01' % (URL_BASE, lang)
        browser(url, probe, 1280, 900)
        _, _, vals = read_barcode(probe, len(LAYOUT_NAMES), 14, 16)
        height = min(6000, dict(zip(LAYOUT_NAMES, vals))['scrollHeight'] + 8)
        png = os.path.join(outdir, 'desktop_%s.png' % lang)
        browser('%s/index.html?lang=%s&d=2026-11-01' % (URL_BASE, lang),
                png, 1280, height)
        w, h, ch, px = read_png(png, max_rows=600)
        dark = sum(1 for i in range(0, len(px), ch * 37) if px[i] < 200)
        ok = os.path.getsize(png) > 40000 and dark > 0
        fails += not ok
        print('%s shot       %-2s  %dx%d  %.0f KB'
              % ('OK  ' if ok else 'FAIL', lang, w, h, os.path.getsize(png) / 1024.0))
    print('  saved in %s' % os.path.relpath(outdir, BASE))
    return fails


def test_doot(langs):
    """The day-out-of-time disclosure, in every language and at both widths.

    Offline: checks that it exists, opens, brings the four paragraphs and the
    four sources, that the links are https with rel="noopener", that nothing
    overflows and that the text is translated (not the Spanish fallback).
    """
    # accent-free marks: the Firefox console escapes anything not ASCII
    MARK = {'es': 'fuera del tiempo', 'pt': 'fora do tempo',
             'en': 'out of time', 'de': 'Zeit'}
    fails = 0
    for lang in langs:
        for w, h, tag in [(1280, 3200, 'desk'), (390, 4400, 'mob')]:
            png = os.path.join(WORK, 'doot_%s_%s.png' % (lang, tag))
            out = browser('%s/index.html?doot=1&lang=%s&d=2026-11-01' % (URL_BASE, lang),
                          png, w, h, capture=True)
            line = next((l for l in out.splitlines() if 'doot open=' in l), '')
            m = re.search(r'p=(\d+) a=(\d+)', line)
            m2 = re.search(r'doot overflows=(\d+) scrollW=(\d+) innerW=(\d+)', out)
            text = next((l for l in out.splitlines() if 'doot text:' in l), '')
            links = [(hh, rr, tt.strip('"').strip('\\'))
                       for hh, rr, tt in re.findall(
                           r'doot link (\S+) rel=(\S+) target=(\S+)', out)]

            bad = []
            if not m or m.group(1) != '4' or m.group(2) != '4':
                bad.append('paragraphs/links %s' % (m.groups() if m else 'no probe'))
            if not m2:
                bad.append('no measurements')
            else:
                overflows, sw, iw = (int(x) for x in m2.groups())
                if overflows:
                    bad.append('%d overflowing boxes' % overflows)
                if sw > iw + 1:
                    bad.append('scroll horizontal %d > %d' % (sw, iw))
            if len(links) != 4:
                bad.append('%d links leídos' % len(links))
            for href, rel, target in links:
                if not href.startswith('https://'):
                    bad.append('link not https: %s' % href)
                if rel != 'noopener':
                    bad.append('rel=%s en %s' % (rel, href))
                if target != '_blank':
                    bad.append('target=%s en %s' % (target, href))
            if MARK.get(lang, 'fuera del tiempo').lower() not in text.lower():
                bad.append('text no traducido')

            fails += bool(bad)
            print('%s doot       %-2s %-4s %s'
                  % ('OK  ' if not bad else 'FAIL', lang, tag,
                     '4 paragraphs · 4 https+noopener sources · no overflow'
                     if not bad else ' · '.join(bad)))
    return fails


def test_thumb(langs):
    """Which moon does the thumbnail show? Count it in the image, don't assume.

    For each date the icon is painted at 240x240 on white and the inside of the
    disc is classified by luminance: the lit fraction has to match what the app
    reports, and the lit side has to fall on the right while waxing and on the
    left while waning. The `fallback` case uses the static href from
    index.html: a last-quarter moon, left half lit.
    """
    def measure(png):
        w, h, ch, px = read_png(png)
        cx, cy = w / 2.0, h / 2.0
        r_disc = 13 * (w / 32.0)          # 97.5 px at 240
        r_max = r_disc * 0.97             # nearly to the edge, past the rim
        lit = dark = 0
        xs = []
        for y in range(h):
            dy = y - cy
            if abs(dy) > r_max:
                continue
            for x in range(w):
                dx = x - cx
                if dx * dx + dy * dy > r_max * r_max:
                    continue
                i = (y * w + x) * ch
                r, g, b = px[i], px[i + 1], px[i + 2]
                if (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5:
                    lit += 1
                    xs.append(x)
                else:
                    dark += 1
        total = lit + dark
        side = (sum(xs) / len(xs) - cx) / r_disc if xs else 0.0
        return (lit / total if total else 0.0), side

    CASES = [('2026-11-05', 'thin waxing'), ('2026-11-20', 'waxing'),
             ('2026-11-24', 'full'), ('2026-12-01', 'waning'),
             ('2026-11-11', 'new')]
    fails = 0
    print('     date         phase           k app  k seen   side')
    for lang in langs[:1]:
        for d, name in CASES:
            png = os.path.join(WORK, 'thumb_%s.png' % d)
            out = browser('%s/index.html?thumb=1&lang=%s&d=%s' % (URL_BASE, lang, d),
                          png, 240, 240, capture=True)
            m = re.search(r'k=([\d.]+) waxing=(\d)', out)
            if not m:
                print('FAIL thumb      %-12s no probe output' % d)
                fails += 1
                continue
            k_app, waxing = float(m.group(1)), int(m.group(2))
            k_med, side = measure(png)
            bad = []
            if abs(k_med - k_app) > 0.08:
                bad.append('lit %.2f vs %.2f' % (k_med, k_app))
            if 0.20 < k_app < 0.80:
                if waxing and side < 0.1:
                    bad.append('waxing but lit on the left')
                if not waxing and side > -0.1:
                    bad.append('waning but lit on the right')
            fails += bool(bad)
            print('%s thumb      %-12s %-14s %.3f  %.3f    %+.2f  %s'
                  % ('OK  ' if not bad else 'FAIL', d, name, k_app, k_med, side,
                     'thumbnail matches' if not bad else ' · '.join(bad)))

    # the static fallback: last quarter, left half lit
    png = os.path.join(WORK, 'thumb_fallback.png')
    browser('%s/index.html?thumb=fallback&lang=%s&d=2026-11-20' % (URL_BASE, langs[0]),
            png, 240, 240, capture=True)
    k_med, side = measure(png)
    bad = []
    if abs(k_med - 0.5) > 0.06:
        bad.append('not a half moon (%.2f)' % k_med)
    if side > -0.15:
        bad.append('lit on the wrong side')
    fails += bool(bad)
    print('%s thumb      %-12s %-14s %.3f  %.3f    %+.2f  %s'
          % ('OK  ' if not bad else 'FAIL', '(no JS)', 'fallback', 0.5, k_med, side,
             'last quarter' if not bad else ' · '.join(bad)))
    return fails


def main():
    ap = argparse.ArgumentParser(description='moon-calendar test suite')
    ap.add_argument('-l', '--langs', default=','.join(LANGS),
                    help='comma-separated languages (default: %s)' % ','.join(LANGS))
    ap.add_argument('--shots', action='store_true', help='full-page screenshots')
    ap.add_argument('--only', choices=['data', 'layout', 'selftest', 'doot',
                                       'thumb', 'shots'],
                    help='run a single test group')
    ap.add_argument('--base',
                    help='URL the app is served from (default: this directory, '
                         'e.g. --base https://mooncalendar.github.io/13moons)')
    args = ap.parse_args()

    global URL_BASE
    if args.base:
        URL_BASE = args.base.rstrip('/')
        print('origin: %s' % URL_BASE)

    langs = [l.strip() for l in args.langs.split(',') if l.strip()]
    os.makedirs(WORK, exist_ok=True)
    suites = [('data', test_data), ('layout', test_layout),
              ('selftest', test_selftest), ('doot', test_doot),
              ('thumb', test_thumb), ('shots', test_shots)]
    if args.only:
        groups = [s for s in suites if s[0] == args.only]
    else:
        groups = [s for s in suites if args.shots or s[0] != 'shots']

    fails = 0
    for _, fn in groups:
        fails += fn(langs)

    print('\n%s' % ('ALL OK' if fails == 0 else '%d groups with failures' % fails))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())