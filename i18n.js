/* ============================================================
   i18n.js — four languages: es · pt-BR · en · de
   Month and day names are NOT here: they come from
   Intl.DateTimeFormat so each language keeps its own order
   and declension.
   ============================================================ */
'use strict';

const LOCALES = { es: 'es-ES', pt: 'pt-BR', en: 'en-GB', de: 'de-DE' };

const LANGS = [
  { code: 'es', tag: 'ES', name: 'Español' },
  { code: 'pt', tag: 'PT', name: 'Português (BR)' },
  { code: 'en', tag: 'EN', name: 'English' },
  { code: 'de', tag: 'DE', name: 'Deutsch' }
];

// The four Dreamspell colours, in cyclic order per seal.
const SEAL_COLORS = ['rojo', 'blanco', 'azul', 'amarillo'];

const I18N = {

  /* ============================== SPANISH ============================== */
  es: {
    sigOrder: 'stc',
    // m/f of each seal: decides whether the adjective ends in -o or -a
    gender: ['m','m','f','f','f','m','f','f','f','m','m','m','m','m','f','m','f','m','f','m'],
    colors: { rojo: 'Rojo', blanco: 'Blanco', azul: 'Azul', amarillo: 'Amarillo' },
    ui: {
      title: 'Sincronario de las 13 Lunas — Calendario lunar',
      desc: 'Calendario lunar interactivo: fase de la luna, luna del año en el Sincronario de 13 Lunas, kin del Tzolkin, constelación zodiacal y referencia gregoriana.',
      brand: 'Sincronario de las 13 Lunas',
      brandSub: '13\u00a0luas · 28\u00a0días · Tzolkin',
      prevDay: 'Día anterior', nextDay: 'Día siguiente', today: 'Hoy',
      pickDate: 'Elegir fecha', langAria: 'Idioma',
      moonAria: 'Fase lunar', wheelAria: 'Rueda zodiacal',
      illum: 'Iluminación', age: 'Edad lunar',
      waxing: 'creciente', waning: 'menguante', ofCycle: 'del ciclo',
      moonYear: 'Luna del año', nsYear: 'año NS{n}', of13: 'de 13 lunas',
      totem: 'Tótem',
      dootName: 'Día fuera del tiempo',
      dootMotto: 'Un día para la paz, el arte y el perdón universal',
      dootT1: 'Fuera de las 13 lunas', dootT2: '25 de julio',
      dootT3: 'Paz a través de la cultura', dootT4: 'Perdón universal',
      moonDay: 'Luna {m} · día {d}',
      power: 'Poder', action: 'Acción', essence: 'Esencia',
      hunab: '0.0 Hunab Ku · 29 de febrero',
      dayOf28: 'Día {d} de 28', heptad: 'Heptada {n} · {p}',
      yearMeter: 'Año de 13 lunas', yearPct: '{p} · día {d}',
      gregTrack: 'Calendario gregoriano · {a}–{b}', daysAbbr: '{n}\u00a0d',
      dootOpenHint: 'Ver qué es el día fuera del tiempo',
      dootSum: 'Día fuera del tiempo · 25 de julio',
      dootX1: 'Las 13 lunas suman <b>364 días</b> (13 × 28). El año gregoriano tiene 365, así que sobra uno: el <b>25 de julio</b>. Ese día no pertenece a ninguna luna, a ninguna heptada ni a ningún kin — el Tzolkin no avanza, y el año siguiente empieza el 26 de julio.',
      dootX2: 'Se celebra como un día al margen de la cuenta: «el tiempo es arte» y, desde 1992, la Fundación para la Ley del Tiempo lo llama también <b>Día Internacional de la Paz a través de la Cultura</b>. El otro día intercalar es el 29 de febrero (<b>0.0 Hunab Ku</b>), que tampoco cuenta.',
      dootX3: 'Conviene saber de dónde sale: es el <b>Dreamspell</b> que formularon José y Lloydine Argüelles en 1987, una relectura moderna inspirada en el calendario maya. No es la cuenta larga maya clásica ni el Haab, y en las fuentes mayas no hay un «día fuera del tiempo» con esta estructura.',
      dootSrc: '<em>Fuentes</em> <a href="https://www.lawoftime.org/thirteenmoon/doot.html" target="_blank" rel="noopener">Día Fuera del Tiempo — Fundación para la Ley del Tiempo</a> · <a href="https://www.lawoftime.org/thirteenmoon/tutorial.html" target="_blank" rel="noopener">Tutorial del calendario de 13 lunas</a> · <a href="https://en.wikipedia.org/wiki/Dreamspell" target="_blank" rel="noopener">Dreamspell (Wikipedia, en inglés)</a> · <a href="https://es.wikipedia.org/wiki/Calendario_maya" target="_blank" rel="noopener">Calendario maya (Wikipedia)</a>',
      kinEyebrow: 'Firma galáctica · Kin',
      seal: 'Sello', tone: 'Tono', powerAction: 'Poder · Acción',
      wavespell: 'Onda encantada', castle: 'Castillo', guide: 'Guía',
      harmonic: 'Módulo armónico 13:20',
      zodiacEyebrow: 'Zodíaco · posición lunar',
      moonIn: 'Luna en {sign}', realConst: 'Constelación real: <b>{c}</b>',
      eclLon: 'longitud eclíptica {x}°',
      zodiacNote: 'El signo tropical divide la eclíptica en 12 sectores de 30° desde el equinoccio; la constelación real (límites IAU) está desplazada ≈ 24° por la precesión, por eso la Luna puede estar en <b>Ofiuco</b> sin que exista un “signo” con ese nombre.',
      phasesEyebrow: 'Ciclo sinódico · próximas fases',
      todayW: 'hoy', plusDays: '+{n} d',
      synodicNote: 'Ciclo sinódico medio <b>{n} días</b> · la Luna de 28 días del Sincronario es el promedio entre el ciclo sinódico y el sideral (27,32 d).',
      calGreg: 'Gregoriano ↔ 13\u00a0lunas',
      prevMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
      dayTitle: 'Luna {m}.{d} · Kin {k} · {sig}',
      dootTitle: 'Día fuera del tiempo · Kin {k}',
      dootBadge: 'DFT', dootShort: 'fuera del tiempo',
      yearTitle: 'Año de 13 lunas {a} – {b}',
      bearer: 'Portador: <b>{sig}</b> · NS{n}',
      footP: 'Las fases y la posición lunar se calculan en el navegador con las series de Meeus (precisión ≈ ±2\u00a0min en las fases, ±0.01° en la longitud eclíptica). El Sincronario de 13 Lunas sigue el Dreamspell de José y Lloydine Argüelles: año de 364\u00a0días + Día Fuera del Tiempo, contado desde el 26 de julio; el 29 de febrero comparte fecha con el 28 y no avanza el kin.',
      footSum: 'Cómo se calcula cada dato',
      footD1: '<b>Luna del año:</b> días transcurridos desde el 26 de julio, en bloques de 28 (13 lunas).',
      footD2: '<b>Kin:</b> cuenta de 260 días desde el 26 de julio de 1987 (Kin\u00a034, Luna Magnética 1.1), omitiendo los 29 de febrero.',
      footD3: '<b>Fase:</b> elongación geocéntrica Luna–Sol; la fracción iluminada es (1−cos\u00a0ψ)/2.',
      footD4: '<b>Signo:</b> sector tropical de 30° desde el equinoccio de marzo. <b>Constelación:</b> sector real de la eclíptica según los límites IAU (por eso existe Ofiuco).',
      footNote: 'Hecho para observar el cielo, no para sustituir el calendario civil.'
    },
    seals: [
      ['Dragón', 'Nacimiento', 'Nutrir', 'Ser'],
      ['Viento', 'Espíritu', 'Comunicar', 'Aliento'],
      ['Noche', 'Abundancia', 'Soñar', 'Intuición'],
      ['Semilla', 'Florecimiento', 'Atinar', 'Conciencia'],
      ['Serpiente', 'Fuerza Vital', 'Sobrevivir', 'Instinto'],
      ['Enlazador de Mundos', 'Muerte', 'Igualar', 'Oportunidad'],
      ['Mano', 'Realización', 'Conocer', 'Curación'],
      ['Estrella', 'Elegancia', 'Embellecer', 'Arte'],
      ['Luna', 'Agua Universal', 'Purificar', 'Flujo'],
      ['Perro', 'Corazón', 'Amar', 'Lealtad'],
      ['Mono', 'Magia', 'Jugar', 'Ilusión'],
      ['Humano', 'Libre Albedrío', 'Influenciar', 'Sabiduría'],
      ['Caminante del Cielo', 'Espacio', 'Explorar', 'Vigilia'],
      ['Mago', 'Atemporalidad', 'Encantar', 'Receptividad'],
      ['Águila', 'Visión', 'Crear', 'Mente'],
      ['Guerrero', 'Inteligencia', 'Cuestionar', 'Intrepidez'],
      ['Tierra', 'Navegación', 'Evolucionar', 'Sincronicidad'],
      ['Espejo', 'Sinfín', 'Reflejar', 'Orden'],
      ['Tormenta', 'Autogeneración', 'Catalizar', 'Energía'],
      ['Sol', 'Fuego Universal', 'Iluminar', 'Vida']
    ],
    tones: [
      ['Magnético', 'Unificar', 'Atraer', 'Propósito'],
      ['Lunar', 'Polarizar', 'Estabilizar', 'Desafío'],
      ['Eléctrico', 'Activar', 'Vincular', 'Servicio'],
      ['Autoexistente', 'Definir', 'Medir', 'Forma'],
      ['Entonado', 'Empoderar', 'Comandar', 'Resplandor'],
      ['Rítmico', 'Organizar', 'Equilibrar', 'Igualdad'],
      ['Resonante', 'Canalizar', 'Inspirar', 'Sintonización'],
      ['Galáctico', 'Armonizar', 'Modelar', 'Integridad'],
      ['Solar', 'Pulsar', 'Realizar', 'Intención'],
      ['Planetario', 'Perfeccionar', 'Producir', 'Manifestación'],
      ['Espectral', 'Disolver', 'Liberar', 'Liberación'],
      ['Cristal', 'Dedicar', 'Universalizar', 'Cooperación'],
      ['Cósmico', 'Perdurar', 'Trascender', 'Presencia']
    ],
    moons: [
      ['Luna Magnética', 'Magn', 'Murciélago'],
      ['Luna Lunar', 'Lunar', 'Escorpión'],
      ['Luna Eléctrica', 'Eléc', 'Ciervo'],
      ['Luna Autoexistente', 'Auto', 'Búho'],
      ['Luna Entonada', 'Ento', 'Pavo real'],
      ['Luna Rítmica', 'Rítm', 'Lagartija'],
      ['Luna Resonante', 'Reso', 'Mono'],
      ['Luna Galáctica', 'Galá', 'Halcón'],
      ['Luna Solar', 'Solar', 'Jaguar'],
      ['Luna Planetaria', 'Plan', 'Perro'],
      ['Luna Espectral', 'Espe', 'Serpiente'],
      ['Luna Cristal', 'Cris', 'Conejo'],
      ['Luna Cósmica', 'Cósm', 'Tortuga']
    ],
    heptads: [
      'El conocimiento inicia la visión',
      'La humildad refina la meditación',
      'La paciencia transforma la conducta',
      'El poder madura el fruto'
    ],
    castles: [
      'Castillo Rojo Oriental del Giro',
      'Castillo Blanco Septentrional del Cruce',
      'Castillo Azul Occidental del Quemar',
      'Castillo Amarillo Meridional del Dar',
      'Castillo Verde Central del Encantar'
    ],
    signs: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo',
      'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
    constellations: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo',
      'Libra', 'Escorpio', 'Ofiuco', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
    phases8: ['Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente',
      'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante']
  },

  /* ========================= PORTUGUESE (BR) ========================== */
  pt: {
    sigOrder: 'stc',
    gender: ['m','m','f','f','f','m','f','f','f','m','m','m','m','m','f','m','f','m','f','m'],
    colors: { rojo: 'Vermelho', blanco: 'Branco', azul: 'Azul', amarillo: 'Amarelo' },
    ui: {
      title: 'Sincronário das 13 Luas — Calendário lunar',
      desc: 'Calendário lunar interativo: fase da lua, lua do ano no Sincronário das 13 Luas, kin do Tzolkin, constelação zodiacal e referência gregoriana.',
      brand: 'Sincronário das 13 Luas',
      brandSub: '13\u00a0luas · 28\u00a0dias · Tzolkin',
      prevDay: 'Dia anterior', nextDay: 'Próximo dia', today: 'Hoje',
      pickDate: 'Escolher data', langAria: 'Idioma',
      moonAria: 'Fase da lua', wheelAria: 'Roda zodiacal',
      illum: 'Iluminação', age: 'Idade lunar',
      waxing: 'crescente', waning: 'minguante', ofCycle: 'do ciclo',
      moonYear: 'Lua do ano', nsYear: 'ano NS{n}', of13: 'de 13 luas',
      totem: 'Totem',
      dootName: 'Dia fora do tempo',
      dootMotto: 'Um dia pela paz, a arte e o perdão universal',
      dootT1: 'Fora das 13 luas', dootT2: '25 de julho',
      dootT3: 'Paz através da cultura', dootT4: 'Perdão universal',
      moonDay: 'Lua {m} · dia {d}',
      power: 'Poder', action: 'Ação', essence: 'Essência',
      hunab: '0.0 Hunab Ku · 29 de fevereiro',
      dayOf28: 'Dia {d} de 28', heptad: 'Heptada {n} · {p}',
      yearMeter: 'Ano de 13 luas', yearPct: '{p} · dia {d}',
      gregTrack: 'Calendário gregoriano · {a}–{b}', daysAbbr: '{n}\u00a0d',
      dootOpenHint: 'Ver o que é o dia fora do tempo',
      dootSum: 'Dia fora do tempo · 25 de julho',
      dootX1: 'As 13 luas somam <b>364 dias</b> (13 × 28). O ano gregoriano tem 365, então sobra um: <b>25 de julho</b>. Esse dia não pertence a nenhuma lua, a nenhuma heptada nem a nenhum kin — o Tzolkin não avança, e o ano seguinte começa em 26 de julho.',
      dootX2: 'É celebrado como um dia fora da contagem: «o tempo é arte» e, desde 1992, a Fundação para a Lei do Tempo o chama também <b>Dia Internacional da Paz através da Cultura</b>. O outro dia intercalar é 29 de fevereiro (<b>0.0 Hunab Ku</b>), que também não conta.',
      dootX3: 'Vale saber de onde vem: é o <b>Dreamspell</b> formulado por José e Lloydine Argüelles em 1987, uma releitura moderna inspirada no calendário maia. Não é a contagem longa maia clássica nem o Haab, e nas fontes maias não existe um «dia fora do tempo» com esta estrutura.',
      dootSrc: '<em>Fontes</em> <a href="https://www.lawoftime.org/thirteenmoon/doot.html" target="_blank" rel="noopener">Dia Fora do Tempo — Fundação para a Lei do Tempo</a> · <a href="https://www.lawoftime.org/thirteenmoon/tutorial.html" target="_blank" rel="noopener">Tutorial do calendário de 13 luas</a> · <a href="https://en.wikipedia.org/wiki/Dreamspell" target="_blank" rel="noopener">Dreamspell (Wikipédia, em inglês)</a> · <a href="https://pt.wikipedia.org/wiki/Calend%C3%A1rio_maia" target="_blank" rel="noopener">Calendário maia (Wikipédia)</a>',
      kinEyebrow: 'Assinatura galáctica · Kin',
      seal: 'Selo', tone: 'Tom', powerAction: 'Poder · Ação',
      wavespell: 'Onda encantada', castle: 'Castelo', guide: 'Guia',
      harmonic: 'Módulo harmônico 13:20',
      zodiacEyebrow: 'Zodíaco · posição lunar',
      moonIn: 'Lua em {sign}', realConst: 'Constelação real: <b>{c}</b>',
      eclLon: 'longitude eclíptica {x}°',
      zodiacNote: 'O signo tropical divide a eclíptica em 12 setores de 30° a partir do equinócio; a constelação real (limites da IAU) está deslocada ≈ 24° pela precessão, por isso a Lua pode estar em <b>Ofiúco</b> sem que exista um “signo” com esse nome.',
      phasesEyebrow: 'Ciclo sinódico · próximas fases',
      todayW: 'hoje', plusDays: '+{n} d',
      synodicNote: 'Ciclo sinódico médio <b>{n} dias</b> · a Lua de 28 dias do Sincronário é a média entre o ciclo sinódico e o sideral (27,32 d).',
      calGreg: 'Gregoriano ↔ 13\u00a0luas',
      prevMonth: 'Mês anterior', nextMonth: 'Próximo mês',
      dayTitle: 'Lua {m}.{d} · Kin {k} · {sig}',
      dootTitle: 'Dia fora do tempo · Kin {k}',
      dootBadge: 'FDT', dootShort: 'fora do tempo',
      yearTitle: 'Ano de 13 luas {a} – {b}',
      bearer: 'Portador: <b>{sig}</b> · NS{n}',
      footP: 'As fases e a posição lunar são calculadas no navegador com as séries de Meeus (precisão ≈ ±2\u00a0min nas fases, ±0,01° na longitude eclíptica). O Sincronário das 13 Luas segue o Dreamspell de José e Lloydine Argüelles: ano de 364\u00a0dias + Dia Fora do Tempo, contado desde 26 de julho; 29 de fevereiro compartilha a data com o 28 e não avança o kin.',
      footSum: 'Como cada dado é calculado',
      footD1: '<b>Lua do ano:</b> dias decorridos desde 26 de julho, em blocos de 28 (13 luas).',
      footD2: '<b>Kin:</b> contagem de 260 dias desde 26 de julho de 1987 (Kin\u00a034, Lua Magnética 1.1), omitindo os 29 de fevereiro.',
      footD3: '<b>Fase:</b> elongação geocêntrica Lua–Sol; a fração iluminada é (1−cos\u00a0ψ)/2.',
      footD4: '<b>Signo:</b> setor tropical de 30° desde o equinócio de março. <b>Constelação:</b> setor real da eclíptica segundo os limites da IAU (por isso existe Ofiúco).',
      footNote: 'Feito para observar o céu, não para substituir o calendário civil.'
    },
    seals: [
      ['Dragão', 'Nascimento', 'Nutrir', 'Ser'],
      ['Vento', 'Espírito', 'Comunicar', 'Sopro'],
      ['Noite', 'Abundância', 'Sonhar', 'Intuição'],
      ['Semente', 'Florescimento', 'Mirar', 'Consciência'],
      ['Serpente', 'Força Vital', 'Sobreviver', 'Instinto'],
      ['Enlaçador de Mundos', 'Morte', 'Igualar', 'Oportunidade'],
      ['Mão', 'Realização', 'Conhecer', 'Cura'],
      ['Estrela', 'Elegância', 'Embelezar', 'Arte'],
      ['Lua', 'Água Universal', 'Purificar', 'Fluxo'],
      ['Cachorro', 'Coração', 'Amar', 'Lealdade'],
      ['Macaco', 'Magia', 'Brincar', 'Ilusão'],
      ['Humano', 'Livre-Arbítrio', 'Influenciar', 'Sabedoria'],
      ['Viajante do Céu', 'Espaço', 'Explorar', 'Vigília'],
      ['Mago', 'Atemporalidade', 'Encantar', 'Receptividade'],
      ['Águia', 'Visão', 'Criar', 'Mente'],
      ['Guerreiro', 'Inteligência', 'Questionar', 'Intrepidez'],
      ['Terra', 'Navegação', 'Evoluir', 'Sincronicidade'],
      ['Espelho', 'Sem-fim', 'Refletir', 'Ordem'],
      ['Tempestade', 'Autogeração', 'Catalisar', 'Energia'],
      ['Sol', 'Fogo Universal', 'Iluminar', 'Vida']
    ],
    tones: [
      ['Magnético', 'Unificar', 'Atrair', 'Propósito'],
      ['Lunar', 'Polarizar', 'Estabilizar', 'Desafio'],
      ['Elétrico', 'Ativar', 'Vincular', 'Serviço'],
      ['Autoexistente', 'Definir', 'Medir', 'Forma'],
      ['Entonado', 'Empoderar', 'Comandar', 'Esplendor'],
      ['Rítmico', 'Organizar', 'Equilibrar', 'Igualdade'],
      ['Ressonante', 'Canalizar', 'Inspirar', 'Sintonia'],
      ['Galáctico', 'Harmonizar', 'Modelar', 'Integridade'],
      ['Solar', 'Pulsar', 'Realizar', 'Intenção'],
      ['Planetário', 'Aperfeiçoar', 'Produzir', 'Manifestação'],
      ['Espectral', 'Dissolver', 'Liberar', 'Libertação'],
      ['Cristal', 'Dedicar', 'Universalizar', 'Cooperação'],
      ['Cósmico', 'Perdurar', 'Transcender', 'Presença']
    ],
    moons: [
      ['Lua Magnética', 'Magn', 'Morcego'],
      ['Lua Lunar', 'Lunar', 'Escorpião'],
      ['Lua Elétrica', 'Elét', 'Cervo'],
      ['Lua Autoexistente', 'Auto', 'Coruja'],
      ['Lua Entonada', 'Ento', 'Pavão'],
      ['Lua Rítmica', 'Rítm', 'Lagartixa'],
      ['Lua Ressonante', 'Ress', 'Macaco'],
      ['Lua Galáctica', 'Galá', 'Falcão'],
      ['Lua Solar', 'Solar', 'Jaguar'],
      ['Lua Planetária', 'Plan', 'Cachorro'],
      ['Lua Espectral', 'Espe', 'Serpente'],
      ['Lua Cristal', 'Cris', 'Coelho'],
      ['Lua Cósmica', 'Cósm', 'Tartaruga']
    ],
    heptads: [
      'O conhecimento inicia a visão',
      'A humildade refina a meditação',
      'A paciência transforma a conduta',
      'O poder amadurece o fruto'
    ],
    castles: [
      'Castelo Vermelho Oriental do Girar',
      'Castelo Branco Setentrional do Cruzar',
      'Castelo Azul Ocidental do Queimar',
      'Castelo Amarelo Meridional do Dar',
      'Castelo Verde Central do Encantar'
    ],
    signs: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
      'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
    constellations: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
      'Libra', 'Escorpião', 'Ofiúco', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
    phases8: ['Lua nova', 'Lua crescente', 'Quarto crescente', 'Gibosa crescente',
      'Lua cheia', 'Gibosa minguante', 'Quarto minguante', 'Lua minguante']
  },

  /* =============================== ENGLISH ============================= */
  en: {
    sigOrder: 'cts',
    colors: { rojo: 'Red', blanco: 'White', azul: 'Blue', amarillo: 'Yellow' },
    ui: {
      title: '13 Moon Calendar — Lunar calendar',
      desc: 'Interactive lunar calendar: moon phase, moon of the year in the 13 Moon calendar, Tzolkin kin, zodiac constellation and Gregorian reference.',
      brand: '13 Moon Calendar',
      brandSub: '13\u00a0moons · 28\u00a0days · Tzolkin',
      prevDay: 'Previous day', nextDay: 'Next day', today: 'Today',
      pickDate: 'Pick a date', langAria: 'Language',
      moonAria: 'Moon phase', wheelAria: 'Zodiac wheel',
      illum: 'Illumination', age: 'Moon age',
      waxing: 'waxing', waning: 'waning', ofCycle: 'of the cycle',
      moonYear: 'Moon of the year', nsYear: 'NS year {n}', of13: 'of 13 moons',
      totem: 'Totem',
      dootName: 'Day out of Time',
      dootMotto: 'A day for peace, art and universal forgiveness',
      dootT1: 'Outside the 13 moons', dootT2: '25 July',
      dootT3: 'Peace through culture', dootT4: 'Universal forgiveness',
      moonDay: 'Moon {m} · day {d}',
      power: 'Power', action: 'Action', essence: 'Essence',
      hunab: '0.0 Hunab Ku · 29 February',
      dayOf28: 'Day {d} of 28', heptad: 'Heptad {n} · {p}',
      yearMeter: 'Year of 13 moons', yearPct: '{p} · day {d}',
      gregTrack: 'Gregorian calendar · {a}–{b}', daysAbbr: '{n}\u00a0d',
      dootOpenHint: 'What is the day out of time?',
      dootSum: 'Day out of time · 25 July',
      dootX1: 'The 13 moons add up to <b>364 days</b> (13 × 28). The Gregorian year has 365, so one is left over: <b>25 July</b>. That day belongs to no moon, no heptad and no kin — the Tzolkin does not advance, and the next year begins on 26 July.',
      dootX2: 'It is kept as a day outside the count: “time is art” and, since 1992, the Foundation for the Law of Time also calls it the <b>International Day of Peace through Culture</b>. The other intercalary day is 29 February (<b>0.0 Hunab Ku</b>), which is not counted either.',
      dootX3: 'Worth knowing where it comes from: this is the <b>Dreamspell</b> formulated by José and Lloydine Argüelles in 1987, a modern reading inspired by the Maya calendar. It is neither the Classic Maya Long Count nor the Haab, and Maya sources have no “day out of time” with this structure.',
      dootSrc: '<em>Sources</em> <a href="https://www.lawoftime.org/thirteenmoon/doot.html" target="_blank" rel="noopener">Day Out of Time — Foundation for the Law of Time</a> · <a href="https://www.lawoftime.org/thirteenmoon/tutorial.html" target="_blank" rel="noopener">13 Moon calendar tutorial</a> · <a href="https://en.wikipedia.org/wiki/Dreamspell" target="_blank" rel="noopener">Dreamspell (Wikipedia)</a> · <a href="https://en.wikipedia.org/wiki/Maya_calendar" target="_blank" rel="noopener">Maya calendar (Wikipedia)</a>',
      kinEyebrow: 'Galactic signature · Kin',
      seal: 'Seal', tone: 'Tone', powerAction: 'Power · Action',
      wavespell: 'Wavespell', castle: 'Castle', guide: 'Guiding kin',
      harmonic: 'Harmonic module 13:20',
      zodiacEyebrow: 'Zodiac · lunar position',
      moonIn: 'Moon in {sign}', realConst: 'Actual constellation: <b>{c}</b>',
      eclLon: 'ecliptic longitude {x}°',
      zodiacNote: 'The tropical sign divides the ecliptic into 12 sectors of 30° from the equinox; the actual constellation (IAU boundaries) has shifted ≈ 24° through precession, which is why the Moon can be in <b>Ophiuchus</b> even though no “sign” carries that name.',
      phasesEyebrow: 'Synodic cycle · next phases',
      todayW: 'today', plusDays: '+{n} d',
      synodicNote: 'Mean synodic cycle <b>{n} days</b> · the 28-day moon of the calendar is the average of the synodic and sidereal cycles (27.32 d).',
      calGreg: 'Gregorian ↔ 13\u00a0moons',
      prevMonth: 'Previous month', nextMonth: 'Next month',
      dayTitle: 'Moon {m}.{d} · Kin {k} · {sig}',
      dootTitle: 'Day out of Time · Kin {k}',
      dootBadge: 'OOT', dootShort: 'out of time',
      yearTitle: 'Year of 13 moons {a} – {b}',
      bearer: 'Bearer: <b>{sig}</b> · NS{n}',
      footP: 'Phases and lunar position are computed in the browser with Meeus series (accuracy ≈ ±2\u00a0min for phases, ±0.01° for ecliptic longitude). The 13 Moon calendar follows the Dreamspell of José and Lloydine Argüelles: a 364-day year plus the Day out of Time, counted from 26 July; 29 February shares its date with the 28th and does not advance the kin.',
      footSum: 'How each value is calculated',
      footD1: '<b>Moon of the year:</b> days elapsed since 26 July, in blocks of 28 (13 moons).',
      footD2: '<b>Kin:</b> a 260-day count from 26 July 1987 (Kin\u00a034, Magnetic Moon 1.1), skipping 29 February.',
      footD3: '<b>Phase:</b> geocentric Moon–Sun elongation; the illuminated fraction is (1−cos\u00a0ψ)/2.',
      footD4: '<b>Sign:</b> 30° tropical sector from the March equinox. <b>Constellation:</b> true ecliptic sector per IAU boundaries (hence Ophiuchus).',
      footNote: 'Made for watching the sky, not for replacing the civil calendar.'
    },
    seals: [
      ['Dragon', 'Birth', 'Nurture', 'Being'],
      ['Wind', 'Spirit', 'Communicate', 'Breath'],
      ['Night', 'Abundance', 'Dream', 'Intuition'],
      ['Seed', 'Flowering', 'Target', 'Awareness'],
      ['Serpent', 'Life Force', 'Survive', 'Instinct'],
      ['World-Bridger', 'Death', 'Equalize', 'Opportunity'],
      ['Hand', 'Accomplishment', 'Know', 'Healing'],
      ['Star', 'Elegance', 'Beautify', 'Art'],
      ['Moon', 'Universal Water', 'Purify', 'Flow'],
      ['Dog', 'Heart', 'Love', 'Loyalty'],
      ['Monkey', 'Magic', 'Play', 'Illusion'],
      ['Human', 'Free Will', 'Influence', 'Wisdom'],
      ['Skywalker', 'Space', 'Explore', 'Wakefulness'],
      ['Wizard', 'Timelessness', 'Enchant', 'Receptivity'],
      ['Eagle', 'Vision', 'Create', 'Mind'],
      ['Warrior', 'Intelligence', 'Question', 'Fearlessness'],
      ['Earth', 'Navigation', 'Evolve', 'Synchronicity'],
      ['Mirror', 'Endlessness', 'Reflect', 'Order'],
      ['Storm', 'Self-Generation', 'Catalyze', 'Energy'],
      ['Sun', 'Universal Fire', 'Enlighten', 'Life']
    ],
    tones: [
      ['Magnetic', 'Unify', 'Attract', 'Purpose'],
      ['Lunar', 'Polarize', 'Stabilize', 'Challenge'],
      ['Electric', 'Activate', 'Bond', 'Service'],
      ['Self-existing', 'Define', 'Measure', 'Form'],
      ['Overtone', 'Empower', 'Command', 'Radiance'],
      ['Rhythmic', 'Organize', 'Balance', 'Equality'],
      ['Resonant', 'Channel', 'Inspire', 'Attunement'],
      ['Galactic', 'Harmonize', 'Model', 'Integrity'],
      ['Solar', 'Pulse', 'Realize', 'Intention'],
      ['Planetary', 'Perfect', 'Produce', 'Manifestation'],
      ['Spectral', 'Dissolve', 'Release', 'Liberation'],
      ['Crystal', 'Dedicate', 'Universalize', 'Cooperation'],
      ['Cosmic', 'Endure', 'Transcend', 'Presence']
    ],
    moons: [
      ['Magnetic Moon', 'Magn', 'Bat'],
      ['Lunar Moon', 'Lunar', 'Scorpion'],
      ['Electric Moon', 'Elec', 'Deer'],
      ['Self-existing Moon', 'Self', 'Owl'],
      ['Overtone Moon', 'Over', 'Peacock'],
      ['Rhythmic Moon', 'Rhyth', 'Lizard'],
      ['Resonant Moon', 'Res', 'Monkey'],
      ['Galactic Moon', 'Gal', 'Hawk'],
      ['Solar Moon', 'Solar', 'Jaguar'],
      ['Planetary Moon', 'Plan', 'Dog'],
      ['Spectral Moon', 'Spec', 'Serpent'],
      ['Crystal Moon', 'Cryst', 'Rabbit'],
      ['Cosmic Moon', 'Cosm', 'Turtle']
    ],
    heptads: [
      'Knowledge initiates vision',
      'Humility refines meditation',
      'Patience transforms conduct',
      'Power ripens the fruit'
    ],
    castles: [
      'Red Eastern Castle of Turning',
      'White Northern Castle of Crossing',
      'Blue Western Castle of Burning',
      'Yellow Southern Castle of Giving',
      'Green Central Castle of Enchantment'
    ],
    signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    constellations: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Ophiuchus', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    phases8: ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
      'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']
  },

  /* =============================== GERMAN ============================== */
  de: {
    sigOrder: 'cts',
    // German declines: the stem and the gender of the seal are stored.
    // stem + er (m) / e (f) / es (n)
    gender: ['m','m','f','m','f','m','f','m','m','m','m','m','m','m','m','m','f','m','m','f'],
    adjColors: { rojo: 'rot', blanco: 'weiß', azul: 'blau', amarillo: 'gelb' },
    adjTones: ['magnetisch', 'lunar', 'elektrisch', 'selbstbestehend', 'übertönend',
      'rhythmisch', 'resonant', 'galaktisch', 'solar', 'planetarisch',
      'spektral', 'kristallin', 'kosmisch'],
    colors: { rojo: 'Rot', blanco: 'Weiß', azul: 'Blau', amarillo: 'Gelb' },
    ui: {
      title: 'Kalender der 13 Monde — Mondkalender',
      desc: 'Interaktiver Mondkalender: Mondphase, Mond des Jahres im 13-Monde-Kalender, Tzolkin-Kin, Tierkreis-Sternbild und gregorianische Entsprechung.',
      brand: 'Kalender der 13 Monde',
      brandSub: '13\u00a0Monde · 28\u00a0Tage · Tzolkin',
      prevDay: 'Vorheriger Tag', nextDay: 'Nächster Tag', today: 'Heute',
      pickDate: 'Datum wählen', langAria: 'Sprache',
      moonAria: 'Mondphase', wheelAria: 'Tierkreisrad',
      illum: 'Beleuchtung', age: 'Mondalter',
      waxing: 'zunehmend', waning: 'abnehmend', ofCycle: 'des Zyklus',
      moonYear: 'Mond des Jahres', nsYear: 'NS-Jahr {n}', of13: 'von 13 Monden',
      totem: 'Totem',
      dootName: 'Tag außerhalb der Zeit',
      dootMotto: 'Ein Tag für Frieden, Kunst und universelle Vergebung',
      dootT1: 'Außerhalb der 13 Monde', dootT2: '25. Juli',
      dootT3: 'Frieden durch Kultur', dootT4: 'Universelle Vergebung',
      moonDay: 'Mond {m} · Tag {d}',
      power: 'Kraft', action: 'Handlung', essence: 'Wesen',
      hunab: '0.0 Hunab Ku · 29. Februar',
      dayOf28: 'Tag {d} von 28', heptad: 'Heptade {n} · {p}',
      yearMeter: 'Jahr der 13 Monde', yearPct: '{p} · Tag {d}',
      gregTrack: 'Gregorianischer Kalender · {a}–{b}', daysAbbr: '{n}\u00a0T',
      dootOpenHint: 'Was ist der Tag außerhalb der Zeit?',
      dootSum: 'Tag außerhalb der Zeit · 25. Juli',
      dootX1: 'Die 13 Monde ergeben <b>364 Tage</b> (13 × 28). Das gregorianische Jahr hat 365, also bleibt einer übrig: der <b>25. Juli</b>. Dieser Tag gehört zu keinem Mond, keiner Heptade und keinem Kin — der Tzolkin läuft nicht weiter, und das nächste Jahr beginnt am 26. Juli.',
      dootX2: 'Er wird als Tag außerhalb der Zählung begangen: „Zeit ist Kunst“ und seit 1992 nennt ihn die Stiftung für das Gesetz der Zeit auch <b>Internationaler Tag des Friedens durch Kultur</b>. Der andere Schalttag ist der 29. Februar (<b>0.0 Hunab Ku</b>), der ebenfalls nicht zählt.',
      dootX3: 'Zum Ursprung: Das ist das <b>Dreamspell</b>, das José und Lloydine Argüelles 1987 formulierten — eine moderne Lesart, inspiriert vom Maya-Kalender. Es ist weder die klassische Lange Zählung der Maya noch der Haab, und in Maya-Quellen gibt es keinen „Tag außerhalb der Zeit“ dieser Bauart.',
      dootSrc: '<em>Quellen</em> <a href="https://www.lawoftime.org/thirteenmoon/doot.html" target="_blank" rel="noopener">Tag außerhalb der Zeit — Stiftung für das Gesetz der Zeit</a> · <a href="https://www.lawoftime.org/thirteenmoon/tutorial.html" target="_blank" rel="noopener">Tutorial zum 13-Monde-Kalender</a> · <a href="https://en.wikipedia.org/wiki/Dreamspell" target="_blank" rel="noopener">Dreamspell (Wikipedia, englisch)</a> · <a href="https://de.wikipedia.org/wiki/Maya-Kalender" target="_blank" rel="noopener">Maya-Kalender (Wikipedia)</a>',
      kinEyebrow: 'Galaktische Signatur · Kin',
      seal: 'Siegel', tone: 'Ton', powerAction: 'Kraft · Handlung',
      wavespell: 'Welle der Verzauberung', castle: 'Schloss', guide: 'Leitendes Kin',
      harmonic: 'Harmonisches Modul 13:20',
      zodiacEyebrow: 'Tierkreis · Mondposition',
      moonIn: 'Mond in {sign}', realConst: 'Tatsächliches Sternbild: <b>{c}</b>',
      eclLon: 'ekliptische Länge {x}°',
      zodiacNote: 'Das tropische Zeichen teilt die Ekliptik vom Äquinoktium aus in 12 Abschnitte von 30°; das tatsächliche Sternbild (IAU-Grenzen) ist durch die Präzession um ≈ 24° verschoben — deshalb kann der Mond im <b>Schlangenträger</b> stehen, obwohl es kein „Zeichen“ dieses Namens gibt.',
      phasesEyebrow: 'Synodischer Zyklus · nächste Phasen',
      todayW: 'heute', plusDays: '+{n} T',
      synodicNote: 'Mittlerer synodischer Zyklus <b>{n} Tage</b> · der 28-Tage-Mond des Kalenders ist der Mittelwert aus synodischem und siderischem Zyklus (27,32 d).',
      calGreg: 'Gregorianisch ↔ 13\u00a0Monde',
      prevMonth: 'Voriger Monat', nextMonth: 'Nächster Monat',
      dayTitle: 'Mond {m}.{d} · Kin {k} · {sig}',
      dootTitle: 'Tag außerhalb der Zeit · Kin {k}',
      dootBadge: 'AZT', dootShort: 'außerhalb der Zeit',
      yearTitle: 'Jahr der 13 Monde {a} – {b}',
      bearer: 'Träger: <b>{sig}</b> · NS{n}',
      footP: 'Phasen und Mondposition werden im Browser mit Meeus-Reihen berechnet (Genauigkeit ≈ ±2\u00a0min bei den Phasen, ±0,01° in der ekliptischen Länge). Der Kalender der 13 Monde folgt dem Dreamspell von José und Lloydine Argüelles: ein Jahr von 364\u00a0Tagen plus Tag außerhalb der Zeit, gezählt ab 26. Juli; der 29. Februar teilt das Datum mit dem 28. und zählt den Kin nicht weiter.',
      footSum: 'Wie die einzelnen Werte berechnet werden',
      footD1: '<b>Mond des Jahres:</b> seit dem 26. Juli verstrichene Tage, in Blöcken von 28 (13 Monde).',
      footD2: '<b>Kin:</b> 260-Tage-Zählung ab 26. Juli 1987 (Kin\u00a034, Magnetischer Mond 1.1), ohne den 29. Februar.',
      footD3: '<b>Phase:</b> geozentrische Elongation Mond–Sonne; der beleuchtete Anteil ist (1−cos\u00a0ψ)/2.',
      footD4: '<b>Zeichen:</b> tropischer 30°-Sektor ab der März-Tagundnachtgleiche. <b>Sternbild:</b> tatsächlicher Ekliptikabschnitt nach IAU-Grenzen (daher der Schlangenträger).',
      footNote: 'Gedacht zum Himmelsbeobachten, nicht als Ersatz für den bürgerlichen Kalender.'
    },
    seals: [
      ['Drache', 'Geburt', 'Nähren', 'Sein'],
      ['Wind', 'Geist', 'Kommunizieren', 'Atem'],
      ['Nacht', 'Fülle', 'Träumen', 'Intuition'],
      ['Same', 'Blühen', 'Zielen', 'Bewusstsein'],
      ['Schlange', 'Lebenskraft', 'Überleben', 'Instinkt'],
      ['Weltüberbrücker', 'Tod', 'Gleichsetzen', 'Gelegenheit'],
      ['Hand', 'Vollbringen', 'Erkennen', 'Heilung'],
      ['Stern', 'Eleganz', 'Verschönern', 'Kunst'],
      ['Mond', 'Universelles Wasser', 'Läutern', 'Fluss'],
      ['Hund', 'Herz', 'Lieben', 'Loyalität'],
      ['Affe', 'Magie', 'Spielen', 'Illusion'],
      ['Mensch', 'Freier Wille', 'Beeinflussen', 'Weisheit'],
      ['Himmelsläufer', 'Raum', 'Erforschen', 'Wachheit'],
      ['Zauberer', 'Zeitlosigkeit', 'Verzaubern', 'Empfänglichkeit'],
      ['Adler', 'Vision', 'Erschaffen', 'Verstand'],
      ['Krieger', 'Intelligenz', 'Hinterfragen', 'Furchtlosigkeit'],
      ['Erde', 'Navigation', 'Entwickeln', 'Synchronizität'],
      ['Spiegel', 'Endlosigkeit', 'Spiegeln', 'Ordnung'],
      ['Sturm', 'Selbstzeugung', 'Katalysieren', 'Energie'],
      ['Sonne', 'Universelles Feuer', 'Erleuchten', 'Leben']
    ],
    tones: [
      ['Magnetisch', 'Vereinigen', 'Anziehen', 'Zweck'],
      ['Lunar', 'Polarisieren', 'Stabilisieren', 'Herausforderung'],
      ['Elektrisch', 'Aktivieren', 'Verbinden', 'Dienst'],
      ['Selbstbestehend', 'Definieren', 'Messen', 'Form'],
      ['Übertönend', 'Ermächtigen', 'Befehlen', 'Ausstrahlung'],
      ['Rhythmisch', 'Organisieren', 'Ausgleichen', 'Gleichheit'],
      ['Resonant', 'Kanalisieren', 'Inspirieren', 'Einstimmung'],
      ['Galaktisch', 'Harmonisieren', 'Modellieren', 'Integrität'],
      ['Solar', 'Pulsieren', 'Verwirklichen', 'Absicht'],
      ['Planetarisch', 'Vervollkommnen', 'Hervorbringen', 'Manifestation'],
      ['Spektral', 'Auflösen', 'Befreien', 'Befreiung'],
      ['Kristall', 'Weihen', 'Universalisieren', 'Kooperation'],
      ['Kosmisch', 'Andauern', 'Transzendieren', 'Gegenwart']
    ],
    moons: [
      ['Magnetischer Mond', 'Magn', 'Fledermaus'],
      ['Lunarer Mond', 'Lunar', 'Skorpion'],
      ['Elektrischer Mond', 'Elek', 'Reh'],
      ['Selbstbestehender Mond', 'Selbst', 'Eule'],
      ['Übertönender Mond', 'Über', 'Pfau'],
      ['Rhythmischer Mond', 'Rhyth', 'Eidechse'],
      ['Resonanter Mond', 'Res', 'Affe'],
      ['Galaktischer Mond', 'Gal', 'Falke'],
      ['Solarer Mond', 'Solar', 'Jaguar'],
      ['Planetarischer Mond', 'Plan', 'Hund'],
      ['Spektraler Mond', 'Spek', 'Schlange'],
      ['Kristallmond', 'Krist', 'Hase'],
      ['Kosmischer Mond', 'Kosm', 'Schildkröte']
    ],
    heptads: [
      'Wissen eröffnet die Vision',
      'Demut verfeinert die Meditation',
      'Geduld verwandelt das Verhalten',
      'Kraft reift die Frucht'
    ],
    castles: [
      'Rotes Östliches Schloss der Wendung',
      'Weißes Nördliches Schloss der Kreuzung',
      'Blaues Westliches Schloss des Brennens',
      'Gelbes Südliches Schloss des Gebens',
      'Grünes Zentrales Schloss der Verzauberung'
    ],
    signs: ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
      'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'],
    constellations: ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
      'Waage', 'Skorpion', 'Schlangenträger', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'],
    phases8: ['Neumond', 'Zunehmende Sichel', 'Erstes Viertel', 'Zunehmender Mond',
      'Vollmond', 'Abnehmender Mond', 'Letztes Viertel', 'Abnehmende Sichel']
  }
};

/* ---------------------------------- estado del idioma */
const LANG_KEY = 'ml13.lang';
let LANG = 'es';

function normalizeLang(code) {
  if (!code) return null;
  const c = String(code).toLowerCase().replace('_', '-');
  if (c.startsWith('pt')) return 'pt';
  if (c.startsWith('es')) return 'es';
  if (c.startsWith('en')) return 'en';
  if (c.startsWith('de')) return 'de';
  return null;
}

function detectLang() {
  const url = new URLSearchParams(location.search).get('lang');
  const fromUrl = normalizeLang(url);
  if (fromUrl) return fromUrl;
  try {
    const saved = normalizeLang(localStorage.getItem(LANG_KEY));
    if (saved) return saved;
  } catch (e) { /* almacenamiento bloqueado */ }
  const cands = navigator.languages || [navigator.language || 'es'];
  for (const c of cands) {
    const n = normalizeLang(c);
    if (n) return n;
  }
  return 'es';
}

function setLang(code, repaint) {
  LANG = normalizeLang(code) || 'es';
  try { localStorage.setItem(LANG_KEY, LANG); } catch (e) { /* ignore */ }
  document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : LOCALES[LANG];
  document.title = t('title');
  const d = document.querySelector('meta[name="description"]');
  if (d) d.setAttribute('content', t('desc'));
  if (repaint !== false) {
    applyStaticText();
    render();
  }
}

/* ---------------------------------- helpers de idioma */
function L() { return I18N[LANG] || I18N.es; }

function t(key, vars) {
  let s = L().ui[key];
  if (s === undefined) s = I18N.es.ui[key] !== undefined ? I18N.es.ui[key] : key;
  if (vars) {
    for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  }
  return s;
}

function nf(x, decimals) {
  const d = decimals || 0;
  return new Intl.NumberFormat(LOCALES[LANG], {
    minimumFractionDigits: d, maximumFractionDigits: d
  }).format(x);
}

function pct(x) {
  return new Intl.NumberFormat(LOCALES[LANG], {
    style: 'percent', maximumFractionDigits: 0
  }).format(x);
}

function fmtDate(date, opts) {
  return new Intl.DateTimeFormat(LOCALES[LANG], opts).format(date);
}

/* Applies the static texts marked with data-i18n in the HTML. */
function applyStaticText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle) + (el.dataset.titleSuffix || '');
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}

/* Botones de idioma: crea el conmutador y lo mantiene sincronizado. */
function buildLangSwitch() {
  const box = document.getElementById('langSw');
  if (!box) return;
  box.setAttribute('aria-label', t('langAria'));
  box.innerHTML = LANGS.map(l =>
    `<button type="button" data-lang="${l.code}" title="${l.name}"
      aria-pressed="${l.code === LANG}"${l.code === LANG ? ' class="on"' : ''}>${l.tag}</button>`
  ).join('');
  box.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.lang === LANG) return;
      setLang(b.dataset.lang);
      buildLangSwitch();
    });
  });
}