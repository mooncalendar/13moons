"""Comprobación en píxeles de que las dos escalas del año se leen en vertical.

La tarjeta del año pone la misma extensión de tiempo dos veces: arriba las 13
lunas (28 días cada una) y abajo los meses gregorianos. La promesa es que una
fecha cae en la misma x en las dos filas, así que la prueba no mira el DOM
—que ya se comprueba en check.py— sino la imagen:

  1. la raya dorada de cada fila existe, y las dos están a la misma x;
  2. la raya gregoriana cae donde toca según el día del año;
  3. la celda del día está resaltada en las dos filas;
  4. cada celda con ancho suficiente lleva su etiqueta dibujada.

Uso: python3 tests/verify_pixels.py [AAAA-MM-DD] [idioma] [ancho]
"""
import datetime
import os
import re
import sys

from check import browser, read_png

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, 'tests', 'work')
os.makedirs(WORK, exist_ok=True)

WHEN = sys.argv[1] if len(sys.argv) > 1 else '2026-11-01'
LANG = sys.argv[2] if len(sys.argv) > 2 else 'es'
W = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
H = 2900

GOLD = (229, 192, 123)
INK = 120                       # suma rgb que ya se separa del fondo
TOL = 30

# --- geometría declarada por la propia página -----------------------------
out = browser('file://%s/index.html?rects=1&lang=%s&d=%s' % (BASE, LANG, WHEN),
              os.path.join(WORK, '_vp_rects.png'), W, H, capture=True)
rects, cells = {}, {}
for line in out.splitlines():
    m = re.match(r'console\.log: "rect (\w+) (-?\d+) (-?\d+) (\d+) (\d+)"', line)
    if m:
        rects[m.group(1)] = tuple(int(m.group(i)) for i in range(2, 6))
    m = re.match(r'console\.log: "rect (ycell|gcell)(\d+) (-?\d+) (-?\d+) (\d+) (\d+)"', line)
    if m:
        cells.setdefault(m.group(1), {})[int(m.group(2))] = \
            tuple(int(m.group(i)) for i in range(3, 7))

if 'yearStrip' not in rects or 'gregTrack' not in rects:
    sys.exit('no se encontraron las dos filas en el volcado de geometría')

# --- la captura ------------------------------------------------------------
png = os.path.join(WORK, '_vp_shot.png')
browser('file://%s/index.html?lang=%s&d=%s' % (BASE, LANG, WHEN), png, W, H)
w, h, ch, px = read_png(png)


def at(x, y):
    i = (y * w + x) * ch
    return (px[i], px[i + 1], px[i + 2]) if ch >= 3 else (px[i], px[i], px[i])


def warm_line(box):
    """x de la raya del día dentro de una caja, y qué parte de la fila cruza.

    La raya es un degradado dorado que pasa por detrás del número y del nombre,
    así que ni es de un color plano ni es continua. Se busca la columna más
    cálida (rojo − azul) y luego se mide en cuántas filas esa columna es más
    cálida que la mediana de su propia fila: eso distingue una raya que cruza
    la celda de una mancha de texto.
    """
    x0, y0, ww, hh = box
    cols = []
    for x in range(x0, x0 + ww):
        s = 0
        for y in range(y0, y0 + hh):
            r, g, b = at(x, y)
            s += r - b
        cols.append((s / hh, x))
    best, mx = max(cols)
    cruza = 0
    for y in range(y0, y0 + hh):
        fila = []
        for x in range(x0, x0 + ww):
            r, g, b = at(x, y)
            fila.append(r - b)
        fila.sort()
        med = fila[len(fila) // 2]
        r, g, b = at(mx, y)
        if r - b > med + 12:
            cruza += 1
    return mx, cruza / hh, best


moon_box, greg_box = rects['yearStrip'], rects['gregTrack']
mx, mcover, mwarm = warm_line(moon_box)
gx, gcover, gwarm = warm_line(greg_box)

print('captura %dx%d · %s · %s' % (w, h, WHEN, LANG))
print('fila de las lunas  y=%d..%d  raya en x=%d · cruza el %d%% de la fila'
      % (moon_box[1], moon_box[1] + moon_box[3], mx, mcover * 100))
print('fila gregoriana    y=%d..%d  raya en x=%d · cruza el %d%% de la fila'
      % (greg_box[1], greg_box[1] + greg_box[3], gx, gcover * 100))

fails = []

# --- 2. la raya gregoriana cae donde toca --------------------------------
d = datetime.date.fromisoformat(WHEN)
start = datetime.date(d.year, 7, 26)
if d < start:
    start = datetime.date(d.year - 1, 7, 26)
doy = (d - start).days + 1

if doy > 364:
    print('\n%s es el día fuera del tiempo: no debe haber raya' % WHEN)
    if mcover > .5 or gcover > .5:
        fails.append('hay raya en el día fuera del tiempo')
else:
    # --- 1. las dos rayas en la misma x ----------------------------------
    delta = abs(mx - gx)
    print('\n1. alineación vertical: %d px de desfase %s'
          % (delta, 'OK' if delta <= 2 else 'FALLA'))
    if delta > 2:
        fails.append('las dos rayas están a %d px' % delta)
    # la raya tiene que cruzar su fila de arriba abajo, no ser un trozo de texto
    for etq, cov in (('lunas', mcover), ('gregoriana', gcover)):
        if cov < 0.70:
            fails.append('la raya de %s sólo cruza el %d%% de su fila'
                         % (etq, cov * 100))

    exp = greg_box[0] + (doy - 0.5) / 364 * greg_box[2]
    err = gx - exp
    print('\n2. día %d del año lunar · raya esperada x≈%.0f, medida x=%d · %s (%+.1f px)'
          % (doy, exp, gx, 'OK' if abs(err) < 6 else 'FALLA', err))
    if abs(err) >= 6:
        fails.append('la raya gregoriana está a %+.1f px de donde toca' % err)

    # --- 3. la celda del día, resaltada en las dos filas ----------------
    def warmth(box):
        """media de (rojo − azul): el resalte dorado sube, el fondo es azulado."""
        n = s = 0
        for y in range(box[1] + 4, box[1] + box[3] - 4):
            for x in range(box[0] + 2, box[0] + box[2] - 2):
                r, g, b = at(x, y)
                s += r - b
                n += 1
        return s / max(n, 1)

    print('\n3. celda del día resaltada:')
    for name, key, mark_x in (('lunas', 'ycell', mx), ('gregoriana', 'gcell', gx)):
        cs = cells.get(key, {})
        cur = [i for i, b in cs.items() if b[0] <= mark_x < b[0] + b[2]]
        if not cur:
            fails.append('la raya de %s no cae en ninguna celda' % name)
            continue
        mine = warmth(cs[cur[0]])
        otros = [warmth(b) for i, b in cs.items() if i != cur[0]]
        media = sum(otros) / max(len(otros), 1)
        good = mine > media + 4
        print('   %-11s celda %2d · calidez %.0f vs %.0f del resto · %s'
              % (name, cur[0] + 1, mine, media, 'OK' if good else 'FALLA'))
        if not good:
            fails.append('la celda del día no está resaltada en %s' % name)

# --- 4. etiquetas dibujadas donde caben -----------------------------------
print('\n4. etiquetas por celda')
sin_tinta = []
for key in ('ycell', 'gcell'):
    for i, b in sorted(cells.get(key, {}).items()):
        if b[2] < 26:
            continue
        y0 = b[1] + int(b[3] * 0.2)
        y1 = b[1] + int(b[3] * 0.85)
        ink = sum(1 for y in range(y0, y1)
                  for x in range(b[0] + 2, b[0] + b[2] - 2)
                  if sum(at(x, y)) > INK)
        if ink < 6:
            sin_tinta.append('%s%d (%dpx)' % (key[0], i + 1, b[2]))
print('   celdas con ancho suficiente y sin tinta: %s'
      % (', '.join(sin_tinta) or 'ninguna'))
if sin_tinta:
    fails.append('etiquetas ausentes: %s' % ', '.join(sin_tinta))

print('\n%s' % ('TODO OK' if not fails else 'FALLOS: ' + ' · '.join(fails)))
sys.exit(0 if not fails else 1)
