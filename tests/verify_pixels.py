"""Comprobación en píxeles de la franja gregoriana dentro de una captura.

Comprueba tres cosas sobre la imagen, no sobre el DOM:
  1. la raya dorada del día consultado existe y cae en el mes resaltado;
  2. cada tramo de mes ancho lleva su etiqueta dibujada (tinta dentro de la banda);
  3. los tramos demasiado estrechos van sin etiqueta.

La caja de la franja se le pasa tal cual la mide la sonda de layout
(`python3 tests/check.py --only layout` imprime x0..x1 y ancho).

Uso: python3 verify_greg.py [AAAA-MM-DD] [x0] [ancho] [png]
"""
import os
import sys
from datetime import date, timedelta

from check import read_png

WHEN = date.fromisoformat(sys.argv[1] if len(sys.argv) > 1 else '2026-11-01')
LEFT = float(sys.argv[2]) if len(sys.argv) > 2 else 79
WIDTH = float(sys.argv[3]) if len(sys.argv) > 3 else 1110
PNG = sys.argv[4] if len(sys.argv) > 4 else \
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots', 'desktop_es.png')
SPAN, TRACK_H = 364, 26
GOLD = (229, 192, 123)
INK = 100            # suma rgb que ya se separa del fondo de la franja

start = date(WHEN.year, 7, 26) if WHEN >= date(WHEN.year, 7, 26) else date(WHEN.year - 1, 7, 26)
DOY = (WHEN - start).days + 1
FRAC = (DOY - 0.5) / SPAN

w, h, ch, px = read_png(PNG)


def at(x, y):
    i = (y * w + x) * ch
    return (px[i], px[i + 1], px[i + 2]) if ch >= 3 else (px[i], px[i], px[i])


print('captura %dx%d · %s · día %d del año lunar (luna %d, día %d)'
      % (w, h, WHEN, DOY, (DOY - 1) // 28 + 1, (DOY - 1) % 28 + 1))

# --- 1. raya dorada (único trazo vertical alto de ese color en la zona baja)
# la raya de la franja gregoriana mide lo que la franja (20-26 px); la de la
# luna es más alta, así que se filtra por altura y se prefiere la de más abajo
cands, cands_stem = [], []
for x in range(w):
    run = y_start = 0
    for y in range(1900, h):
        r, g, b = at(x, y)
        if abs(r - GOLD[0]) < 26 and abs(g - GOLD[1]) < 26 and abs(b - GOLD[2]) < 26:
            if run == 0:
                y_start = y
            run += 1
            if 16 <= run <= 30:
                cands.append((run, x, y_start))
            elif 6 <= run < 16:
                cands_stem.append((run, x, y_start))
        else:
            run = 0
best = max(cands, key=lambda c: (c[2], c[0])) if cands else (0, 0, 0)

run, mx, my = best
exp_x = LEFT + FRAC * WIDTH
ok_run = TRACK_H - 6 <= run <= TRACK_H + 6
ok_pos = abs(mx - exp_x) < 8
print('raya: %d px de alto (franja de %d) en x=%d · esperada x≈%.0f · %s %s'
      % (run, TRACK_H, mx, exp_x,
         'alto OK' if ok_run else 'ALTO MAL', 'posición OK' if ok_pos else 'POSICIÓN MAL (%+.1f px)' % (mx - exp_x)))

# --- 2. tramos: etiquetas dibujadas sí/no
segs, i = [], 0
while i < SPAN:
    d0 = start + timedelta(days=i)
    n = 1
    while i + n < SPAN and (start + timedelta(days=i + n)).month == d0.month:
        n += 1
    segs.append((i, n, d0.strftime('%b').lower()))
    i += n

y0, y1 = my + 5, my + run - 5
print('\nbanda y %d..%d · %d tramos' % (y0, y1, len(segs)))
missing, marked = [], []
for st, n, name in segs:
    xa = int(LEFT + st / SPAN * WIDTH) + 3
    xb = int(LEFT + (st + n) / SPAN * WIDTH) - 3
    ink = sum(1 for y in range(y0, y1) for x in range(xa, xb) if sum(at(x, y)) > INK)
    drawn = ink >= 8
    inside = xa <= mx < xb
    if drawn:
        marked.append(name)
    else:
        missing.append((name, n))
    print('  %-4s %3d d  %3d px  tinta %4d  %s%s'
          % (name, n, xb - xa, ink, 'etiqueta' if drawn else 'sin etiqueta',
             '   ← el día está aquí' if inside else ''))

# --- 3. raya de la luna (más alta que la de la franja), sólo en escritorio:
# en móvil la tira se parte en dos filas y cada raya vive en su celda
# el pie sólido de la raya de la luna (9 px) queda por encima de la franja;
# el caret de la franja también mide 6 px, así que se descarta por debajo del borde
moon_c = [c for c in cands_stem if c[2] < best[2] - 10]
if WIDTH > 600 and moon_c:
    mrun, mmx, mmy = max(moon_c, key=lambda c: c[2])
    exp_moon = LEFT + ((DOY - 1) + 0.5) / SPAN * WIDTH
    ok_moon = abs(mmx - exp_moon) < 12
    print('raya de la luna: pie de %d px en x=%d · esperada x≈%.0f · %s (%+.1f px)'
          % (mrun, mmx, exp_moon, 'OK' if ok_moon else 'MAL', mmx - exp_moon))
else:
    ok_moon = True
    print('raya de la luna: %s' % ('no comprobable a este ancho' if WIDTH <= 600 else 'NO ENCONTRADA'))
    ok_moon = WIDTH <= 600

widest = min(n for n, _ in [(n, x) for x, n in missing]) if missing else None
ok_labels = all(n < 10 for _, n in missing)          # sólo se ocultan los tramos minúsculos
ok_month = any(start + timedelta(days=st) <= WHEN < start + timedelta(days=st + n)
               and name in marked for st, n, name in segs)

print('\nsin etiqueta: %s' % (', '.join('%s(%dd)' % (n, k) for n, k in missing) or 'ninguno'))
print('%s etiquetas · %s mes resaltado coincide con el día'
      % ('OK' if ok_labels else 'FALLA', 'OK' if ok_month else 'FALLA'))
sys.exit(0 if (ok_run and ok_pos and ok_labels and ok_month and ok_moon) else 1)