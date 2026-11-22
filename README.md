# Sincronario de las 13 Lunas — moon calendar

A static web app (no build step, no dependencies, no external API) that shows
**today's moon** through three readings at once:

1. **Astronomical lunar phase** — disc with a real terminator, % illuminated,
   lunar age and the next four phases with local time.
2. **Sincronario de las 13 Lunas (Dreamspell)** — moon of the year (1–13),
   day 1–28, heptad, Tzolkin kin, wavespell, castle and guide.
3. **Zodiac** — tropical sign with degree and minute + **real constellation**
   (IAU boundaries, which is why Ophiuchus shows up).

And all of it anchored to the **Gregorian calendar**: long date, monthly
calendar with both dates in every cell, day/month navigation and a deep link
`?d=YYYY-MM-DD`.

Available in **Spanish, Português (BR), English and Deutsch**.

## The year in two calendars

Right under the moon of the year, a card stacks the 13-moon year and the civil
year so they can be read vertically, and the month calendar follows it:

```
       moon 4 · day 15                      20 Nov 2026
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ] · · · [ 13 ]   ← 13 moons of 28 days
 26 Jul                  │   day out of time · 25 Jul
┌────┬─────┬─────┬─────┬─▲─────┬─────┬ · · ·  ┬────┐
│ Jul│ Aug │ Sep │ Oct │ Nov   │ Dec │        │ Jul│
└────┴─────┴─────┴─────┴───────┴─────┴ · · ·  ┴────┘
  Gregorian calendar · 2026–2027       20 Nov 2026
```

- The lower strip covers **the same 364 days** (26 July → 24 July) but spread
  across real months: the segments are not equal (31, 30, 28 days) precisely so
  you can see where each moon falls against the civil month. 25 July, the day
  out of time, sits outside both strips and appears only in the legend.
- The **current month** is highlighted in gold and the **selected day** is
  marked by a vertical marker with an arrow **on both scales**: inside the moon
  (position `(day − ½) / 28` of the cell) and in the Gregorian strip (position
  of the day within the 364). Navigating with the keyboard arrows moves both
  markers together, always pointing at the same instant. On the day out of time
  there is no marker on either scale, because that day belongs to no moon.
- Month segments adapt to the space before being cut: first the short name
  (`Sept`), then the initial (`S`), and only if neither fits, no label. On
  desktop all 13 names are readable; on mobile, 12 initials and the 6-day July
  stretch with no label.

## Languages

The `ES · PT · EN · DE` switch sits in the header. The language is stored in
`localStorage` and can be forced through the URL:

```
index.html?lang=de
index.html?lang=pt&d=2028-02-29
```

- Every interface string lives in `i18n.js` (one object per language).
- **Month and day names** are not translated by hand: they come from
  `Intl.DateTimeFormat`, so the order ("20 de noviembre" / "20 November" /
  "20. November"), the abbreviations and the number and percentage formats
  (`29,53` / `29.53`, `36 %` / `36%`) are native to each variant.
- The Sincronario names (20 seals, 13 tones, 13 moons, castles, totems) are
  translated too. The signature order changes with the language
  ("Dragón Magnético Rojo" vs "Red Magnetic Dragon" / "Roter Magnetischer
  Drache") and the adjectives agree in gender: Portuguese and Spanish use
  -o/-a ("Semente Magnética Vermelha"), German declines -er/-e/-es
  ("Blaue Kristalline Hand", "Gelber Resonanter Stern").

## Usage

```bash
# any static server, or simply open the file
xdg-open index.html
```

- `←` / `→` change the day, `T` goes back to today.
- `index.html?d=2028-02-29` opens a specific date.
- `index.html?lang=de` opens in German.

### The date bar and the tab icon

The date controls are **sticky**: they pin to the top edge once the page is
scrolled, so a date can be changed from anywhere, and they only paint their
glass background while pinned (the top of the page stays clean). Nothing above
them may scroll horizontally — `overflow-x: clip` on `body` rather than
`hidden`, which would turn the body into a scroll container and silently break
`position: sticky`.

The tab icon is drawn, not an image: the 13-segment gold ring counts the moons
of the year, the disc shows the moon of the day being viewed (same `moonPath()`
as the big disc, so it waxes and wanes with the date) and the craters are
clipped to the lit face, so they only appear on the side the Sun is hitting.
The static copy in `index.html` is what the browser shows before the script
runs; `tests/check.py --only favicon` renders both at 512 px and counts the
ring segments and the crater pixels, with the crater group stripped as a
control.

## Publishing

The site lives at **https://mooncalendar.github.io/13moons/**. It is published
by `.github/workflows/pages.yml` on every push to `main` (or by hand from the
*Actions* tab, `workflow_dispatch`).

**Before the first deploy** Pages has to be enabled once, by hand:
*Settings → Pages → Source: GitHub Actions*. The workflow tries to enable it
through the API, but creating the site requires admin permission and
`GITHUB_TOKEN` does not have it; if it is missing, the run stops at the "Check
that Pages is enabled" step with that message instead of failing later with a
generic error.

The workflow copies only what the browser needs into `_site` —`index.html`,
`app.js`, `i18n.js`— and nothing from `tests/` or `docs/`, so the published
site does not carry the suite. Before packaging it checks two things: that the
three files exist and are not empty, and that every `<script src>` in the HTML
resolves inside the artefact; a file left out of the `cp` would leave the page
blank, so the deploy stops there instead of publishing something broken.

The app's paths are all relative (`src="i18n.js"`), so it works the same served
from the root or from the `/13moons/` subdirectory. That is not taken on trust:
`tests/check_served.py` mounts the same artefact, serves it over HTTP under
`/13moons/` and runs the whole suite against it; `tests/check.py --base <url>`
does the same against the already published site.

After deploying, the workflow itself downloads the page and both scripts and
fails if they do not answer 200 or if the HTML is not the app. If Pages is slow
to propagate, it retries for a minute before giving up.

## How it is calculated (and how it was verified)

### 13-moon Sincronario

| Piece | Rule |
|---|---|
| Year | 13 moons × 28 days = 364 days + **Day Out of Time** (25 July). Starts on **26 July**. |
| Moon / day | `(days since 26 July) / 28` + 1 → moon 1–13, day 1–28 |
| Kin | 260-day count from **26 July 1987 = Kin 34** (Magnetic Moon 1.1) |
| 29 February | **0.0 Hunab Ku**: shares the date and kin with 28 February and **does not advance the count** (which is why the 52-year cycle closes exactly) |
| Seal / tone | `((kin-1) mod 20)+1` and `((kin-1) mod 13)+1` |
| Wavespell | `ceil(kin/13)` → naming seal, position `((kin-1) mod 13)+1` |
| Castle | 5 castles of 52 days |
| Guide | Per-tone table from the tutorial (same colour as the seal) |

The kin card closes with the **harmonic module** (`13 × 20 = 260` cells, the
tzolkin round): one cell per kin, 20 consecutive days per column, the seal
fixed per row and the tone advancing one step per cell — since 13 does not
divide 20 the tone cycle drifts seven rows per column, which is the diagonal
you see. The cell of the current kin carries an outline and the counter reads
`kin/260`. The disclosure under the grid explains what the grid is and what
the module means, including where the arithmetic ends and the modern
(Dreamspell) reading begins.

Checked against an independent Dreamspell calculator (starroot.com, CGI):

| Date | Expected | Result |
|---|---|---|
| 1987-07-26 | Kin 34 · Moon 1.1 | ✅ |
| 2026-11-20 | Kin 86 · Moon 5.6 | ✅ |
| 2028-02-29 | Kin 31 · Moon 8.22 (= 28 Feb) | ✅ |
| 2012-12-21 | Kin 207 (Blue Crystal Hand) | ✅ |

### Astronomy

Meeus series implemented in plain JS, corrected for ΔT (TT vs UT):

- **Lunar ecliptic longitude**: 39 leading terms of the ELP series (Meeus ch. 47).
- **Solar longitude**: 0.01° accuracy formula (ch. 25) with nutation and aberration.
- **Phase**: geocentric elongation ψ; illuminated fraction = (1 − cos ψ)/2.
- **Phase instants**: bisection on the elongation (±30 s of calculation precision).

Cross-checked against official **USNO** data:

```
Phases 2026 (UTC)         USNO      app      Δ
Full moon   24 Nov 14:53  14:53     14:56    +3 min
New moon     9 Nov 07:02  07:02     07:04    +2 min
First qtr.  17 Nov 11:48  11:48     11:48     0 min
Last qtr.    1 Nov 20:28  20:28     20:29    +1 min

Solar longitude at the 4 seasonal ingresses of 2026: error ≤ 0.3′
```

(Cross-check Python in `docs/research/`, runnable with
`python3 docs/research/verify.py`.)

### Constellations

Real ecliptic sectors according to the IAU boundaries:

| Constellation | from | Constellation | from |
|---|---|---|---|
| Aries | 29.08° | Libra | 217.80° |
| Taurus | 53.47° | Scorpius | 241.05° |
| Gemini | 90.40° | **Ophiuchus** | 247.79° |
| Cancer | 117.43° | Sagittarius | 266.61° |
| Leo | 138.02° | Capricornus | 299.71° |
| Virgo | 173.93° | Aquarius | 327.58° |
| | | Pisces | 351.57° |

The tropical sign and the constellation differ by ≈ 24° (precession of the
equinoxes): in 2026 the Sun is in Sagittarius while astronomically it travels
through Scorpius/Ophiuchus.

## Interface verification

The engine was tested inside the browser (not only in Python). Every value is
encoded in a 2D barcode that a script reads and compares with the reference:

```
?barcode=1       → 14 values: kin, moon, day, longitude, constellation…  → 14/14 OK
?barcode=layout  → real DOM geometry (widths, scrollWidth, cells)         → 0 overflow
?selftest=1      → text report on screen
?rects=1         → rectangles of the key pieces to the console (exact geometry)
?thumb=1         → the tab thumbnail at 240x240 on white (counted in pixels)
?sticky=1        → the date bar's position at four scroll offsets
?doot=1          → the day-out-of-time disclosure, opened and measured
?dump=1          → `innerText` dump to the console (translation review)
```

All four languages are checked the same way: `?selftest=1&lang=xx` (same kin,
moons and constellations in all four) and `?barcode=layout&lang=xx` at 1280 px
and 390 px (7 columns per row, 13 moons in the strip, 260 Tzolkin cells, 0
overflow, 13 month segments covering 100 % of the Gregorian strip, one day
marker per scale, the moon marker at the right day and no label spilling out of
its segment).

All of that is packaged into a single command, no dependencies and a real
headless Firefox (there is no simulated browser: the values are read from the
screenshot):

```
python3 tests/check.py            # data + layout + selftest, in es/pt/en/de
python3 tests/check.py --shots    # plus full-page screenshots in tests/shots/
python3 tests/check.py -l de      # a single language
python3 tests/check.py --only doot   # the day-out-of-time disclosure
python3 tests/check.py --only sticky # the date bar stays pinned
python3 tests/check.py --only favicon # ring segments + craters, counted in pixels
python3 tests/check.py --only thumb  # the tab thumbnail, counted in pixels
```

And the standalone probes, to look at one detail:

```
python3 tests/check_served.py                                          # the artefact served as on Pages
python3 tests/check.py --base https://mooncalendar.github.io/13moons   # against the published site
python3 tests/shot_mobile.py es                                        # screenshot at 390 px
python3 tests/verify_pixels.py 2026-11-01 es 1280                      # pixels, both scales
python3 tests/markers.py                                               # markers on 4 dates
python3 tests/rects.py 390 4200 es                                     # exact geometry
python3 tests/doot.py                                                  # same as --only doot
python3 tests/thumb.py                                                 # same as --only thumb
```

Expected output: `ALL OK` and exit code 0. Each group prints its count
(`data 14/14`, `layout … 0 overflow`, `selftest 6/6 anchors`); if anything
fails, the value obtained is printed next to the expected one.

## Structure

```
index.html        structure + design system (hand-written CSS, dark theme)
i18n.js           the four languages: interface + seals, tones, moons, castles…
app.js            astronomy + Dreamspell + render (no hard-coded copy)
tests/
  check.py        the suite: data, layout, selftest, doot, sticky, favicon, thumb
  verify_pixels.py pixel check on an already taken screenshot
  markers.py      day marker on both scales, across several dates
  rects.py        exact geometry of the key pieces (?rects=1 probe)
  shot_mobile.py  screenshot at 390 px wide
  doot.py         shortcut for --only doot
  thumb.py        shortcut for --only thumb
  tools/          ASCII dump of screenshots and ink count per segment
docs/research/    Python validation prototypes (design phase)
```

No dependencies: just Python 3 and a Firefox for the tests. The app itself is
static — open `index.html` and it works.

## Sources

- Sincronario de 13 Lunas tutorial (13lunas.net) — names, powers, heptads, plasmas.
- Foundation for the Law of Time (lawoftime.org) — names and totems of the 13 moons, dates.
- Wikipedia, *Dreamspell* — 52-year structure, Hunab Ku day, NS numbering.
- Jean Meeus, *Astronomical Algorithms* (2nd ed.) — ch. 25, 47, 48, 49.
- USNO Astronomical Applications API — 2026 phases and seasons.
- starroot.com — cross-check Dreamspell calculator.

*The Sincronario is a symbolic system; it does not replace the civil calendar.*
