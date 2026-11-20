#!/usr/bin/env python3
"""Pruebas automáticas de moon-calendar.

Todo se comprueba en un Firefox headless real contra la página publicada,
sin frameworks: la propia app expone tres modos de instrumentación vía URL
(?selftest, ?barcode=1, ?barcode=layout) y aquí se leen de vuelta.

  python3 tests/check.py             # datos + maquetación + autotest, 4 idiomas
  python3 tests/check.py --shots     # además capturas de página completa
  python3 tests/check.py -l es,de    # sólo algunos idiomas

Salida: código 0 si todo pasa, 1 si algo falla.
"""

import argparse
import ast
import os
import struct
import subprocess
import sys
import zlib

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, 'tests', 'work')
PROFILE = os.path.join(BASE, 'tests', 'profile')
LANGS = ['es', 'pt', 'en', 'de']
ENV = dict(os.environ, MOZ_HEADLESS='1')

# valores que expone ?barcode=1, en orden (12 bits por celda).
# (esperado, etiqueta, tolerancia opcional)
DATA_CASES = [
    (34, 'kin 1987-07-26', 0), (86, 'kin 2026-11-20', 0),
    (31, 'kin 2028-02-29', 0), (31, 'kin 2028-02-28', 0),
    (207, 'kin 2012-12-21', 0), (0, 'luna del día fuera del tiempo', 0),
    (5, 'luna 2026-11-20', 0), (6, 'día 2026-11-20', 0),
    (22, 'día 2028-02-29', 0), (229, 'portador del año 2026', 0),
    (3389, 'longitud lunar x1000', 50),      # ±0,05°: series distintas dan 3389–3401
    (180, 'elongación luna llena', 1),
    (12, 'índice constelación', 0), (30, 'días nov 2026', 0),
]

# valores que expone ?barcode=layout, en orden (14 bits por celda)
LAYOUT_NAMES = ['innerWidth', 'scrollWidth', 'scrollHeight', 'hero1.w', 'hero2.w',
                'hero2.left', 'card1.w', 'card3.right', 'days/row', 'yearStrip',
                'tzolkin', 'moonSvg.w', 'wheel.w', 'calCard.w', 'today', 'overflows',
                'gregSegs', 'gregWidth%', 'gregMarker', 'gregCur', 'gregLabelOut',
                'greg.left', 'greg.w', 'ymoonMark', 'ymoonPos%']


# --- utilidades ------------------------------------------------------------

def ensure_profile():
    """Perfil desechable de Firefox con la consola volcada a stdout."""
    os.makedirs(PROFILE, exist_ok=True)
    prefs = os.path.join(PROFILE, 'user.js')
    want = ('user_pref("devtools.console.stdout.content", true);\n'
            'user_pref("browser.shell.checkDefaultBrowser", false);\n'
            'user_pref("datareporting.policy.dataSubmissionEnabled", false);\n'
            'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);\n'
            # sin animaciones: si no, la captura sale a media entrada
            'user_pref("ui.prefersReducedMotion", 1);\n')
    if not os.path.exists(prefs) or open(prefs).read() != want:
        open(prefs, 'w').write(want)


def browser(url, png, w, h, capture=False):
    """Abre `url` en Firefox headless; guarda captura y devuelve stdout."""
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
    """Decodifica un PNG de 8 bits (gris, rgb, rgba) a bytes; filtra por filas."""
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'no es un PNG: ' + path
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
    assert depth == 8, 'sólo 8 bits por canal (%s)' % path
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
    """Lee `n` enteros de una tira de cuadros blancos/negros en el ángulo superior."""
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
    """El cálculo nativo (tzolkin, lunas, efemérides) coincide con las anclas."""
    fails = 0
    for lang in langs:
        png = os.path.join(WORK, 'data_%s.png' % lang)
        url = 'file://%s/index.html?barcode=1&lang=%s&d=2026-11-01' % (BASE, lang)
        browser(url, png, 240, 290)
        _, _, vals = read_barcode(png, len(DATA_CASES), 12, 20)
        bad = [(lab, got, want) for (want, lab, tol), got in zip(DATA_CASES, vals)
               if abs(got - want) > tol]
        for lab, got, want in bad:
            print('  FAIL [%s] %-28s got %d, want %d' % (lang, lab, got, want))
        fails += bool(bad)
        print('%s datos      %-2s  %d/%d' % ('OK  ' if not bad else 'FAIL',
                                            lang, len(DATA_CASES) - len(bad),
                                            len(DATA_CASES)))
    return fails


def test_layout(langs):
    """Sin desbordes horizontales ni cajas desbordadas, en escritorio y móvil."""
    fails = 0
    for lang in langs:
        for w, h, tag in [(1280, 900, 'desk'), (390, 844, 'mob')]:
            png = os.path.join(WORK, 'layout_%s_%s.png' % (lang, tag))
            url = 'file://%s/index.html?barcode=layout&lang=%s&d=2026-11-01' % (BASE, lang)
            browser(url, png, w, h)
            _, _, vals = read_barcode(png, len(LAYOUT_NAMES), 14, 16)
            g = dict(zip(LAYOUT_NAMES, vals))
            bad = []
            if g['innerWidth'] != w:
                bad.append('viewport %d != %d' % (g['innerWidth'], w))
            if g['scrollWidth'] > g['innerWidth'] + 1:
                bad.append('scroll horizontal %d > %d' % (g['scrollWidth'], g['innerWidth']))
            if g['overflows']:
                bad.append('%d cajas desbordadas' % g['overflows'])
            if g['tzolkin'] != 260:
                bad.append('células tzolkin %d' % g['tzolkin'])
            if g['yearStrip'] != 13:
                bad.append('células tira anual %d' % g['yearStrip'])
            if g['days/row'] != 7:
                bad.append('días por fila %d' % g['days/row'])
            if g['today'] != 1:
                bad.append('marcas de hoy %d' % g['today'])
            if g['card3.right'] > g['innerWidth']:
                bad.append('tercera tarjeta fuera del viewport')
            # franja gregoriana paralela
            if g['gregSegs'] != 13:
                bad.append('tramos gregorianos %d (26 jul-24 jul = 13)' % g['gregSegs'])
            if not 98 <= g['gregWidth%'] <= 101:
                bad.append('franja gregoriana cubre %d%% del ancho' % g['gregWidth%'])
            if g['gregMarker'] != 1:
                bad.append('marcadores de día %d' % g['gregMarker'])
            if g['gregCur'] != 1:
                bad.append('meses activos %d' % g['gregCur'])
            if g['gregLabelOut']:
                bad.append('%d etiquetas de mes se salen de su tramo' % g['gregLabelOut'])
            if g['greg.left'] < 0 or g['greg.left'] + g['greg.w'] > g['innerWidth']:
                bad.append('franja gregoriana fuera del viewport (%d+%d > %d)'
                           % (g['greg.left'], g['greg.w'], g['innerWidth']))
            if g['greg.w'] < 200:
                bad.append('franja gregoriana demasiado estrecha (%d px)' % g['greg.w'])
            # la raya tiene que estar en las dos escalas y en el mismo día
            # (la sonda usa d=2026-11-01: luna 4, día 15 -> 51,8 % de la luna)
            if g['ymoonMark'] != 1:
                bad.append('rayas en la tira de las lunas: %d' % g['ymoonMark'])
            if abs(g['ymoonPos%'] - 52) > 3:
                bad.append('raya de la luna al %d%% (esperado 52%%)' % g['ymoonPos%'])
            for b in bad:
                print('  FAIL [%s/%s] %s' % (lang, tag, b))
            fails += bool(bad)
            print('%s layout     %-2s %-4s alto %dpx  hero %d/%d  calendario %d  meses %d/%d%%'
                  % ('OK  ' if not bad else 'FAIL', lang, tag,
                     g['scrollHeight'], g['hero1.w'], g['hero2.w'], g['calCard.w'],
                     g['gregSegs'], g['gregWidth%']))
            print('     franja gregoriana x=%d..%d  %d px de ancho · raya luna al %d%%'
                  % (g['greg.left'], g['greg.left'] + g['greg.w'], g['greg.w'], g['ymoonPos%']))
    return fails


def test_selftest(langs):
    """El autotest de la app no imprime ningún FAIL y los nombres están traducidos."""
    fails = 0
    for lang in langs:
        url = 'file://%s/index.html?selftest=1&lang=%s' % (BASE, lang)
        shot = os.path.join(WORK, 'selftest_%s.png' % lang)
        # sin --screenshot Firefox queda abierto; la captura además deja
        # el panel del autotest como registro visual en tests/work/
        out = browser(url, shot, 980, 470, capture=True)
        text = ''
        for line in out.splitlines():
            if line.startswith('console.log: '):
                try:
                    text += ast.literal_eval(line[len('console.log: '):]) + '\n'
                except (ValueError, SyntaxError):
                    pass
        if not text:
            print('  FAIL [%s] no se capturó la consola' % lang)
            fails += 1
            print('FAIL autotest   %-2s  sin salida' % lang)
            continue
        cases = [l for l in text.splitlines() if l.startswith(('OK ', 'FAIL '))]
        bad = [l for l in cases if l.startswith('FAIL')]
        for l in bad:
            print('  FAIL [%s] %s' % (lang, l))
        first = text.splitlines()[0] if text else ''
        if not first.startswith('lang=%s' % lang):
            bad.append('idioma de la página: %r' % first)
            print('  FAIL [%s] %s' % (lang, first))
        # el nombre del sello y la fase lunar deben estar traducidos, no en inglés fijo
        if lang == 'de' and 'Blauer' not in text and 'Gelber' not in text:
            print('  FAIL [%s] nombres de sellos sin traducir' % lang)
            bad.append('sellos')
        fails += bool(bad)
        print('%s autotest   %-2s  %d/%d anclas'
              % ('OK  ' if not bad else 'FAIL', lang,
                 len(cases) - len([l for l in bad if l.startswith('FAIL')]), len(cases)))
    return fails


def test_shots(langs):
    """Capturas de página completa por idioma (revisión visual)."""
    outdir = os.path.join(BASE, 'tests', 'shots')
    os.makedirs(outdir, exist_ok=True)
    fails = 0
    for lang in langs:
        probe = os.path.join(WORK, 'probe_%s.png' % lang)
        url = 'file://%s/index.html?barcode=layout&lang=%s&d=2026-11-01' % (BASE, lang)
        browser(url, probe, 1280, 900)
        _, _, vals = read_barcode(probe, len(LAYOUT_NAMES), 14, 16)
        height = min(6000, dict(zip(LAYOUT_NAMES, vals))['scrollHeight'] + 8)
        png = os.path.join(outdir, 'desktop_%s.png' % lang)
        browser('file://%s/index.html?lang=%s&d=2026-11-01' % (BASE, lang),
                png, 1280, height)
        w, h, ch, px = read_png(png, max_rows=600)
        dark = sum(1 for i in range(0, len(px), ch * 37) if px[i] < 200)
        ok = os.path.getsize(png) > 40000 and dark > 0
        fails += not ok
        print('%s captura    %-2s  %dx%d  %.0f KB'
              % ('OK  ' if ok else 'FAIL', lang, w, h, os.path.getsize(png) / 1024.0))
    print('  guardadas en %s' % os.path.relpath(outdir, BASE))
    return fails


def main():
    ap = argparse.ArgumentParser(description='Pruebas de moon-calendar')
    ap.add_argument('-l', '--langs', default=','.join(LANGS),
                    help='idiomas separados por coma (por defecto: %s)' % ','.join(LANGS))
    ap.add_argument('--shots', action='store_true', help='capturas de página completa')
    ap.add_argument('--only', choices=['data', 'layout', 'selftest', 'shots'],
                    help='ejecutar sólo un grupo de pruebas')
    args = ap.parse_args()

    langs = [l.strip() for l in args.langs.split(',') if l.strip()]
    os.makedirs(WORK, exist_ok=True)
    suites = [('data', test_data), ('layout', test_layout),
              ('selftest', test_selftest), ('shots', test_shots)]
    if args.only:
        groups = [s for s in suites if s[0] == args.only]
    else:
        groups = [s for s in suites if args.shots or s[0] != 'shots']

    fails = 0
    for _, fn in groups:
        fails += fn(langs)

    print('\n%s' % ('TODO OK' if fails == 0 else '%d grupos con fallos' % fails))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())