/* ============================================================
   Sincronario de las 13 Lunas — motor de cálculo + render
   Sin dependencias. Astronomía: series de Meeus (47/48/25).
   Calendario: Dreamspell (Argüelles), anclado y verificado.
   ============================================================ */
'use strict';

/* ---------------------------------- utilidades */
const RAD = Math.PI / 180;
const pad2 = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------- estructura (independiente del idioma) */
// Los nombres traducidos viven en i18n.js; aquí solo índices y geometría.
const CONST_LIMITS = [29.08, 53.47, 90.40, 117.43, 138.02, 173.93,
  217.80, 241.05, 247.79, 266.61, 299.71, 327.58, 351.57];
const SIGN_GLYPHS = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D',
  '\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
const CASTLE_RANGES = [[1,52],[53,104],[105,156],[157,208],[209,260]];
const COLOR_HEX = { rojo:'#e0544e', blanco:'#eef1f8', azul:'#4f81e6', amarillo:'#e8b53c' };

const sealColor = seal => SEAL_COLORS[(seal - 1) % 4];
const sealOf = i => { const r = L().seals[i - 1]; return { i, name:r[0], power:r[1], action:r[2], essence:r[3], color: sealColor(i) }; };
const toneOf = i => { const r = L().tones[i - 1]; return { i, name:r[0], power:r[1], action:r[2], essence:r[3] }; };
const moonOf = i => { const r = L().moons[i - 1]; return { i, name:r[0], short:r[1], totem:r[2] }; };
const castleOf = kin => { const n = CASTLE_RANGES.findIndex(([a, b]) => kin >= a && kin <= b); return L().castles[n < 0 ? 4 : n]; };
const colorName = tok => (L().colors[tok] || tok);

// "Dragón Magnético Rojo" (es, pt) / "Red Magnetic Dragon" (en) / "Roter Magnetischer Drache" (de)
function sigName(seal, tone) {
  const loc = L();
  const s = sealOf(seal), tn = toneOf(tone);
  const g = loc.gender ? loc.gender[seal - 1] : 'm';

  // alemán: adjetivos delante del sustantivo y declinados
  if (loc.adjTones) {
    const end = g === 'f' ? 'e' : g === 'n' ? 'es' : 'er';
    return `${cap(loc.adjColors[s.color] + end)} ${cap(loc.adjTones[tone - 1] + end)} ${s.name}`;
  }
  // es/pt: el adjetivo va detrás y concuerda en -o / -a
  const agree = w => (g === 'f' && /o$/.test(w)) ? w.slice(0, -1) + 'a' : w;
  const c = agree(loc.colors[s.color]);
  const tnm = agree(tn.name);
  return loc.sigOrder === 'cts' ? `${c} ${tnm} ${s.name}` : `${s.name} ${tnm} ${c}`;
}

/* ---------------------------------- astronomía */
function deltaTsec(year) {
  const t = year - 2000;
  return clamp(62.92 + 0.32217 * t + 0.005589 * t * t, 40, 200);
}
const jdFromMs = ms => ms / 86400000 + 2440587.5;
const msFromJd = jd => (jd - 2440587.5) * 86400000;

function moonPos(jdUT) {
  const year = 2000 + (jdUT - 2451545) / 365.25;
  const jd = jdUT + deltaTsec(year) / 86400;         // TT
  const T = (jd - 2451545.0) / 36525.0;
  const Lp = 218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - Math.pow(T,4)/65194000;
  const D  = 297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - Math.pow(T,4)/113065000;
  const M  = 357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000;
  const Mp = 134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - Math.pow(T,4)/14712000;
  const F  = 93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + Math.pow(T,4)/863310000;

  const lonT = [
    [6288774,0,0,1,0],[1274027,2,0,-1,0],[658314,2,0,0,0],[213618,0,0,2,0],[-185116,0,1,0,0],
    [-114332,0,0,0,2],[58793,2,0,-2,0],[57066,2,-1,-1,0],[53322,2,0,1,0],[45758,2,-1,0,0],
    [-40923,0,1,-1,0],[-34720,1,0,0,0],[-30383,0,1,1,0],[15327,2,0,0,-2],[-12528,0,0,1,2],
    [10980,0,0,1,-2],[10675,4,0,-1,0],[10034,0,0,3,0],[8548,4,-1,-2,0],[-7888,2,1,-1,0],
    [-6766,2,1,0,0],[-5163,1,0,-1,0],[4987,1,1,0,0],[4036,2,-1,1,0],[3994,2,0,2,0],
    [3861,4,0,0,0],[3665,2,0,-3,0],[-2689,0,1,-2,0],[-2602,2,0,-1,2],[2390,2,-1,-2,0],
    [-2348,1,0,1,0],[2236,2,-2,0,0],[-2120,0,1,2,0],[-2069,0,2,0,0],[2048,2,-2,-1,0],
    [-1773,2,0,1,-2],[-1595,2,0,0,2],[1215,4,-1,-1,0],[-1110,0,0,2,2]
  ];
  let lon = Lp;
  for (const [c, d, m, mp, f] of lonT)
    lon += c * Math.sin((d*D + m*M + mp*Mp + f*F) * RAD) / 1e6;

  const latT = [
    [5128122,0,0,0,1],[280602,0,0,1,1],[277693,0,0,1,-1],[173237,2,0,0,-1],[55413,2,0,-1,1],
    [46271,2,0,-1,-1],[32573,2,0,0,1],[17198,0,0,2,1],[9266,2,0,1,-1],[8822,0,0,2,-1],
    [8216,2,-1,0,-1],[4324,2,0,-2,-1],[4200,2,0,1,1],[-3359,2,1,0,-1],[2463,2,-1,-1,1],
    [2211,2,-1,0,1],[2065,2,-1,-1,-1],[-1870,0,1,-1,-1],[1828,4,0,-1,-1],[-1794,0,1,0,1],
    [-1749,0,0,0,3],[-1565,0,1,-1,1],[-1491,1,0,0,1],[-1475,0,1,1,1],[-1410,0,1,1,-1],
    [-1344,0,1,0,-1],[-1335,1,0,0,-1],[1107,0,0,3,1],[1021,4,0,0,-1],[833,4,-1,-1,-1]
  ];
  let lat = 0;
  for (const [c, d, m, mp, f] of latT)
    lat += c * Math.sin((d*D + m*M + mp*Mp + f*F) * RAD) / 1e6;

  return { lon: ((lon % 360) + 360) % 360, lat };
}

function sunLon(jdUT) {
  const year = 2000 + (jdUT - 2451545) / 365.25;
  const T = (jdUT + deltaTsec(year) / 86400 - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T;
  const M  = 357.52911 + 35999.05029*T - 0.0001537*T*T;
  const C  = (1.914602 - 0.004817*T - 0.000014*T*T) * Math.sin(M*RAD)
           + (0.019993 - 0.000101*T) * Math.sin(2*M*RAD)
           + 0.000289 * Math.sin(3*M*RAD);
  const om = 125.04 - 1934.136*T;
  return ((L0 + C - 0.00569 - 0.00478*Math.sin(om*RAD)) % 360 + 360) % 360;
}

// elongación Luna–Sol en longitud (0 = nueva, 180 = llena)
function elongation(jdUT) {
  return ((moonPos(jdUT).lon - sunLon(jdUT)) % 360 + 360) % 360;
}

function moonState(ms) {
  const jd = jdFromMs(ms);
  const { lon, lat } = moonPos(jd);
  const elong = elongation(jd);
  const cosPsi = Math.cos(lat * RAD) * Math.cos(elong * RAD);
  const psi = Math.acos(clamp(cosPsi, -1, 1)) / RAD;     // elongación real
  const illum = (1 - Math.cos(psi * RAD)) / 2;            // fracción iluminada
  const age = elong / 360 * 29.530588853;
  return {
    lon, lat, elong, illum, age,
    waxing: elong < 180,          // creciente
    waxingElong: elong
  };
}

function signedDiff(jd, target) {
  return ((elongation(jd) - target + 540) % 360) - 180;
}

function nextPhase(fromJd, target) {
  let jd = fromJd, prev = signedDiff(jd, target);
  for (let i = 0; i < 220; i++) {
    const njd = jd + 0.25;
    const cur = signedDiff(njd, target);
    if (prev < 0 && cur >= 0 && (cur - prev) < 30) {
      let lo = jd, hi = njd;
      for (let j = 0; j < 34; j++) {
        const mid = (lo + hi) / 2;
        if (signedDiff(mid, target) < 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    jd = njd; prev = cur;
  }
  return null;
}

// fase anterior más cercana (para la edad lunar real)
function prevPhase(fromJd, target) {
  let jd = fromJd, prev = signedDiff(jd, target);
  for (let i = 0; i < 220; i++) {
    const pjd = jd - 0.25;
    const cur = signedDiff(pjd, target);
    if (prev > 0 && cur <= 0 && (prev - cur) < 30) {
      let lo = pjd, hi = jd;
      for (let j = 0; j < 34; j++) {
        const mid = (lo + hi) / 2;
        if (signedDiff(mid, target) > 0) hi = mid; else lo = mid;
      }
      return (lo + hi) / 2;
    }
    jd = pjd; prev = cur;
  }
  return null;
}

const PHASE_TARGETS = [
  { key:'nueva',     t:0,   idx:0 },
  { key:'creciente', t:90,  idx:2 },
  { key:'llena',     t:180, idx:4 },
  { key:'menguante', t:270, idx:6 }
];

// 0..7 -> L().phases8 (mismos límites de 45° que antes)
function phaseIndex(elong) {
  const e = ((elong % 360) + 360) % 360;
  if (e < 22.5 || e >= 337.5) return 0;
  if (e < 67.5)  return 1;
  if (e < 112.5) return 2;
  if (e < 157.5) return 3;
  if (e < 202.5) return 4;
  if (e < 247.5) return 5;
  if (e < 292.5) return 6;
  return 7;
}
const phaseName = elong => L().phases8[phaseIndex(elong)];

/* ---------------------------------- Dreamspell */
const EPOCH_KIN = 34;                     // 26 jul 1987 = Kin 34, Luna Magnética 1.1
const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const utcMs = (y, m, d) => Date.UTC(y, m - 1, d);   // m: 1-12

// días transcurridos omitiendo los 29 de febrero (0.0 Hunab Ku)
function countedDays(y1, m1, d1, y2, m2, d2) {
  const a = utcMs(y1, m1, d1), b = utcMs(y2, m2, d2);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const yA = new Date(lo).getUTCFullYear(), yB = new Date(hi).getUTCFullYear();
  let leap = 0;
  for (let y = yA; y <= yB; y++) {
    if (!isLeap(y)) continue;
    const f = utcMs(y, 2, 29);
    if (f > lo && f <= hi) leap += 1;
  }
  const n = Math.round((b - a) / 86400000);
  return b >= a ? n - leap : n + leap;
}

function dreamspell(y, m, d) {
  let ey = y, em = m, ed = d;
  const hunab = (m === 2 && d === 29);        // 0.0 Hunab Ku: misma fecha que el 28
  if (hunab) ed = 28;

  const kin = ((EPOCH_KIN - 1 + countedDays(1987, 7, 26, ey, em, ed)) % 260 + 260) % 260 + 1;

  const noch = (em > 7 || (em === 7 && ed >= 26));
  const startYear = noch ? ey : ey - 1;
  const doy = countedDays(startYear, 7, 26, ey, em, ed) + 1;   // 1..364 (+365 = día fuera del tiempo)

  const isDoot = !hunab && doy === 365;             // 25 de julio
  let moon = isDoot ? 0 : Math.floor((doy - 1) / 28) + 1;
  let mday = isDoot ? 0 : ((doy - 1) % 28) + 1;
  const ns = ey - 1987 + (noch ? 1 : 0);

  const tone = ((kin - 1) % 13) + 1;
  const seal = ((kin - 1) % 20) + 1;
  const heptad = mday ? Math.floor((mday - 1) / 7) + 1 : 0;   // 1..4
  const plasma = mday ? (mday - 1) % 7 : 0;                   // 0..6

  return {
    kin, seal, tone, moon, mday, doy, ns, heptad, plasma, hunab,
    isDoot,
    wavespell: Math.ceil(kin / 13),
    wpos: ((kin - 1) % 13) + 1,
    harmonic: Math.ceil(kin / 4),
    castle: castleOf(kin),
    guide: guideOf(seal, tone)
  };
}

// Kin guía según el tono (tabla del tutorial)
function guideOf(seal, tone) {
  const off = { 1:0, 6:0, 11:0, 2:12, 7:12, 12:12, 3:4, 8:4, 13:4, 4:-4, 9:-4, 5:8, 10:8 }[tone];
  const gs = ((seal - 1 + off) % 20 + 20) % 20 + 1;
  return { seal: gs, tone, kin: kinFor(gs, tone) };
}
// kin correspondiente a un sello y un tono (1..260)
function kinFor(seal, tone) {
  for (let n = 1; n <= 260; n++)
    if (((n - 1) % 20) + 1 === seal && ((n - 1) % 13) + 1 === tone) return n;
  return 0;
}


/* ---------------------------------- glifos SVG */
// Sello solar estilizado: anillo + motivo según el sello
function sealGlyph(seal, color) {
  const c = COLOR_HEX[color];
  const k = seal - 1;
  const motifs = [
    // 0 dragón: dos ojos + boca
    `<path d="M12 26c0-7 5-12 13-12s13 5 13 12-5 12-13 12-13-5-13-12z" fill="none"/><circle cx="19" cy="24" r="2.6"/><circle cx="32" cy="24" r="2.6"/><path d="M18 32c4 3 10 3 14 0" fill="none"/>`,
    // 1 viento
    `<path d="M8 22h18a5 5 0 1 0-5-5" fill="none"/><path d="M8 30h22a4 4 0 1 1-4 4" fill="none"/>`,
    // 2 noche
    `<path d="M34 22a12 12 0 1 1-14-11 9 9 0 0 0 14 11z" fill="none"/><circle cx="31" cy="15" r="1.8"/>`,
    // 3 semilla
    `<path d="M25 36c-7-4-10-10-10-16 6 0 12 3 16 9-1 4-3 6-6 7z" fill="none"/><path d="M25 36c0-8 1-13 4-18" fill="none"/>`,
    // 4 serpiente
    `<path d="M12 30c6 4 12 4 16 0s-4-8-10-8-6 6 0 6 8-4 6-8" fill="none"/>`,
    // 5 enlazador
    `<circle cx="25" cy="24" r="9" fill="none"/><path d="M25 9v30M12 24h26" />`,
    // 6 mano
    `<path d="M18 34V20a3 3 0 0 1 6 0v-4a3 3 0 0 1 6 0v4a3 3 0 0 1 6 0v14a8 8 0 0 1-16 0z" fill="none"/>`,
    // 7 estrella
    `<path d="M25 10v28M12 18l26 12M38 18L12 30" fill="none"/>`,
    // 8 luna
    `<circle cx="25" cy="24" r="11" fill="none"/><path d="M25 13a11 11 0 0 0 0 22" fill="none"/>`,
    // 9 perro
    `<circle cx="25" cy="26" r="9" fill="none"/><path d="M16 19l-3-6M34 19l3-6" fill="none"/><circle cx="21" cy="24" r="1.6"/><circle cx="29" cy="24" r="1.6"/>`,
    // 10 mono
    `<circle cx="25" cy="24" r="9" fill="none"/><path d="M13 22c-3 0-4 3-2 5M37 22c3 0 4 3 2 5" fill="none"/><path d="M20 28c2 3 8 3 10 0" fill="none"/>`,
    // 11 humano
    `<circle cx="25" cy="17" r="5" fill="none"/><path d="M16 36c0-6 4-10 9-10s9 4 9 10" fill="none"/>`,
    // 12 caminante
    `<path d="M12 32l9-16 6 9 5-6 6 13z" fill="none"/><circle cx="33" cy="13" r="2.4"/>`,
    // 13 mago
    `<path d="M25 9l8 12h-16z" fill="none"/><circle cx="25" cy="28" r="7" fill="none"/><path d="M12 36h26" fill="none"/>`,
    // 14 águila
    `<path d="M10 22c6-4 10-4 15 2 5-6 9-6 15-2-4 8-10 12-15 12s-11-4-15-12z" fill="none"/>`,
    // 15 guerrero
    `<path d="M25 10l10 6v10c0 8-5 12-10 14-5-2-10-6-10-14V16z" fill="none"/><path d="M20 24l4 5 7-9" fill="none"/>`,
    // 16 tierra
    `<circle cx="25" cy="24" r="11" fill="none"/><path d="M14 24h22M25 13c4 5 4 17 0 22M25 13c-4 5-4 17 0 22" fill="none"/>`,
    // 17 espejo
    `<path d="M25 10l9 14-9 14-9-14z" fill="none"/><path d="M25 15v18" fill="none"/>`,
    // 18 tormenta
    `<path d="M14 20h14l-4 8h10l-14 12 4-10h-10z" fill="none"/>`,
    // 19 sol
    `<circle cx="25" cy="24" r="8" fill="none"/><path d="M25 8v5M25 35v5M9 24h5M36 24h5M14 13l3.5 3.5M32.5 30.5L36 34M36 14l-3.5 3.5M17.5 30.5L14 34" fill="none"/>`
  ];
  return `<svg viewBox="0 0 50 50" fill="none" stroke="${c}" stroke-width="2.1"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="25" cy="25" r="21" stroke="${c}" stroke-opacity=".35" stroke-width="1.4"/>
    ${motifs[k] || ''}</svg>`;
}

// Disco lunar: terminador como elipse proyectada
function moonPath(k, waxing) {
  const N = 56;
  const rx = Math.abs(1 - 2 * k);
  const limb = waxing ? 1 : -1;
  const bulge = (k < 0.5 ? 1 : -1) * (waxing ? 1 : -1);
  let d = '';
  for (let i = 0; i <= N; i++) {
    const p = Math.PI * i / N;
    d += (i ? 'L' : 'M') + (limb * Math.sin(p)).toFixed(4) + ' ' + (-Math.cos(p)).toFixed(4);
  }
  for (let i = N; i >= 0; i--) {
    const p = Math.PI * i / N;
    d += 'L' + (bulge * rx * Math.sin(p)).toFixed(4) + ' ' + (-Math.cos(p)).toFixed(4);
  }
  return d + 'Z';
}

function bigMoonSVG(k, waxing) {
  return `
    <defs>
      <radialGradient id="lit" cx="34%" cy="28%" r="82%">
        <stop offset="0%" stop-color="#fffdf3"/>
        <stop offset="52%" stop-color="#f1e6c8"/>
        <stop offset="100%" stop-color="#c9b58a"/>
      </radialGradient>
      <radialGradient id="dark" cx="38%" cy="32%" r="78%">
        <stop offset="0%" stop-color="#20243a"/>
        <stop offset="100%" stop-color="#0d0f1c"/>
      </radialGradient>
      <clipPath id="disc"><circle cx="0" cy="0" r="1"/></clipPath>
    </defs>
    <circle cx="0" cy="0" r="1.005" fill="url(#dark)" stroke="rgba(255,255,255,.14)" stroke-width=".012"/>
    <path d="${moonPath(k, waxing)}" fill="url(#lit)"/>
    <g clip-path="url(#disc)" opacity=".13" fill="#7d6a45">
      <circle cx="-.34" cy=".18" r=".20"/><circle cx=".26" cy="-.30" r=".13"/>
      <circle cx=".10" cy=".42" r=".11"/><circle cx="-.08" cy="-.06" r=".26"/>
      <circle cx=".44" cy=".34" r=".09"/>
    </g>
    <circle cx="0" cy="0" r="1" fill="none" stroke="rgba(255,255,255,.10)" stroke-width=".008"/>`;
}

function miniMoonSVG(k, waxing, size = 17) {
  return `<svg viewBox="-1.15 -1.15 2.3 2.3" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="0" cy="0" r="1" fill="#252a42" stroke="rgba(255,255,255,.22)" stroke-width=".09"/>
    <path d="${moonPath(k, waxing)}" fill="#ece2c8"/></svg>`;
}

/* ---------------------------------- tab icon */
// The thumbnail shows the moon of the day being viewed, built with the same
// `moonPath()` as the big disc. If anything throws, the href is left alone and
// the static last-quarter icon from index.html stays.
const FALLBACK_ICON = (() => {
  const link = document.querySelector('link[rel="icon"]');
  return link ? link.getAttribute('href') : '';
})();

function faviconSVG(k, waxing) {
  return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>"
    + "<circle cx='16' cy='16' r='15' fill='#090a12'/>"
    + "<g transform='translate(16 16) scale(13)'>"
    + "<circle r='1' fill='#252a42'/>"
    + "<path d='" + moonPath(k, waxing) + "' fill='#f0e4c6'/></g>"
    + "<circle cx='16' cy='16' r='14.2' fill='none'"
    + " stroke='#e5c07b' stroke-opacity='.5'/></svg>";
}

function setFavicon(k, waxing) {
  try {
    const link = $('favicon');
    if (!link) return;
    link.href = 'data:image/svg+xml,' + encodeURIComponent(faviconSVG(k, waxing));
  } catch (e) {
    /* keep the fallback: last quarter */
  }
}

/* ---------------------------------- formato (Intl) */
function fmtLong(d) {
  return fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtShort(d) {
  return fmtDate(d, { day: 'numeric', month: 'short' });
}
function fmtTime(d) {
  return fmtDate(d, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ---------------------------------- estado */
const state = {
  date: new Date(),       // fecha seleccionada (local, a medianoche)
  view: new Date()        // mes visible en el calendario
};

const $ = id => document.getElementById(id);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* ---------------------------------- render principal */
function render() {
  const d = state.date;
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const ds = dreamspell(y, m, day);

  const isToday = sameDay(d, new Date());
  const ms = isToday ? Date.now() : new Date(y, m - 1, day, 12, 0, 0).getTime();
  const st = moonState(ms);
  setFavicon(st.illum, st.waxing);

  /* ---------- cabecera ---------- */
  $('headline').textContent =
    `${fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })} · Kin ${ds.kin}`;
  $('datepick').value = `${y}-${pad2(m)}-${pad2(day)}`;

  /* ---------- disco lunar ---------- */
  const phName = phaseName(st.elong);
  $('moonSvg').innerHTML = bigMoonSVG(st.illum, st.waxing);
  $('moonSvg').setAttribute('aria-label', `${fmtLong(d)} — ${phName}`);
  $('phaseName').textContent = phName;
  const cyc = (((st.elong % 360) + 360) % 360) / 360;
  $('phaseAlt').textContent =
    `${st.waxing ? t('waxing') : t('waning')} · ${pct(cyc)} ${t('ofCycle')}`;
  $('illum').textContent = pct(st.illum);
  $('age').textContent = (() => {
    const nowJd = jdFromMs(ms);
    const pn = prevPhase(nowJd, 0);
    return `${nf(pn ? nowJd - pn : st.age, 1)} d`;
  })();

  /* ---------- luna del año ---------- */
  const moon = ds.moon ? moonOf(ds.moon) : null;
  $('nsLabel').textContent = t('nsYear', { n: ds.ns });
  $('moonNo').textContent = ds.isDoot ? '★' : ds.moon;
  $('moonName').textContent = ds.isDoot ? t('dootName') : moon.name;
  $('moonTotem').innerHTML = ds.isDoot
    ? t('dootMotto')
    : `${t('totem')} <em>${moon.totem}</em>`;

  let tags;
  if (ds.isDoot) {
    tags = [t('dootT1'), t('dootT2'), t('dootT3'), t('dootT4')];
  } else {
    const tn13 = toneOf(ds.moon);
    tags = [
      t('moonDay', { m: ds.moon, d: ds.mday }),
      `${t('power')}: ${tn13.power}`,
      `${t('action')}: ${tn13.action}`,
      `${t('essence')}: ${tn13.essence}`
    ];
    if (ds.hunab) tags.unshift(t('hunab'));
  }
  $('tags').innerHTML = tags.map((x, i) => `<span class="tag${i === 0 ? ' hi' : ''}">${x}</span>`).join('');

  if (ds.isDoot) {
    $('dayLabel').textContent = '—';
    $('heptadLabel').textContent = '—';
    $('moonBar').style.width = '0%';
  } else {
    $('dayLabel').textContent = t('dayOf28', { d: ds.mday });
    $('heptadLabel').textContent = t('heptad', { n: ds.heptad, p: L().heptads[ds.heptad - 1] });
    $('moonBar').style.width = `${ds.mday / 28 * 100}%`;
  }

  const doyEff = ds.isDoot ? 365 : ds.doy;
  $('yearPct').textContent = t('yearPct', { p: pct(doyEff / 365), d: doyEff });
  $('yearBar').style.width = `${doyEff / 365 * 100}%`;

  /* ---------- kin ---------- */
  const seal = sealOf(ds.seal);
  const tn = toneOf(ds.tone);
  $('glyph').innerHTML = sealGlyph(ds.seal, seal.color);
  $('kinNo').textContent = ds.kin;
  $('kinName').textContent = sigName(ds.seal, ds.tone);
  $('kinEn').textContent =
    `${colorName(seal.color)} · ${t('seal')} ${ds.seal}/20 · ${t('tone')} ${ds.tone}/13`;

  const rows = [
    [t('seal'), seal.name],
    [t('tone'), `${ds.tone} · ${tn.name}`],
    [t('powerAction'), `${seal.power} · ${seal.action}`],
    [t('essence'), seal.essence],
    [t('wavespell'), `${ds.wpos}/13 · ${sealOf(ds.wavespell).name}`],
    [t('castle'), ds.castle],
    [t('guide'), `${sigName(ds.guide.seal, ds.guide.tone)} · Kin ${ds.guide.kin}`]
  ];
  $('kinRows').innerHTML = rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('');
  $('kinPos').textContent = `${ds.kin}/260`;
  renderTzolkin(ds.kin);

  /* ---------- zodíaco ---------- */
  const signIdx = Math.floor(st.lon / 30);
  const inSign = st.lon - signIdx * 30;
  const deg = Math.floor(inSign);
  const min = Math.floor((inSign - deg) * 60);
  const sign = L().signs[signIdx];
  $('signName').textContent = `${SIGN_GLYPHS[signIdx]}  ${t('moonIn', { sign })}`;
  $('signDeg').textContent = `${deg}° ${pad2(min)}′ · ${sign}`;
  const constel = constelOf(st.lon);
  $('constName').innerHTML = `${t('realConst', { c: constel })}<br>
    <span style="opacity:.65">${t('eclLon', { x: nf(st.lon, 2) })}</span>`;
  $('zodiacNote').innerHTML = t('zodiacNote');
  renderWheel(st.lon, signIdx);

  /* ---------- próximas fases ---------- */
  const fromJd = jdFromMs(Date.now());
  const list = PHASE_TARGETS.map(p => ({ ...p, jd: nextPhase(fromJd, p.t) }))
    .filter(p => p.jd)
    .sort((a, b) => a.jd - b.jd);
  $('phaseList').innerHTML = list.map(p => {
    const dt = new Date(msFromJd(p.jd));
    const inDays = p.jd - fromJd;
    const dot = p.key === 'llena' ? '#f4e8c8' : p.key === 'nueva' ? '#5a5f7d' : 'var(--gold)';
    return `<div class="pitem">
      <span class="pn"><i style="background:${dot}"></i>${L().phases8[p.idx]}</span>
      <b>${fmtShort(dt)} · ${fmtTime(dt)} <span style="opacity:.45;font-size:11px">${inDays < 1 ? t('todayW') : t('plusDays', { n: Math.round(inDays) })}</span></b>
    </div>`;
  }).join('');
  $('synodicNote').innerHTML = t('synodicNote', { n: nf(29.530588853, 2) });

  /* ---------- calendario gregoriano ---------- */
  renderCalendar();

  /* ---------- año de 13 lunas ---------- */
  const startYear = (m > 7 || (m === 7 && day >= 26)) ? y : y - 1;
  $('yearTitle').textContent = t('yearTitle', { a: startYear, b: startYear + 1 });
  const bearer = dreamspell(startYear, 7, 26);
  $('yearBearer').innerHTML = t('bearer', {
    sig: `<span style="color:var(--gold)">${sigName(bearer.seal, bearer.tone)}</span>`,
    n: ds.ns
  });
  renderYearStrip(ds);
  renderGregTrack(ds, startYear);
}

function constelOf(lon) {
  const L0 = ((lon % 360) + 360) % 360;
  const names = L().constellations;
  for (let i = 0; i < CONST_LIMITS.length; i++) {
    const a = CONST_LIMITS[i];
    const b = i + 1 < CONST_LIMITS.length ? CONST_LIMITS[i + 1] : CONST_LIMITS[0];
    if (a < b ? (L0 >= a && L0 < b) : (L0 >= a || L0 < b)) return names[i];
  }
  return names[0];
}

/* ---------------------------------- tzolkin */
function renderTzolkin(now) {
  const el = $('tzolkin');
  if (el.childElementCount !== 260) {
    let html = '';
    for (let c = 0; c < 13; c++)
      for (let r = 0; r < 20; r++) {
        const kin = c * 20 + r + 1;
        html += `<div data-k="${kin}" style="background:${COLOR_HEX[sealColor(kin)]}22"></div>`;
      }
    el.innerHTML = html;
  }
  [...el.children].forEach(c => c.classList.toggle('now', +c.dataset.k === now));
}

/* ---------------------------------- rueda zodiacal */
function renderWheel(lon, signIdx) {
  const cx = 100, cy = 100, R = 82;
  const pt = (lambda, r) => {
    const th = (90 - lambda) * RAD;
    return [cx + r * Math.cos(th), cy - r * Math.sin(th)];
  };
  let s = '';
  for (let i = 0; i < 12; i++) {
    const a = i * 30, b = a + 30;
    const [x1, y1] = pt(a, R), [x2, y2] = pt(b, R);
    const active = i === signIdx;
    s += `<path d="M${cx} ${cy}L${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)}Z"
      fill="${active ? 'rgba(229,192,123,.22)' : (i % 2 ? 'rgba(255,255,255,.028)' : 'rgba(255,255,255,.055)')}"
      stroke="rgba(255,255,255,.07)" stroke-width=".8"/>`;
    const [gx, gy] = pt(a + 15, R - 13);
    s += `<text x="${gx.toFixed(1)}" y="${(gy + 4).toFixed(1)}" text-anchor="middle"
      font-size="12" fill="${active ? '#e5c07b' : 'rgba(255,255,255,.42)'}"
      font-family="Georgia,serif">${SIGN_GLYPHS[i]}</text>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R + 7}" fill="none" stroke="rgba(229,192,123,.22)" stroke-width="1" stroke-dasharray="1 4"/>`;
  const [mx, my] = pt(lon, R);
  s += `<line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="rgba(229,192,123,.35)" stroke-width="1" stroke-dasharray="2 3"/>`;
  s += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="6.5" fill="#0a0b14" stroke="#e5c07b" stroke-width="1.6"/>`;
  s += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="3.1" fill="#f3e9d2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="3" fill="rgba(229,192,123,.9)"/>`;
  $('wheel').innerHTML = s;
}

/* ---------------------------------- calendario del mes */
function renderCalendar() {
  const v = state.view;
  const vy = v.getFullYear(), vm = v.getMonth();
  $('calTitle').textContent = cap(fmtDate(new Date(vy, vm, 1), { month: 'long', year: 'numeric' }));

  // cabecera de días, lunes primero (1 ene 2024 fue lunes)
  let dow = '';
  for (let i = 0; i < 7; i++) {
    dow += `<span>${fmtDate(new Date(2024, 0, 1 + i), { weekday: 'short' }).replace(/\.$/, '')}</span>`;
  }
  $('dow').innerHTML = dow;

  const first = new Date(vy, vm, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const today = new Date();
  let html = '';
  for (let i = 0; i < startPad; i++) html += `<div class="day pad"></div>`;

  for (let dnum = 1; dnum <= daysInMonth; dnum++) {
    const dateObj = new Date(vy, vm, dnum);
    const ds = dreamspell(vy, vm + 1, dnum);
    const st = moonState(new Date(vy, vm, dnum, 12, 0, 0).getTime());
    const seal = sealOf(ds.seal);
    const isToday = sameDay(dateObj, today);
    const isSel = sameDay(dateObj, state.date);
    const cls = ['day'];
    if (isToday) cls.push('today');
    if (isSel) cls.push('sel');
    if (ds.isDoot) cls.push('doot');
    const label = ds.isDoot
      ? t('dootTitle', { k: ds.kin })
      : t('dayTitle', { m: ds.moon, d: ds.mday, k: ds.kin, sig: sigName(ds.seal, ds.tone) });
    html += `<div class="${cls.join(' ')}" data-d="${dnum}" title="${label}">
      ${ds.isDoot ? `<span class="badge">${t('dootBadge')}</span>` : ''}
      ${ds.hunab ? '<span class="badge">0.0</span>' : ''}
      <span class="gn">${dnum}</span>
      <span class="d13">${ds.isDoot ? t('dootShort') : `${ds.moon}.${ds.mday}`}</span>
      <span class="mini">
        ${miniMoonSVG(st.illum, st.waxing, 17)}
        <span class="dot" style="background:${COLOR_HEX[seal.color]}"></span>
      </span>
    </div>`;
  }
  $('days').innerHTML = html;
  [...$('days').querySelectorAll('.day[data-d]')].forEach(el => {
    el.addEventListener('click', () => {
      state.date = new Date(vy, vm, +el.dataset.d);
      state.view = new Date(state.date);
      render();
    });
  });
}

/* ---------------------------------- tira del año */
function renderYearStrip(ds) {
  let html = '';
  for (let i = 0; i < 13; i++) {
    const mo = moonOf(i + 1);
    const cur = i + 1 === ds.moon;
    // la misma raya que en la fila gregoriana, dentro de la luna:
    // (día de la luna − ½) / 28. En el día fuera del tiempo no hay luna,
    // así que tampoco hay raya en ninguna de las dos escalas.
    const mark = cur
      ? `<span class="ymark" style="left:${((ds.mday - 0.5) / 28 * 100).toFixed(2)}%"></span>`
      : '';
    html += `<div class="ycell${cur ? ' cur' : ''}" title="${mo.name} — ${mo.totem}">
      ${mark}<span class="k">${i + 1}</span>
      <span class="s">${mo.short}</span>
    </div>`;
  }
  $('yearStrip').innerHTML = html;
  const short = x => fmtDate(new Date(2000, 6, x), { day: 'numeric', month: 'short' });
  $('stripStart').textContent = short(26);
  const fin = $('stripEnd');
  fin.textContent = `${t('dootName')} · ${short(25)}`;
  fin.title = t('dootOpenHint');
  fin.onclick = () => {
    const dd = $('dootDetails');
    dd.open = true;
    dd.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
}

/* ------ franja gregoriana paralela: los mismos 364 días, mes a mes ------ */
// La tira de arriba son 13 bloques iguales de 28 días; esta es la misma
// extensión de tiempo repartida por meses del calendario civil. Los dos
// ejes son proporcionales al día, así que se pueden leer en vertical:
// la luna 5 empieza el 22 de octubre y la franja dice octubre → noviembre.
const YEAR_SPAN = 364;                      // 13 × 28: 26 jul → 24 jul
function renderGregTrack(ds, startYear) {
  const dayAt = i => new Date(startYear, 6, 26 + i);   // 26 de julio + i días
  const date = state.date;
  const segs = [];
  for (let i = 0; i < YEAR_SPAN;) {
    const mo = dayAt(i).getMonth();
    let n = 1;
    while (i + n < YEAR_SPAN && dayAt(i + n).getMonth() === mo) n++;
    segs.push({ i, n: n, d: dayAt(i) });
    i += n;
  }
  // las mismas 13 columnas que la fila de las lunas, pero repartidas por días
  // de cada mes: las dos suman 364, así que los dos ejes son comparables
  $('gregTrack').style.gridTemplateColumns =
    segs.map(s => `${s.n}fr`).join(' ');
  let html = '';
  for (const s of segs) {
    const cur = date >= dayAt(s.i) && date < dayAt(s.i + s.n);
    // la raya del día, igual que en la fila de las lunas: (día del año − ½) / 364.
    // Con las celdas pegadas (sin hueco) cae exactamente en la misma x que la
    // raya de la luna, y las dos se pueden leer en vertical.
    const mark = cur
      ? `<span class="ymark" style="left:${((ds.doy - s.i - 0.5) / s.n * 100).toFixed(2)}%"`
        + ` title="${fmtLong(date)}"></span>`
      : '';
    html += `<div class="ycell${cur ? ' cur' : ''}"`
         + ` title="${fmtDate(s.d, { month: 'long', year: 'numeric' })}">`
         + `${mark}<span class="k" data-narrow="${fmtDate(s.d, { month: 'narrow' })}">`
         + `${fmtDate(s.d, { month: 'short' })}</span>`
         + `<span class="s">${t('daysAbbr', { n: s.n })}</span></div>`;
  }
  $('gregTrack').innerHTML = html;
  // igual que la segunda línea de la luna: si no cabe, se acorta a la inicial;
  // si tampoco cabe (el tramo de julio son 6 días), se oculta entera
  [...$('gregTrack').querySelectorAll('.ycell .k')].forEach(lab => {
    const cell = lab.parentElement;
    if (lab.scrollWidth > cell.clientWidth - 2) lab.textContent = lab.dataset.narrow;
    if (lab.scrollWidth > cell.clientWidth - 1) lab.style.visibility = 'hidden';
  });
  $('gregCap').textContent = t('gregTrack', { a: startYear, b: startYear + 1 });
  $('gregNow').textContent = fmtDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---------------------------------- navegación */
function shiftDays(n) {
  state.date = new Date(state.date.getFullYear(), state.date.getMonth(), state.date.getDate() + n);
  state.view = new Date(state.date.getFullYear(), state.date.getMonth(), 1);
  render();
}
function shiftMonth(n) {
  state.view = new Date(state.view.getFullYear(), state.view.getMonth() + n, 1);
  renderCalendar();
}

$('prev').onclick = () => shiftDays(-1);
$('next').onclick = () => shiftDays(1);
$('today').onclick = () => {
  state.date = new Date();
  state.view = new Date();
  render();
};
$('prevMonth').onclick = () => shiftMonth(-1);
$('nextMonth').onclick = () => shiftMonth(1);
$('datepick').onchange = e => {
  const [y, m, d] = e.target.value.split('-').map(Number);
  if (!y || !m || !d) return;
  state.date = new Date(y, m - 1, d);
  state.view = new Date(y, m - 1, 1);
  render();
};
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowLeft') { shiftDays(-1); e.preventDefault(); }
  if (e.key === 'ArrowRight') { shiftDays(1); e.preventDefault(); }
  if (e.key.toLowerCase() === 't') { $('today').click(); }
});

/* ---------------------------------- estrellas */
(function stars() {
  const box = $('stars');
  const n = window.innerWidth < 700 ? 60 : 130;
  let html = '';
  for (let i = 0; i < n; i++) {
    const s = (Math.random() * 1.9 + 0.5).toFixed(2);
    html += `<span class="star" style="left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;
      width:${s}px;height:${s}px;--d:${(Math.random() * 5 + 2.5).toFixed(1)}s;
      animation-delay:${(Math.random() * 5).toFixed(1)}s;opacity:.5"></span>`;
  }
  box.innerHTML = html;
})();

/* ---------------------------------- arranque */
LANG = detectLang();
state.date = new Date();
state.view = new Date();

// enlace directo: index.html?d=2026-11-20&lang=de
const qd = new URLSearchParams(location.search).get('d');
if (qd && /^\d{4}-\d{2}-\d{2}$/.test(qd)) {
  const [qy, qm, qdd] = qd.split('-').map(Number);
  state.date = new Date(qy, qm - 1, qdd);
  state.view = new Date(qy, qm - 1, 1);
}

applyStaticText();
setLang(LANG);
buildLangSwitch();

// banco de pruebas: index.html?selftest=1
if (new URLSearchParams(location.search).has('selftest')) {
  const cases = [
    ['1987-07-26', 34, 1, 1],   // ancla: Kin 34, Luna Magnética 1.1
    ['2026-11-20', 86, 5, 6],   // ancla: Kin 86, Luna Entonada 5.6
    ['2028-02-29', 31, 8, 22],  // ancla: mismo día que el 28
    ['2028-02-28', 31, 8, 22],
    ['2012-12-21', 207, 6, 9],  // Kin 207, Mano Cristal Azul
    ['2026-07-25', 228, 0, 0]   // día fuera del tiempo (kin continuo, un día antes del portador 229)
  ];
  let out = `lang=${LANG}  (${fmtLong(new Date(2026, 10, 20))})\n`;
  for (const [iso, k, mo, dy] of cases) {
    const [y, m, dd] = iso.split('-').map(Number);
    const r = dreamspell(y, m, dd);
    const ok = r.kin === k && r.moon === mo && r.mday === dy ? 'OK ' : 'FAIL';
    out += `${ok} ${iso}  kin ${r.kin} (want ${k})  luna ${r.moon}.${r.mday} (want ${mo}.${dy})  NS${r.ns}  doot=${r.isDoot}  ${sigName(r.seal, r.tone)}\n`;
  }
  const jd = jdFromMs(Date.parse('2026-11-24T14:53:00Z'));
  out += `\nUSNO llena 2026-11-24 14:53Z -> elong=${elongation(jd).toFixed(3)} (want 180)\n`;
  out += `edad lunar 2026-11-20 -> ${moonState(Date.parse('2026-11-20T12:00:00Z')).age.toFixed(2)} d\n`;
  out += `lon lunar 2026-11-20 12Z -> ${moonState(Date.parse('2026-11-20T12:00:00Z')).lon.toFixed(3)} (python 3.389)\n`;
  out += `constelacion 3.39 -> ${constelOf(3.39)} | 250 -> ${constelOf(250)} | 355 -> ${constelOf(355)}\n`;
  out += `fases: ${L().phases8.join(' / ')}\n`;
  out += `mes: ${fmtDate(new Date(2026, 10, 1), { month: 'long', year: 'numeric' })} | dow: ${fmtDate(new Date(2024, 0, 1), { weekday: 'short' })}\n`;
  const el = document.createElement('pre');
  el.id = 'selftest';
  el.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#000;color:#0f0;font:12px monospace;padding:8px;white-space:pre';
  el.textContent = out;
  document.body.appendChild(el);
  console.log(out);
}

// verificación de maquetación: index.html?barcode=layout
if (new URLSearchParams(location.search).get('barcode') === 'layout') {
  const R = id => document.getElementById(id).getBoundingClientRect();
  const days = [...document.querySelectorAll('#days .day[data-d]')].map(e => e.getBoundingClientRect());
  const rows = {};
  days.forEach(r => { const k = Math.round(r.top); rows[k] = (rows[k] || 0) + 1; });
  const inRow = Math.max.apply(null, Object.values(rows).concat([0]));
  const cards = [...document.querySelectorAll('.grid3 > .card')].map(e => e.getBoundingClientRect());
  const hero = [...document.querySelectorAll('.hero > .card')].map(e => e.getBoundingClientRect());
  const overflows = [...document.querySelectorAll('.card, .day, .grid3, .hero')]
    .filter(e => e.scrollWidth > e.clientWidth + 2).length;
  const vals = [
    Math.round(window.innerWidth),
    Math.round(document.documentElement.scrollWidth),
    Math.round(document.documentElement.scrollHeight),
    Math.round(hero[0].width),
    Math.round(hero[1].width),
    Math.round(hero[1].left),
    Math.round(cards[0].width),
    Math.round(cards[2].left + cards[2].width),
    inRow,
    document.querySelectorAll('#yearStrip .ycell').length,
    document.querySelectorAll('#tzolkin div').length,
    Math.round(R('moonSvg').width),
    Math.round(R('wheel').width),
    Math.round(R('calCard').width),
    document.querySelectorAll('.day.today').length,
    overflows,
    document.querySelectorAll('#gregTrack .ycell').length,
    Math.round([...document.querySelectorAll('#gregTrack .ycell')]
      .reduce((a, e) => a + e.getBoundingClientRect().width, 0) / R('gregTrack').width * 100),
    document.querySelectorAll('#gregTrack .ymark').length,
    document.querySelectorAll('#gregTrack .ycell.cur').length,
    [...document.querySelectorAll('#gregTrack .ycell .k')]
      .filter(e => e.scrollWidth > e.clientWidth + 1).length,
    Math.round(R('gregTrack').left),
    Math.round(R('gregTrack').width),
    document.querySelectorAll('#yearStrip .ymark').length,
    (() => {
      const m = document.querySelector('#yearStrip .ymark');
      if (!m) return 0;
      const c = m.parentElement.getBoundingClientRect(), r = m.getBoundingClientRect();
      return Math.round((r.left + r.width / 2 - c.left) / c.width * 100);
    })(),
    // las dos rayas, en la misma x: si esto deja de dar 0–1 px, las dos
    // escalas han dejado de ser comparables en vertical
    (() => {
      const a = document.querySelector('#yearStrip .ymark');
      const b = document.querySelector('#gregTrack .ymark');
      if (!a || !b) return 999;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return Math.round(Math.abs((ra.left + ra.width / 2) - (rb.left + rb.width / 2)));
    })()
  ];
  const bits = 14, cw = 16;
  const c = document.createElement('canvas');
  c.width = bits * cw; c.height = vals.length * cw;
  c.style.cssText = 'position:fixed;left:0;top:0;margin:0;display:block;z-index:99';
  c.id = 'bar';
  document.body.appendChild(c);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#000';
  vals.forEach((v, i) => {
    for (let b = 0; b < bits; b++) if ((v >> b) & 1) g.fillRect(b * cw, i * cw, cw, cw);
  });
}

// volcado de geometría para revisar a ojo o desde scripts: index.html?rects=1
if (new URLSearchParams(location.search).has('rects')) {
  const ids = ['yearCard', 'yearStrip', 'stripStart', 'gregTrack', 'gregCap',
               'gregNow', 'calCard', 'days'];
  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    console.log(`rect ${id} ${Math.round(r.left)} ${Math.round(r.top)} ${Math.round(r.width)} ${Math.round(r.height)}`);
  });
  [...document.querySelectorAll('#gregTrack .ycell')].forEach((el, i) => {
    const r = el.getBoundingClientRect();
    console.log(`rect gcell${i} ${Math.round(r.left)} ${Math.round(r.top)} ${Math.round(r.width)} ${Math.round(r.height)}`);
    const lab = el.querySelector('.k');
    const oculta = lab.style.visibility === 'hidden';
    console.log(`label gcell${i} "${lab.textContent}"`
      + ` ${oculta ? 'oculta' : (lab.scrollWidth > el.clientWidth ? 'recortada' : 'entera')}`
      + ` ${Math.round(lab.scrollWidth)}/${el.clientWidth}`);
  });
  [...document.querySelectorAll('#yearStrip .ycell')].forEach((el, i) => {
    const r = el.getBoundingClientRect();
    console.log(`rect ycell${i} ${Math.round(r.left)} ${Math.round(r.top)} ${Math.round(r.width)} ${Math.round(r.height)}`);
  });
  // las dos rayas con su celda, para poder comparar las dos escalas
  [['ymark', '#yearStrip'], ['gmark', '#gregTrack']].forEach(([name, sel]) => {
    const m = document.querySelector(sel + ' .ymark');
    if (!m) return;
    const r = m.getBoundingClientRect(), c = m.parentElement.getBoundingClientRect();
    console.log(`rect ${name} ${Math.round(r.left)} ${Math.round(r.top)} ${Math.round(r.width)} ${Math.round(r.height)}`
      + ` cell ${Math.round(c.left)} ${Math.round(c.width)}`);
  });
}

// the thumbnail at 240x240 on white, so it can be counted in pixels: index.html?thumb=1
if (new URLSearchParams(location.search).has('thumb')) {
  const modo = new URLSearchParams(location.search).get('thumb');
  const src = modo === 'fallback' ? FALLBACK_ICON
    : document.querySelector('link[rel="icon"]').getAttribute('href');
  const svg = decodeURIComponent(src.replace('data:image/svg+xml,', ''))
    .replace('<svg ', "<svg width='240' height='240' ");
  const st = moonState(state.date.getTime());
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;padding:0;background:#fff;width:240px;height:240px';
  document.body.innerHTML = svg;
  console.log(`thumb modo=${modo} k=${st.illum.toFixed(4)} waxing=${st.waxing ? 1 : 0}`);
}

// the day-out-of-time disclosure, opened and measured: index.html?doot=1
if (new URLSearchParams(location.search).has('doot')) {
  const dd = $('dootDetails');
  const cerrado = dd.getBoundingClientRect().height;
  dd.open = true;
  const r = dd.getBoundingClientRect();
  const sm = dd.querySelector('summary').getBoundingClientRect();
  console.log(`doot cerrado=${Math.round(cerrado)} summary=${Math.round(sm.height)}`
    + `x${Math.round(sm.width)}`);
  const enlaces = [...dd.querySelectorAll('a')];
  const desbordes = [...dd.querySelectorAll('*')]
    .filter(e => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2).length;
  console.log(`doot open=${dd.open} y=${Math.round(r.top)} h=${Math.round(r.height)}`
    + ` w=${Math.round(r.width)} p=${dd.querySelectorAll('p').length} a=${enlaces.length}`);
  console.log(`doot desbordes=${desbordes} scrollW=${document.documentElement.scrollWidth}`
    + ` innerW=${window.innerWidth}`);
  enlaces.forEach(a => console.log('doot link ' + a.getAttribute('href')
    + ' rel=' + a.getAttribute('rel') + ' target=' + a.getAttribute('target')));
  console.log('doot texto: ' + dd.textContent.replace(/\s+/g, ' ').trim());
}

// volcado de texto para revisar la traducción: index.html?dump=1&lang=de
if (new URLSearchParams(location.search).has('dump')) {
  console.log('LANG=' + LANG + ' html-lang=' + document.documentElement.lang);
  console.log('SWITCH=' + document.getElementById('langSw').textContent.trim());
  console.log(document.querySelector('.wrap').innerText);
}
if (new URLSearchParams(location.search).get('barcode') === '1') {
  const vals = [
    dreamspell(1987, 7, 26).kin,        // 34
    dreamspell(2026, 11, 20).kin,       // 86
    dreamspell(2028, 2, 29).kin,        // 31
    dreamspell(2028, 2, 28).kin,        // 31
    dreamspell(2012, 12, 21).kin,       // 207
    dreamspell(2026, 7, 25).moon,       // 0  (día fuera del tiempo)
    dreamspell(2026, 11, 20).moon,      // 5
    dreamspell(2026, 11, 20).mday,      // 6
    dreamspell(2028, 2, 29).mday,       // 22
    dreamspell(2026, 7, 26).kin,        // 229 (portador del año)
    Math.round(moonState(Date.parse('2026-11-20T12:00:00Z')).lon * 1000),   // 3389
    Math.round(elongation(jdFromMs(Date.parse('2026-11-24T14:53:00Z')))),   // 180
    L().constellations.indexOf(constelOf(3.39)),                            // 12 (Piscis)
    document.querySelectorAll('#days .day[data-d]').length                  // 30
  ];
  const bits = 12, cw = 20;
  const c = document.createElement('canvas');
  c.width = bits * cw; c.height = vals.length * cw;
  c.style.cssText = 'position:fixed;left:0;top:0;margin:0;display:block';
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;padding:0;background:#fff;overflow:hidden';
  document.body.appendChild(c);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#000';
  vals.forEach((v, i) => {
    for (let b = 0; b < bits; b++) if ((v >> b) & 1) g.fillRect(b * cw, i * cw, cw, cw);
  });
}