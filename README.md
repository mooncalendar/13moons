# Sincronario de las 13 Lunas — calendario lunar

Aplicación web estática (sin build, sin dependencias, sin API externa) que muestra
**la Luna de hoy** desde tres lecturas a la vez:

1. **Fase lunar astronómica** — disco con terminador real, % iluminado, edad lunar y las
   próximas cuatro fases con hora local.
2. **Sincronario de las 13 Lunas (Dreamspell)** — luna del año (1–13), día 1–28,
   heptada, kin del Tzolkin, onda encantada, castillo y guía.
3. **Zodíaco** — signo tropical con grado y minuto + **constelación real** (límites IAU,
   por eso aparece Ofiuco).

Y todo anclado al **calendario gregoriano**: fecha larga, calendario mensual con la
doble fecha en cada celda, navegación por día/mes y enlace directo `?d=AAAA-MM-DD`.

Disponible en **español, português (BR), English y Deutsch**.

## El año en dos calendarios

Al final de la página, una tarjeta pone el año lunar y el año civil uno encima del
otro para poder leerlos en vertical:

```
       luna 4 · día 15                       20 nov 2026
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ] · · · [ 13 ]   ← 13 lunas de 28 días
 26 jul                  │   día fuera del tiempo · 25 jul
┌────┬─────┬─────┬─────┬─▲─────┬─────┬ · · ·  ┬────┐
│ jul│ ago │ sep │ oct │ nov   │ dic │        │ jul│
└────┴─────┴─────┴─────┴───────┴─────┴ · · ·  ┴────┘
  calendario gregoriano · 2026–2027    20 nov 2026
```

- La franja de abajo cubre **los mismos 364 días** (26 de julio → 24 de julio) pero
  repartidos por meses reales: los tramos no son iguales (31, 30, 28 días) justo
  para que se vea dónde cae cada luna respecto al mes civil. El 25 de julio, día
  fuera del tiempo, queda fuera de las dos tiras y sólo aparece en la leyenda.
- El **mes en curso** va resaltado en oro y el **día consultado** lo marca una raya
  vertical con su flecha **en las dos escalas**: dentro de la luna (posición
  `(día − ½) / 28` de la celda) y en la franja gregoriana (posición del día dentro
  de los 364). Al navegar con las flechas del teclado, las dos rayas se mueven
  juntas y siempre apuntan al mismo instante. En el día fuera del tiempo no hay raya
  en ninguna de las dos, porque ese día no pertenece a ninguna luna.
- Los tramos de mes se adaptan al hueco antes que recortarse: primero el nombre
  corto (`sept.`), luego la inicial (`S`) y sólo si ni eso cabe, sin etiqueta. En
  escritorio se leen los 13 nombres; en móvil, 12 iniciales y el trozo de julio de
  6 días sin etiqueta.

## Idiomas

El conmutador `ES · PT · EN · DE` está en la cabecera. El idioma se guarda en
`localStorage` y se puede forzar por URL:

```
index.html?lang=de
index.html?lang=pt&d=2028-02-29
```

- Todos los textos de interfaz viven en `i18n.js` (un objeto por idioma).
- Los **nombres de meses y días** no están traducidos a mano: se generan con
  `Intl.DateTimeFormat`, así que el orden («20 de noviembre» / «20 November» /
  «20. November»), las abreviaturas y el formato de números y porcentajes
  (`29,53` / `29.53`, `36 %` / `36%`) son los nativos de cada variante.
- Los nombres del Sincronario (20 sellos, 13 tonos, 13 lunas, castillos, tótems)
  también están traducidos. El orden de la firma cambia según el idioma
  («Dragón Magnético Rojo» vs «Red Magnetic Dragon» / «Roter Magnetischer Drache»)
  y los adjetivos concuerdan en género: portugués y español usan -o/-a
  («Semente Magnética Vermelha»), el alemán declina -er/-e/-es
  («Blaue Kristalline Hand», «Gelber Resonanter Stern»).

## Uso

```bash
# cualquier servidor estático, o simplemente abrir el archivo
xdg-open index.html
```

- `←` / `→` cambia de día, `T` vuelve a hoy.
- `index.html?d=2028-02-29` abre una fecha concreta.
- `index.html?lang=de` abre en alemán.

## Publicación

El sitio vive en **https://mooncalendar.github.io/13moons/**. Lo publica
`.github/workflows/pages.yml` en cada push a `main` (o a mano desde la pestaña
*Actions*, `workflow_dispatch`).

**Antes del primer despliegue** hay que activar Pages una sola vez, a mano:
*Settings → Pages → Source: GitHub Actions*. El workflow intenta activarlo por
API, pero crear el sitio exige permiso de administración y el `GITHUB_TOKEN` no
lo tiene; si falta, el flujo se corta en el paso «Comprobar que Pages está
activado» con ese mensaje en vez de fallar más tarde con un error genérico.

El flujo copia a `_site` sólo lo que el navegador necesita —`index.html`,
`app.js`, `i18n.js`— y nada de `tests/` ni `docs/`, para que el sitio publicado
no lleve la suite dentro. Antes de empaquetar comprueba dos cosas: que los tres
archivos existen y no están vacíos, y que cada `<script src>` del HTML resuelve
dentro del artefacto; un archivo olvidado en el `cp` dejaría la página en blanco,
así que el despliegue se corta ahí en lugar de publicar algo roto.

Las rutas de la app son todas relativas (`src="i18n.js"`), de modo que funciona
igual servida desde la raíz que desde el subdirectorio `/13moons/`. Eso no se da
por supuesto: `tests/check_served.py` monta el mismo artefacto, lo sirve por HTTP
bajo `/13moons/` y le pasa la suite entera; `tests/check.py --base <url>` hace lo
mismo contra el sitio ya publicado.

Después de desplegar, el propio workflow descarga la página y los dos scripts y
falla si no responden 200 o si el HTML no es la app. Si Pages tarda en propagar,
reintenta durante un minuto antes de darse por vencido.

## Cómo se calcula (y cómo se verificó)

### Sincronario de 13 Lunas

| Pieza | Regla |
|---|---|
| Año | 13 lunas × 28 días = 364 días + **Día Fuera del Tiempo** (25 de julio). Empieza el **26 de julio**. |
| Luna / día | `(días desde el 26 de julio) / 28` + 1 → luna 1–13, día 1–28 |
| Kin | Cuenta de 260 días desde el **26 de julio de 1987 = Kin 34** (Luna Magnética 1.1) |
| 29 de febrero | **0.0 Hunab Ku**: comparte fecha y kin con el 28 de febrero y **no avanza la cuenta** (por eso el ciclo de 52 años cierra exacto) |
| Sello / tono | `((kin-1) mod 20)+1` y `((kin-1) mod 13)+1` |
| Onda encantada | `ceil(kin/13)` → sello que la nombra, posición `((kin-1) mod 13)+1` |
| Castillo | 5 castillos de 52 días |
| Guía | Tabla por tono del tutorial (mismo color que el sello) |

Verificación contra un calculador Dreamspell independiente (starroot.com, CGI):

| Fecha | Esperado | Resultado |
|---|---|---|
| 1987-07-26 | Kin 34 · Luna 1.1 | ✅ |
| 2026-11-20 | Kin 86 · Luna 5.6 | ✅ |
| 2028-02-29 | Kin 31 · Luna 8.22 (= 28 feb) | ✅ |
| 2012-12-21 | Kin 207 (Mano Cristal Azul) | ✅ |

### Astronomía

Series de Meeus implementadas en JS puro, corregidas de ΔT (TT vs UT):

- **Longitud eclíptica lunar**: 39 términos principales de la serie ELP (Meeus cap. 47).
- **Longitud solar**: fórmula de precisión 0.01° (cap. 25) con nutación y aberración.
- **Fase**: elongación geocéntrica ψ; fracción iluminada = (1 − cos ψ)/2.
- **Instantes de fase**: bisección sobre la elongación (precisión ±30 s de cálculo).

Contraste con datos oficiales del **USNO**:

```
Fases 2026 (UTC)          USNO      app      Δ
Luna llena  24 nov 14:53  14:53     14:56    +3 min
Luna nueva   9 nov 07:02  07:02     07:04    +2 min
Cuarto crec. 17 nov 11:48 11:48     11:48     0 min
Cuarto meng.  1 nov 20:28 20:28     20:29    +1 min

Longitud solar en los 4 ingresos estacionales de 2026: error ≤ 0.3′
```

(Python de contraste en `research/`, ejecutable con `python3 research/verify.py`.)

### Constelaciones

Sectores reales de la eclíptica según los límites IAU:

| Constelación | desde | Constelación | desde |
|---|---|---|---|
| Aries | 29.08° | Libra | 217.80° |
| Tauro | 53.47° | Escorpio | 241.05° |
| Géminis | 90.40° | **Ofiuco** | 247.79° |
| Cáncer | 117.43° | Sagitario | 266.61° |
| Leo | 138.02° | Capricornio | 299.71° |
| Virgo | 173.93° | Acuario | 327.58° |
| | | Piscis | 351.57° |

El signo tropical y la constelación difieren ≈ 24° (precesión de los equinoccios):
en 2026 el Sol está en Sagitario mientras astronómicamente recorre Escorpio/Ofiuco.

## Verificación de la interfaz

El motor se probó dentro del navegador (no solo en Python). Cada valor se codifica en
un código de barras 2D que se lee desde un script y se compara con la referencia:

```
?barcode=1       → 14 valores: kin, luna, día, longitud, constelación…   → 14/14 OK
?barcode=layout  → geometría real del DOM (anchos, scrollWidth, celdas)  → 0 desbordes
?selftest=1      → informe de texto en pantalla
?rects=1         → rectángulos de las piezas clave a la consola (geometría exacta)
?dump=1          → volcado de `innerText` a la consola (revisión de traducciones)
```

Las cuatro lenguas se comprueban igual: `?selftest=1&lang=xx` (mismos kin, lunas y
constelaciones en los cuatro) y `?barcode=layout&lang=xx` a 1280 px y a 390 px
(7 columnas por fila, 13 lunas en la tira, 260 celdas del Tzolkin, 0 desbordes,
13 tramos de mes que cubren el 100 % de la franja gregoriana, una sola raya de día
en cada escala, la raya de la luna a la altura del día correcto y ninguna etiqueta
saliéndose de su tramo).

Todo eso está empaquetado en un solo comando, sin dependencias y en un Firefox
headless real (no hay navegador simulado: los valores se leen de la captura):

```
python3 tests/check.py            # datos + maquetación + autotest, en es/pt/en/de
python3 tests/check.py --shots    # además capturas de página completa en tests/shots/
python3 tests/check.py -l de      # un idioma suelto
python3 tests/check.py --only doot   # el desplegable del día fuera del tiempo
python3 tests/check.py --only thumb  # la miniatura de la pestaña, contada en píxeles
```

Y las sondas sueltas, para mirar un detalle concreto:

```
python3 tests/check_served.py                                     # el artefacto servido como en Pages
python3 tests/check.py --base https://mooncalendar.github.io/13moons   # contra el sitio ya publicado
python3 tests/shot_mobile.py es                                   # captura a 390 px
python3 tests/verify_pixels.py 2026-11-01 79 1110 tests/shots/desktop_es.png
python3 tests/markers.py                                          # rayas en 4 fechas
python3 tests/rects.py 390 4200 es                                # geometría exacta
```

Salida esperada: `TODO OK` y código de salida 0. Cada grupo imprime su recuento
(`datos 14/14`, `layout … 0 desbordes`, `autotest 6/6 anclas`); si algo falla,
se imprime el valor obtenido frente al esperado.

## Estructura

```
index.html        estructura + sistema de diseño (CSS propio, tema oscuro)
i18n.js           los cuatro idiomas: interfaz + sellos, tonos, lunas, castillos…
app.js            astronomía + Dreamspell + render (sin cadenas de texto fijas)
tests/
  check.py        suite automática: datos, maquetación y autotest en cuatro idiomas
  verify_pixels.py comprobación en píxeles sobre una captura ya hecha
  markers.py      raya del día en las dos escalas, en varias fechas
  rects.py        geometría exacta de las piezas clave (sonda ?rects=1)
  shot_mobile.py  captura a 390 px de ancho
  tools/          volcado ASCII de capturas y recuento de tinta por tramo
docs/research/    prototipos de validación en Python (fase de diseño)
```

Sin dependencias: sólo Python 3 y un Firefox para las pruebas. La app en sí es
estática — se abre `index.html` y funciona.

## Fuentes

- Tutorial del Sincronario de 13 Lunas (13lunas.net) — nombres, poderes, heptadas, plasmas.
- Foundation for the Law of Time (lawoftime.org) — nombres y tótems de las 13 lunas, fechas.
- Wikipedia, *Dreamspell* — estructura de 52 años, día Hunab Ku, numeración NS.
- Jean Meeus, *Astronomical Algorithms* (2.ª ed.) — cap. 25, 47, 48, 49.
- USNO Astronomical Applications API — fases y estaciones de 2026.
- starroot.com — calculador Dreamspell de contraste.

*El Sincronario es un sistema simbólico; no sustituye el calendario civil.*
