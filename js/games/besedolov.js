// js/games/besedolov.js — Besedolov (tacko.io) – iskanje besed iz črk
// Legal: lastna izvedba navdahnjena z Besedolov tacko.io (dnevne črke, sestavi čim več besed). Ime Besedolov je generično (lov na besede), mehanika ni zaščitena, uporabljen lasten slovar in lastne uganke.
import { sounds } from '../sounds.js';
import { statsManager } from '../stats.js';
import { showToast, showConfetti } from '../feedback.js';
import { renderStartCard } from './game-start.js';
import { renderGameShell } from './game-layout.js';
import { setGameSettingsApplyHandler } from './game-settings-panel.js';
import { shuffle, mulberry32, stringToSeed } from '../utils/rng.js';

// Obsežen slovenski slovar 4-8 črk za preverjanje (normaliziran)
const DICT_RAW = [
  'HIŠA',
  'SOBA',
  'MIZA',
  'STOL',
  'OMARA',
  'POSTELJA',
  'KAVČ',
  'BALKON',
  'VRT',
  'GARAŽA',
  'KLET',
  'VRATA',
  'OKNO',
  'POLJE',
  'MORJE',
  'PLAŽA',
  'PESEK',
  'KAMEN',
  'DREVO',
  'TRAVA',
  'MLAKA',
  'POTOK',
  'JEZIK',
  'JUTRO',
  'VEČER',
  'DANES',
  'JUTRI',
  'TEDEN',
  'MESEC',
  'SONCE',
  'OBLAK',
  'VETER',
  'TOPLO',
  'VROČE',
  'GLAVA',
  'ROKAV',
  'HRBET',
  'PRSTI',
  'MESTO',
  'CESTA',
  'PTICA',
  'KOKOŠ',
  'LABOD',
  'SOKOL',
  'VRANA',
  'JELEN',
  'ZAJEC',
  'TIGER',
  'LADJA',
  'JADRO',
  'SLIVA',
  'HRUŠA',
  'GROZD',
  'MANGO',
  'OREHI',
  'KOREN',
  'BUČKA',
  'FIŽOL',
  'KOCKA',
  'KONUS',
  'KROGI',
  'PETKA',
  'ŠESTI',
  'DEVET',
  'DESET',
  'RDEČA',
  'MODRA',
  'RUMEN',
  'ZELEN',
  'RJAVA',
  'TABLA',
  'KREDA',
  'TORBA',
  'RAČUN',
  'ULICA',
  'VESEL',
  'SREČA',
  'MIRNO',
  'HITER',
  'DELAM',
  'GLEDA',
  'PIŠEM',
  'BEREM',
  'VOZIM',
  'LETIM',
  'SKAČE',
  'TEČEM',
  'PLEŠE',
  'ZLATA',
  'KROŽI',
  'HIŠKA',
  'VRATA',
  'OMARA',
  'POLJE',
  'MORJE',
  'PLAŽA',
  'PESEK',
  'KAMEN',
  'DREVO',
  'TRAVA',
  'MLAKA',
  'POTOK',
  'JEZIK',
  'JUTRO',
  'VEČER',
  'DANES',
  'JUTRI',
  'TEDEN',
  'MESEC',
  'SONCE',
  'OBLAK',
  'VETER',
  'GLAVA',
  'ROKAV',
  'HRBET',
  'PRSTI',
  'MESTO',
  'CESTA',
  'PTICA',
  'KOKOŠ',
  'LABOD',
  'SOKOL',
  'VRANA',
  'JELEN',
  'ZAJEC',
  'LADJA',
  'JADRO',
  'SLIVA',
  'HRUŠA',
  'GROZD',
  'MANGO',
  'OREHI',
  'KOREN',
  'BUČKA',
  'FIŽOL',
  'HLAČE',
  'HLADEN',
  'HLADILNIK',
  'HODITI',
  'HOROSKOP',
  'HOTEL',
  'HRANA',
  'HRBET',
  'HVALA',
  'IDEJA',
  'IGRATI',
  'IGRIŠČE',
  'IME',
  'IMETI',
  'INFORMACIJA',
  'INŠTITUT',
  'INTERNET',
  'INTERVJU',
  'INŽENIR',
  'ISKATI',
  'ISKREN',
  'ITALIJA',
  'ITI',
  'IZGUBITI',
  'IZHOD',
  'IZLET',
  'JABOLKO',
  'JAGODA',
  'JAJCE',
  'JASNO',
  'JAZ',
  'JEDILNICA',
  'JESTI',
  'JEZIK',
  'JOGA',
  'JOGURT',
  'JUHA',
  'JUTRI',
  'KAKO',
  'KAKTUS',
  'KAVA',
  'KAVARNA',
  'KDO',
  'KEPICA',
  'KILOMETER',
  'KINO',
  'KISEL',
  'KITARA',
  'KLASIČEN',
  'KLAVIR',
  'KLEPETATI',
  'KLJUČ',
  'KNJIGA',
  'KOLO',
  'KOMEDIJA',
  'KONCERT',
  'KONEC',
  'KONTAKT',
  'KOPALNICA',
  'KOSILO',
  'KOZAREC',
  'KRAJ',
  'KRASEN',
  'KRATEK',
  'KREDA',
  'KRILO',
  'KROMPIR',
  'KRUH',
  'KUHAR',
  'KUHATI',
  'KUHINJA',
  'KUPITI',
  'LAČEN',
  'LAHEK',
  'LAHKO',
  'LASJE',
  'LEDEN',
  'LEKARNA',
  'LEP',
  'LETALIŠČE',
  'LETO',
  'LEVO',
  'LIMONA',
  'LUNA',
  'MAČEK',
  'MAČKA',
  'MAJHEN',
  'MAJICA',
  'MALICA',
  'MAMA',
  'MARMELADA',
  'MASLO',
  'MATEMATIKA',
  'MESEC',
  'MESTO',
  'METER',
  'MINUTA',
  'MISLITI',
  'MIZA',
  'MLAD',
  'MLEKO',
  'MOBITEL',
  'MODEREN',
  'MORJE',
  'MOŠKI',
  'MOTOR',
  'MOŽ',
  'MRZEL',
  'MUZEJ',
  'NAČRT',
  'NADSTROPJE',
  'NAHRBTNIK',
  'NALOGA',
  'NAPREJ',
  'NAREDITI',
  'NAROČITI',
  'NASLOV',
  'NEDELJA',
  'NEMČIJA',
  'NIČ',
  'NIKOLI',
  'NJEN',
  'NOGA',
  'NOGOMET',
  'NOV',
  'NOVEMBER',
  'OBISK',
  'OBLAČNO',
  'OBLAK',
  'OBLEKA',
  'OČALA',
  'ODGOVORITI',
  'ODLIČEN',
  'ODPRETI',
  'OKNO',
  'OKOLI',
  'OKUSEN',
  'OMARA',
  'OPERA',
  'ORANŽEN',
  'OSEM',
  'OTROK',
  'PAPIR',
  'PARK',
  'PES',
  'PET',
  'PICA',
  'PIJAČA',
  'PILOT',
  'PIRAMIDA',
  'PISARNA',
  'PISATI',
  'PISMO',
  'PITI',
  'PIVO',
  'PLAČATI',
  'PLES',
  'PLESATI',
  'POCENI',
  'POČASI',
  'POČITNICE',
  'PODJETJE',
  'POGOSTO',
  'POHIŠTVO',
  'POKLIC',
  'POLN',
  'POMAGATI',
  'POMARANČA',
  'POMEMBEN',
  'PONAVADI',
  'PONEDELJEK',
  'POPOLDNE',
  'POROČEN',
  'POSLATI',
  'POSLUŠATI',
  'POSTELJA',
  'POŠTA',
  'POTICA',
  'POTOVANJE',
  'POUK',
  'POZABITI',
  'POZDRAV',
  'POZNO',
  'PRALNI',
  'PRAZEN',
  'PRAZNIK',
  'PREDSOBA',
  'PREDSTAVITI',
  'PREGLED',
  'PRIHAJATI',
  'PRIIMEK',
  'PRIJATELJ',
  'PRIJAZEN',
  'PRIPRAVITI',
  'PRITI',
  'PRITLIČJE',
  'PROBLEM',
  'PRODAJATI',
  'PROFESOR',
  'PROSIM',
  'PROST',
  'PRVI',
  'PULOVER',
  'PUNCA',
  'RAČUN',
  'RAČUNALNIK',
  'RAD',
  'RADIO',
  'RAZGLED',
  'RDEČ',
  'REČI',
  'RESTAVRACIJA',
  'RJAV',
  'ROGLJIČEK',
  'ROKA',
  'ROMANTIČEN',
  'ROŽA',
  'RUMEN',
  'SALAMA',
  'SEDEM',
  'SENDVIČ',
  'SESTANEK',
  'SEVEDA',
  'SIN',
  'SIR',
  'SIV',
  'SLAB',
  'SLADEK',
  'SLADOLED',
  'SLAN',
  'SLAŠČIČARNA',
  'SLIKA',
  'SLIŠATI',
  'SLOVENIJA',
  'SLOVENSKI',
  'SLUŽBA',
  'SNEG',
  'SOBA',
  'SOBOTA',
  'SOK',
  'SOLATA',
  'SONCE',
  'SOSED',
  'SPALNICA',
  'SPATI',
  'SPLETNA',
  'SPOMNITI',
  'SPOZNAVATI',
  'SRAJCA',
  'SREČATI',
  'SREDA',
  'STANOVANJE',
  'STAR',
  'STENA',
  'STOL',
  'STOPNICE',
  'STRIC',
  'SUH',
  'SUPER',
  'SVETEL',
  'SVEŽ',
  'SVINČNIK',
  'ŠAMPON',
  'ŠEF',
  'ŠEST',
  'ŠOLA',
  'ŠPAGETI',
  'ŠPORT',
  'ŠTEDILNIK',
  'ŠTEVILKA',
  'ŠTIRI',
  'ŠTUDENT',
  'ŠTUDIRATI',
  'TABLA',
  'TAKO',
  'TAKSI',
  'TEDEN',
  'TEKMA',
  'TELEFON',
  'TELEVIZIJA',
  'TELO',
  'TEMEN',
  'TENIS',
  'TERASA',
  'TEST',
  'TEŽEK',
  'TISOČ',
  'TOPEL',
  'TOREK',
  'TORTA',
  'TOVARNA',
  'TREBUH',
  'TRG',
  'TRGOVINA',
  'TRI',
  'TUDI',
  'TUKAJ',
  'TURISTIČNA',
  'TUŠ',
  'TVOJ',
  'UČBENIK',
  'UČITELJ',
  'UČITI',
  'UDOBEN',
  'ULICA',
  'UMAZAN',
  'UNIVERZA',
  'URA',
  'UTRUJEN',
  'VABILO',
  'VAJA',
  'VAŠ',
  'VČASIH',
  'VČERAJ',
  'VEČ',
  'VEČER',
  'VEČERJA',
  'VEDETI',
  'VEDNO',
  'VELIK',
  'VESEL',
  'VESELJE',
  'VHOD',
  'VIDETI',
  'VINO',
  'VISOK',
  'VODA',
  'VOZITI',
  'VREME',
  'VROČ',
  'VRT',
  'VRTEC',
  'VSAK',
  'VŠEČ',
  'ZABAVA',
  'ZAČETI',
  'ZAJTRK',
  'ZAKAJ',
  'ZANIMIV',
  'ZAPRETI',
  'ZDRAVILO',
  'ZDRAVNIK',
  'ZDRAVO',
  'ZEBRA',
  'ZELEN',
  'ZELO',
  'ZGODAJ',
  'ZVEZEK',
  'ŽALOSTEN',
  'ŽE',
  'ŽEJEN',
  'ŽELETI',
  'ŽELEZNIŠKA',
  'ŽENA',
  'ŽENSKA',
  'ŽGANJE',
  'ŽIRAFA',
  'ŽIVETI',
  'ŽIVJO',
  'AVTO',
  'VLAK',
  'LADJA',
  'KOLO',
  'ČOLN',
  'JADRO',
  'GUMA',
  'MOTOR',
  'BENCIN',
  'CESTA',
  'MOST',
  'PARK',
  'GOZD',
  'POLJE',
  'GORA',
  'REKA',
  'JEZERO',
  'OTOK',
  'MORJE',
  'HRUŠKA',
  'JABOLKO',
  'BANANA',
  'POMARANČA',
  'LIMONA',
  'KIVI',
  'MELONA',
  'LUBENICA',
  'JAGODA',
  'MALINA',
  'BOROVNICA',
  'ROBIDA',
  'RIBEZ',
  'GROZDJE',
  'KORENJE',
  'PARADIŽNIK',
  'KUMARA',
  'SOLATA',
  'ČEBULA',
  'ČESEN',
  'KROMPIR',
  'ZELJE',
  'CVETAČA',
  'BROKOLI',
  'BUČA',
  'GRAH',
  'LEČA',
  'FIŽOL',
  'KAVA',
  'ČAJ',
  'MLEKO',
  'SOK',
  'PIVO',
  'VINO',
  'KRUH',
  'MESA',
  'SIRA',
  'JAJCE',
  'MED',
  'SLADKOR',
  'SOL',
  'POPER',
  'CIMET',
  'KUMINA',
  'ORIGANO',
  'BAZILIKA',
  'PETERŠILJ',
  'KOPER',
  'PEHTRAN',
  'ŽAJBELJ',
  'TIMIJAN',
  'ROŽMARIN',
  'BAGER',
  'BAJTA',
  'BALON',
  'BARVA',
  'BARKA',
  'BISER',
  'BLAGO',
  'BLATO',
  'BOBEN',
  'BOLHA',
  'BOROV',
  'BREST',
  'BREZA',
  'BRINA',
  'BROD',
  'CENA',
  'CIMET',
  'DEBEL',
  'DELTA',
  'DEŽEL',
  'DOBER',
  'DOLAR',
  'DOLGA',
  'DOMOV',
  'DREVO',
  'DRUGA',
  'ELEKT',
  'FARBA',
  'FILM',
  'FIZIK',
  'FORMA',
  'FOTKA',
  'GALER',
  'GASIL',
  'GAZEL',
  'GIBAM',
  'GLAS',
  'GLAVA',
  'GLOBUS',
  'GLUMA',
  'GNEZD',
  'GOBA',
  'GODBA',
  'GOLOB',
  'GORIM',
  'GOST',
  'GRAD',
  'GRAM',
  'GRLO',
  'GROZA',
  'GUMBI',
  'GUSKA',
  'HITRO',
  'HLADI',
  'HLEB',
  'HMELJ',
  'HODIM',
  'HRAST',
  'IGRA',
  'IKONA',
  'ISKRA',
  'IZLET',
  'IZPIT',
  'JAGOD',
  'JAVOR',
  'JELEN',
  'JESEN',
  'JEZIK',
  'KABEL',
  'KAKAV',
  'KAMEN',
  'KAPEL',
  'KARTA',
  'KAVA',
  'KEBAB',
  'KITAR',
  'KLAPA',
  'KLIMA',
  'KLJUC',
  'KLOBU',
  'KLUB',
  'KMET',
  'KOCKA',
  'KODER',
  'KOKOS',
  'KONEC',
  'KONJ',
  'KOREN',
  'KOSI',
  'KRALJ',
  'KRAVA',
  'KREDA',
  'KRIŽ',
  'KROJ',
  'KRUH',
  'KUHAR',
  'KULT',
  'KUPA',
  'KUPIM',
  'KVAKA',
  'KVAS',
  'LABOD',
  'LADJA',
  'LAMPA',
  'LASER',
  'LEDEN',
  'LEGEN',
  'LESKA',
  'LETAL',
  'LIGA',
  'LIMON',
  'LIST',
  'LITER',
  'LOTUS',
  'LUKA',
  'LUNA',
  'MAČEK',
  'MAGIA',
  'MAJKA',
  'MALIN',
  'MAMA',
  'MANDL',
  'MANGO',
  'MARKA',
  'MASAŽ',
  'MATI',
  'MEGLA',
  'MEHKO',
  'MEJA',
  'MELON',
  'MESAR',
  'MESEC',
  'MESTO',
  'METLA',
  'MILO',
  'MIMO',
  'MINI',
  'MISLI',
  'MIZA',
  'MLAKA',
  'MLEKO',
  'MLIN',
  'MOBIL',
  'MOČNO',
  'MODRA',
  'MOKRA',
  'MOLIM',
  'MORJE',
  'MOTEL',
  'MOTKA',
  'MOTOR',
  'MUCA',
  'MUHA',
  'MUZEJ',
  'NAFTA',
  'NAGEL',
  'NAKIT',
  'NALOG',
  'NARAV',
  'NAUK',
  'NEBO',
  'NEMIR',
  'NIKEL',
  'NIZKO',
  'NOBEL',
  'NOGA',
  'NORA',
  'NOTA',
  'NOVI',
  'OBALA',
  'OBARA',
  'OBČIN',
  'OBDAR',
  'OBISK',
  'OBLAK',
  'OBLEK',
  'OBRAZ',
  'OCENA',
  'OCEAN',
  'OČALA',
  'ODMEV',
  'ODPRT',
  'OGLED',
  'OKLEP',
  'OKOLI',
  'OKUS',
  'OMARA',
  'OPAZI',
  'OPERA',
  'OPICA',
  'OPIS',
  'ORAN',
  'OREH',
  'ORGLA',
  'OSAMA',
  'OSET',
  'OSICA',
  'OSNOV',
  'OTOK',
  'OVCA',
  'PADEC',
  'PAKET',
  'PALMA',
  'PANDA',
  'PAPIR',
  'PARK',
  'PASTA',
  'PATKA',
  'PAVZA',
  'PAZIM',
  'PEČAT',
  'PEDAL',
  'PEGAS',
  'PEKIN',
  'PERJE',
  'PERLA',
  'PESEM',
  'PEST',
  'PETER',
  'PETKA',
  'PETEL',
  'PIANO',
  'PIJEM',
  'PIKA',
  'PILON',
  'PILOT',
  'PIRAT',
  'PISAL',
  'PISMO',
  'PIŠEM',
  'PIVO',
  'PLAK',
  'PLAVI',
  'PLAZA',
  'PLEME',
  'PLESA',
  'PLIMA',
  'PLIN',
  'PLOHA',
  'PLUTA',
  'POETA',
  'POGON',
  'POJAV',
  'POKAL',
  'POKER',
  'POLEN',
  'POLJE',
  'POMEM',
  'POMOL',
  'POPER',
  'POROK',
  'POSEB',
  'POSLA',
  'POSTA',
  'POTEK',
  'POTOK',
  'POVOD',
  'POZNO',
  'PRAGA',
  'PRAH',
  'PRAV',
  'PREJA',
  'PREKO',
  'PREST',
  'PRODA',
  'PROGA',
  'PROSO',
  'PRST',
  'PUDER',
  'PULZ',
  'PUMPA',
  'PUNCA',
  'PUŠČA',
  'RACUN',
  'RADAR',
  'RADIO',
  'RAJON',
  'RAMA',
  'RANO',
  'RASA',
  'RASTA',
  'RAVEN',
  'REBRA',
  'REGAL',
  'REKET',
  'REPKA',
  'REST',
  'REVEN',
  'REZAN',
  'RIBA',
  'RITEM',
  'RIVA',
  'ROBID',
  'ROČAJ',
  'ROČKA',
  'ROKA',
  'ROLKA',
  'ROMAN',
  'RUBIN',
  'RUDA',
  'RUMEN',
  'SABOR',
  'SADJE',
  'SALAM',
  'SAMBA',
  'SANJE',
  'SANKA',
  'SAVNA',
  'SEJAN',
  'SEKIR',
  'SEMAF',
  'SEMEN',
  'SENCA',
  'SEVER',
  'SIDRO',
  'SITAR',
  'SKALA',
  'SKLED',
  'SKOK',
  'SKRB',
  'SLAMA',
  'SLANA',
  'SLIKA',
  'SLIVA',
  'SLUŽB',
  'SMETI',
  'SMOLA',
  'SMREK',
  'SOBA',
  'SOKO',
  'SOLAT',
  'SONCE',
  'SOPAR',
  'SOROD',
  'SPISA',
  'SPONA',
  'SPORE',
  'SREČA',
  'STARA',
  'STAVB',
  'STEBR',
  'STENA',
  'STISK',
  'STOL',
  'STREH',
  'STRIC',
  'STROJ',
  'STRUP',
  'STVAR',
  'SVILA',
  'TABLA',
  'TABEL',
  'TABOR',
  'TANGO',
  'TANK',
  'TAPET',
  'TARČA',
  'TARTA',
  'TEČAJ',
  'TEKOČ',
  'TELO',
  'TEMNO',
  'TENIS',
  'TERAN',
  'TEREN',
  'TESLA',
  'TETKA',
  'TIGER',
  'TISK',
  'TITAN',
  'TOČKA',
  'TOMAT',
  'TONA',
  'TOPLA',
  'TORBA',
  'TOVAR',
  'TRATA',
  'TRAVA',
  'TULIP',
  'TUNEL',
  'TUŠ',
  'UČEN',
  'ULICA',
  'UMETN',
  'VADBA',
  'VAGON',
  'VAREN',
  'VAZA',
  'VEČER',
  'VEDNO',
  'VELIK',
  'VENEC',
  'VERA',
  'VESLO',
  'VETER',
  'VIDIK',
  'VILIC',
  'VINO',
  'VISKO',
  'VLAGA',
  'VLAK',
  'VODA',
  'VODKA',
  'VOJAK',
  'VOLAN',
  'VOLK',
  'VOLNA',
  'VRATA',
  'VRBA',
  'VRT',
  'ZABAV',
  'ZAGOR',
  'ZAJEC',
  'ZAKON',
  'ZALIV',
  'ZAMEN',
  'ZANKA',
  'ZAPAD',
  'ZAPOR',
  'ZASTA',
  'ZATOR',
  'ZDRAV',
  'ZEBRA',
  'ZELEN',
  'ZEMLJ',
  'ZID',
  'ZIMSK',
  'ZLATI',
  'ZMAJ',
  'ZMAJA',
  'ZNAK',
  'ZORAN',
  'ZRAK',
  'ZVEST',
  'ZVEZD',
  'ZVOK',
  'ŽABA',
  'ŽAGA',
  'ŽAR',
  'ŽEJA',
  'ŽICA',
  'ŽIVAL',
  'ŽLICA',
  'ŽOGA',
  'ŽUPAN',
];

function normalize(word) {
  return String(word || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}
const DICT_SET = new Set(
  DICT_RAW.map(w => normalize(w)).filter(w => w.length >= 3 && w.length <= 10)
);
let DICT = Array.from(DICT_SET);
// Razširi slovar z zunanjim frekvenčnim slovarjem (2000 besed) – če uspe, izboljša pokritost
if (typeof fetch !== 'undefined') {
  fetch('./data/slovar.json')
    .then(r => (r.ok ? r.json() : []))
    .then(arr => {
      if (Array.isArray(arr) && arr.length) {
        let added = 0;
        arr.forEach(w => {
          const n = normalize(w);
          if (n.length >= 3 && n.length <= 10 && !DICT_SET.has(n)) {
            DICT_SET.add(n);
            added++;
          }
        });
        if (added) {
          DICT = Array.from(DICT_SET);
        }
      }
    })
    .catch(() => {});
}

// Pomožni: preveri če beseda lahko nastane iz nabora črk (ponavljanje dovoljeno) in vsebuje centralno
function canForm(word, allowedSet, central) {
  const w = normalize(word);
  if (w.length < 4) return false;
  if (!w.includes(central)) return false;
  for (const ch of w) {
    if (!allowedSet.has(ch)) return false;
  }
  if (!DICT_SET.has(w)) return false;
  return true;
}

function getAllSolutions(letters, central) {
  const set = new Set(letters.map(l => normalize(l)));
  const c = normalize(central);
  return DICT.filter(w => canForm(w, set, c));
}

function generatePuzzle(seedStr) {
  // poskusi najti pangram besedo z 7 različnimi črkami
  let rng;
  if (seedStr) rng = mulberry32(stringToSeed(seedStr));
  else rng = Math.random;
  // filtriraj kandidate pangramov: besede dolžine 7-8 z 7 različnimi črkami
  const candidates = DICT.filter(w => {
    const n = normalize(w);
    if (n.length < 7 || n.length > 8) return false;
    const uniq = new Set(n.split(''));
    return uniq.size === 7;
  });
  // če ni dovolj kandidatov, uporabi naključne 7 črk z samoglasnikom
  for (let attempt = 0; attempt < 200; attempt++) {
    let letters, central, solutions;
    if (candidates.length && Math.random() < 0.85) {
      const word = candidates[Math.floor(rng() * candidates.length)];
      const uniq = Array.from(new Set(normalize(word).split('')));
      letters = shuffle(uniq, rng);
      central = letters[Math.floor(rng() * letters.length)];
      // zagotovi samoglasnik v naboru
      const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
      if (!letters.some(l => vowels.has(l))) continue;
      solutions = getAllSolutions(letters, central);
      const pangrams = solutions.filter(w => {
        const uniqW = new Set(normalize(w).split(''));
        return uniqW.size === 7 && letters.every(l => normalize(w).includes(l));
      });
      if (solutions.length >= 12 && pangrams.length >= 1 && solutions.length <= 80) {
        return { letters, central, solutions, pangrams };
      }
    } else {
      // naključne 7 črk
      const alphabet = 'ABCČDEFGHIJKLMNOPRSŠTUVZŽ'.split('');
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      // zagotovi 2 samoglasnika
      let picks = [];
      picks.push(vowels[Math.floor(rng() * vowels.length)]);
      picks.push(vowels[Math.floor(rng() * vowels.length)]);
      while (picks.length < 7) {
        const ch = alphabet[Math.floor(rng() * alphabet.length)];
        if (!picks.includes(ch)) picks.push(ch);
      }
      letters = shuffle(picks, rng);
      central = letters[0];
      solutions = getAllSolutions(letters, central);
      const pangrams = solutions.filter(w => new Set(normalize(w).split('')).size === 7);
      if (solutions.length >= 10 && solutions.length <= 70) {
        return { letters, central, solutions, pangrams };
      }
    }
  }
  // fallback trivijalno
  const letters = ['A', 'E', 'I', 'O', 'U', 'L', 'N'];
  const central = 'A';
  const solutions = getAllSolutions(letters, central);
  return {
    letters,
    central,
    solutions,
    pangrams: solutions.filter(w => new Set(normalize(w).split('')).size === 7),
  };
}

function scoreWord(word, isPangram) {
  const len = normalize(word).length;
  let pts = 0;
  if (len === 4) pts = 1;
  else pts = len;
  if (isPangram) pts += 7;
  return pts;
}

export function renderBesedolov() {
  const settingsHtml = `
    <div class="settings-row">
      <label class="form-label">Način
        <select id="blov-mode" class="form-select">
          <option value="daily" selected>Dnevni izziv (enake črke za vse)</option>
          <option value="random">Naključno</option>
        </select>
      </label>
      <label class="form-label">Najmanj črk
        <select id="blov-minlen" class="form-select">
          <option value="3">3</option>
          <option value="4" selected>4</option>
        </select>
      </label>
    </div>
  `;

  const stageHtml = `
    <div class="game-stage">
      <div id="blov-start-screen" class="stage-layer">
        ${renderStartCard(
          'Iz danih 7 črk sestavi čim več besed. Vsaka beseda mora vsebovati osrednjo črko in biti dolga vsaj 4. Pangram uporabi vseh 7 črk!',
          'blov-start-btn',
          '▶ Začni Besedolov',
          'Besedolov – Lov na besede'
        )}
      </div>

      <div id="blov-play-screen" class="stage-layer hidden">
        <div class="blov-stage-container">
          <div class="blov-topbar">
            <div class="blov-score-box">
              <div class="blov-score-pill"><span class="blov-score-label">Točke</span><span class="blov-score-val" id="blov-score">0</span></div>
              <div class="blov-score-pill"><span class="blov-score-label">Najdeno</span><span class="blov-score-val" id="blov-count">0</span></div>
            </div>
            <button id="blov-shuffle-btn" class="btn btn-outline" style="padding:0.35rem 0.7rem; font-size:0.82rem;">🔀 Premešaj</button>
          </div>

          <div class="blov-progress" aria-hidden="true"><div id="blov-progress-fill" class="blov-progress-fill" style="width:0%"></div></div>
          <div id="blov-rank" class="blov-rank">Začetnik</div>

          <div id="blov-input" class="blov-input-display"><span id="blov-input-text"></span><span class="blov-cursor"></span></div>

          <div id="blov-hive" class="blov-hive"></div>

          <div class="blov-actions">
            <button id="blov-delete-btn" class="btn btn-outline" style="padding:0.5rem 1rem;">⌫ Izbriši</button>
            <button id="blov-submit-btn" class="btn" style="padding:0.5rem 1.4rem;">Potrdi</button>
            <button id="blov-hint-btn" class="btn btn-outline" style="padding:0.5rem 0.9rem;">💡 Namig</button>
          </div>

          <div id="blov-message" class="blov-message"></div>

          <div id="blov-found" class="blov-found"></div>

          <p class="blov-help">Namig: centralna črka mora biti v vsaki besedi. Pangram (+7) uporabi vseh 7 črk.</p>
        </div>
      </div>

      <div id="blov-end-screen" class="stage-layer hidden">
        <div class="rc-victory-content" style="text-align:center; max-width:420px; width:92%; background:var(--color-surface); border:1px solid var(--color-border); padding:var(--spacing-md); border-radius:var(--border-radius); box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <h3 class="result-title" style="font-size:1.3rem; margin-bottom:var(--spacing-xs); color:var(--color-success);">Časovni izziv končan!</h3>
          <p class="muted-xs" style="margin-bottom:var(--spacing-xs);">Najdenih besed: <strong id="blov-final-count">0</strong> / <span id="blov-final-total">0</span></p>
          <p class="muted-xs" style="margin-bottom:var(--spacing-sm);">Točke: <strong id="blov-final-score">0</strong> • Pangrami: <strong id="blov-final-pangram">0</strong></p>
          <div id="blov-missing" style="max-height:120px; overflow-y:auto; font-size:0.82rem; text-align:left; background:var(--color-bg); border:1px solid var(--color-border); border-radius:8px; padding:8px; margin-bottom:var(--spacing-sm);"></div>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <button id="blov-share-btn" class="btn btn-outline">📋 Deli</button>
            <button id="blov-retry-btn" class="btn">Nova igra</button>
          </div>
          <button id="blov-back-to-list" class="btn btn-outline" style="margin-top:8px; padding:0.35rem 0.8rem; font-size:0.82rem;">← Seznam iger</button>
        </div>
      </div>
    </div>
  `;

  const infoHtml = `
    <h4 style="margin-bottom:8px;">O igri Besedolov</h4>
    <p style="margin-bottom:12px;">Besedolov je <strong>dnevna slovenska igra iskanja besed iz črk</strong> (navdih tacko.io – Besedolov). Mehanika <em>7 črk + osrednja + neomejeno ponavljanje</em> je splošna in ni avtorsko zaščitena; uporabljamo <strong>lasten slovar ~500 besed</strong> in lastne dnevne sestave.</p>
    <ul style="margin-bottom:12px; padding-left:20px; line-height:1.6;">
      <li>Satovje 7 črk (1 osrednja rumena).</li>
      <li>Beseda ≥4 črk, mora vsebovati osrednjo, le dovoljene črke.</li>
      <li>4-črkovne =1 točka, daljše = dolžina, pangram +7.</li>
      <li>Rangi: Začetnik → Dobro → Super → Odlično → Genij (≥70% možnih točk).</li>
      <li>Dnevni način enake črke za vse (seed iz datuma).</li>
    </ul>
  `;

  return renderGameShell({
    title: 'Besedolov',
    subtitle: 'Satovje 7 črk – poišči vse besede!',
    statusHtml:
      '<span>Točke: <strong id="blov-header-score">0</strong></span><span>Rang: <strong id="blov-header-rank">-</strong></span>',
    settingsHtml,
    stageHtml,
    infoHtml,
  });
}

export function initBesedolov() {
  const startScreen = document.getElementById('blov-start-screen');
  const playScreen = document.getElementById('blov-play-screen');
  const endScreen = document.getElementById('blov-end-screen');
  const hiveEl = document.getElementById('blov-hive');
  const inputText = document.getElementById('blov-input-text');
  const scoreEl = document.getElementById('blov-score');
  const countEl = document.getElementById('blov-count');
  const progEl = document.getElementById('blov-progress-fill');
  const rankEl = document.getElementById('blov-rank');
  const msgEl = document.getElementById('blov-message');
  const foundEl = document.getElementById('blov-found');
  const headerScore = document.getElementById('blov-header-score');
  const headerRank = document.getElementById('blov-header-rank');

  let mode = 'daily';
  let minLen = 4;
  let puzzle = null;
  let currentInput = '';
  let foundSet = new Set();
  let totalScore = 0;
  let maxScore = 0;
  let sortedSolutions = [];

  function readSettings() {
    const mEl = document.getElementById('blov-mode');
    const lEl = document.getElementById('blov-minlen');
    if (mEl) mode = mEl.value || 'daily';
    if (lEl) minLen = parseInt(lEl.value, 10) || 4;
  }

  setGameSettingsApplyHandler(() => {
    readSettings();
    startNewGame();
    showLayer(playScreen);
  });

  function showLayer(l) {
    [startScreen, playScreen, endScreen].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (l) l.classList.remove('hidden');
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function showMessage(t, type = 'info') {
    if (!msgEl) return;
    msgEl.textContent = t;
    msgEl.className = 'blov-message ' + type;
    if (t) {
      clearTimeout(showMessage._t);
      showMessage._t = setTimeout(() => {
        msgEl.textContent = '';
        msgEl.className = 'blov-message';
      }, 1800);
    }
  }

  function rankFor(pct) {
    if (pct >= 70) return 'Genij 🌟';
    if (pct >= 50) return 'Odlično 🎉';
    if (pct >= 30) return 'Super 👍';
    if (pct >= 15) return 'Dobro 🙂';
    if (pct >= 5) return 'Začetnik 🌱';
    return 'Začetnik';
  }

  function updateUI() {
    if (scoreEl) scoreEl.textContent = String(totalScore);
    if (headerScore) headerScore.textContent = String(totalScore);
    if (countEl) countEl.textContent = String(foundSet.size);
    const pct = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
    const rank = rankFor(pct);
    if (rankEl) rankEl.textContent = rank + ' (' + pct + '% )';
    if (headerRank) headerRank.textContent = rank;
    if (progEl) progEl.style.width = pct + '%';
    if (inputText) inputText.textContent = currentInput;
    // found list
    if (foundEl) {
      foundEl.innerHTML = '';
      const arr = Array.from(foundSet).sort((a, b) => b.length - a.length || a.localeCompare(b));
      arr.forEach(w => {
        const chip = document.createElement('span');
        const isPangram =
          new Set(normalize(w).split('')).size === 7 &&
          puzzle.letters.every(l => normalize(w).includes(normalize(l)));
        chip.className = 'blov-found-chip' + (isPangram ? ' pangram' : '');
        chip.textContent = w + (isPangram ? ' ★' : '');
        foundEl.appendChild(chip);
      });
    }
  }

  function buildHive() {
    if (!hiveEl || !puzzle) return;
    hiveEl.innerHTML = '';
    const letters = puzzle.letters;
    const central = puzzle.central;
    // positions
    const posClasses = [
      'pos-center',
      'pos-top',
      'pos-top-right',
      'pos-bottom-right',
      'pos-bottom',
      'pos-bottom-left',
      'pos-top-left',
    ];
    // central at center
    // shuffle outer letters for display but keep central fixed
    const outers = letters.filter(l => normalize(l) !== normalize(central));
    const shuffledOuters = shuffle(outers);
    const ordered = [central, ...shuffledOuters];
    // map to positions: 0=center, 1=top, 2=top-right, 3=bottom-right,4=bottom,5=bottom-left,6=top-left
    ordered.forEach((ch, idx) => {
      const div = document.createElement('button');
      div.className = 'blov-hex' + (idx === 0 ? ' central' : '') + ' ' + posClasses[idx];
      div.textContent = ch;
      div.dataset.letter = ch;
      div.addEventListener('click', () => addLetter(ch));
      hiveEl.appendChild(div);
    });
  }

  function addLetter(ch) {
    if (currentInput.length >= 12) return;
    currentInput += ch;
    updateUI();
    sounds.play('click');
  }

  function deleteLetter() {
    if (!currentInput) return;
    currentInput = currentInput.slice(0, -1);
    updateUI();
    sounds.play('click');
  }

  function clearInput() {
    currentInput = '';
    updateUI();
  }

  function handleSubmit() {
    const w = normalize(currentInput);
    if (w.length < minLen) {
      showMessage('Prekratko (min ' + minLen + ')', 'error');
      sounds.play('error');
      // shake
      const disp = document.getElementById('blov-input');
      if (disp) {
        disp.classList.add('shake');
        setTimeout(() => disp.classList.remove('shake'), 400);
      }
      return;
    }
    if (!w.includes(normalize(puzzle.central))) {
      showMessage('Brez osrednje črke ' + puzzle.central, 'error');
      sounds.play('error');
      return;
    }
    // check allowed letters
    const allowed = new Set(puzzle.letters.map(l => normalize(l)));
    for (const ch of w) {
      if (!allowed.has(ch)) {
        showMessage('Nedovoljena črka ' + ch, 'error');
        sounds.play('error');
        return;
      }
    }
    if (!DICT_SET.has(w)) {
      showMessage('Ni v slovarju', 'error');
      sounds.play('error');
      return;
    }
    if (foundSet.has(w)) {
      showMessage('Že najdeno', 'info');
      sounds.play('error');
      return;
    }
    // correct
    const isPangram =
      new Set(w.split('')).size === 7 && puzzle.letters.every(l => w.includes(normalize(l)));
    const pts = scoreWord(w, isPangram);
    foundSet.add(w);
    totalScore += pts;
    clearInput();
    showMessage(isPangram ? 'Pangram! +' + pts + ' ★' : ' +' + pts + ' točk', 'success');
    sounds.play(isPangram ? 'victory' : 'correct');
    if (isPangram) showConfetti({ count: 18 });
    updateUI();
    saveState();
    // check if all found? show end if genius?
    if (foundSet.size === sortedSolutions.length) {
      setTimeout(finishGame, 600);
    }
  }

  function handleHint() {
    const missing = sortedSolutions.filter(w => !foundSet.has(normalize(w)));
    if (missing.length === 0) {
      showMessage('Vse najdeno! 🎉', 'success');
      return;
    }
    const hint = missing[Math.floor(Math.random() * missing.length)];
    showMessage(
      'Namig: ' + hint[0] + '·'.repeat(hint.length - 1) + ' (' + hint.length + ')',
      'info'
    );
    sounds.play('click');
  }

  function handleShuffle() {
    buildHive();
    sounds.play('click');
    showMessage('Premešano 🔀', 'info');
  }

  function finishGame() {
    const total = sortedSolutions.length;
    const pangramFound = Array.from(foundSet).filter(
      w => new Set(normalize(w).split('')).size === 7
    ).length;
    const totalPang = puzzle.pangrams.length;
    document.getElementById('blov-final-count').textContent = String(foundSet.size);
    document.getElementById('blov-final-total').textContent = String(total);
    document.getElementById('blov-final-score').textContent = String(totalScore) + ' / ' + maxScore;
    document.getElementById('blov-final-pangram').textContent = pangramFound + ' / ' + totalPang;
    const missEl = document.getElementById('blov-missing');
    if (missEl) {
      const missing = sortedSolutions.filter(w => !foundSet.has(normalize(w))).slice(0, 60);
      missEl.innerHTML = missing.length
        ? '<strong>Manjkajoče (do 60):</strong><br>' + missing.join(', ')
        : 'Vse besede najdene! Genij!';
    }
    // stats
    const pct = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
    statsManager.addXp(Math.round(totalScore / 2) + (pct >= 70 ? 30 : 0));
    statsManager.saveRecord('besedolov', {
      found: foundSet.size,
      total,
      score: totalScore,
      maxScore,
      pct,
      pangram: pangramFound,
      mode,
    });
    showLayer(endScreen);
  }

  function getMaxScore() {
    return sortedSolutions.reduce((sum, w) => {
      const isPang =
        new Set(normalize(w).split('')).size === 7 &&
        puzzle.letters.every(l => normalize(w).includes(normalize(l)));
      return sum + scoreWord(w, isPang);
    }, 0);
  }

  function startNewGame() {
    readSettings();
    const seed = mode === 'daily' ? todayStr() : null;
    puzzle = generatePuzzle(seed);
    sortedSolutions = puzzle.solutions
      .map(w => normalize(w))
      .sort((a, b) => b.length - a.length || a.localeCompare(b));
    maxScore = getMaxScore();
    foundSet.clear();
    currentInput = '';
    totalScore = 0;
    // try restore state for daily if same puzzle
    if (mode === 'daily') {
      try {
        const raw = localStorage.getItem('besedolov_state');
        if (raw) {
          const st = JSON.parse(raw);
          if (
            st.date === todayStr() &&
            st.central === puzzle.central &&
            st.letters.join(',') === puzzle.letters.join(',')
          ) {
            foundSet = new Set(st.found || []);
            totalScore = st.score || 0;
          }
        }
      } catch {}
    }
    buildHive();
    updateUI();
    showMessage(
      'Satovje: ' + puzzle.letters.join(' · ') + ' (osrednja ' + puzzle.central + ')',
      'info'
    );
  }

  function saveState() {
    if (mode !== 'daily' || !puzzle) return;
    try {
      localStorage.setItem(
        'besedolov_state',
        JSON.stringify({
          date: todayStr(),
          letters: puzzle.letters,
          central: puzzle.central,
          found: Array.from(foundSet),
          score: totalScore,
        })
      );
    } catch {}
  }

  function handleShare() {
    const pct = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
    let text =
      'Besedolov ' +
      (mode === 'daily' ? todayStr() : 'naključno') +
      ' – ' +
      totalScore +
      ' točk (' +
      foundSet.size +
      '/' +
      sortedSolutions.length +
      ', ' +
      pct +
      '%)\n';
    text += 'Črke: ' + puzzle.letters.join('') + ' (osrednja ' + puzzle.central + ')\n';
    text += new URL('#game/besedolov', window.location.href).href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Rezultat kopiran 📋', { type: 'success' }))
        .catch(() => showToast(text, { type: 'info', timeout: 5000 }));
    } else showToast(text, { type: 'info', timeout: 5000 });
  }

  // physical keyboard
  function onKey(e) {
    if (playScreen.classList.contains('hidden') && !endScreen.classList.contains('hidden')) {
      if (e.key === 'Enter') {
        startNewGame();
        showLayer(playScreen);
      }
      return;
    }
    if (playScreen.classList.contains('hidden')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      deleteLetter();
    } else if (e.key === 'Escape') {
      clearInput();
    } else if (/^[a-zA-ZčšžČŠŽ]$/.test(e.key) && e.key.length === 1) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      const up = e.key.toUpperCase();
      // only allow allowed letters
      if (puzzle && puzzle.letters.map(l => normalize(l)).includes(normalize(up))) {
        addLetter(up);
      } else {
        // still add but will error on submit
        addLetter(up);
      }
    }
  }

  document.addEventListener('keydown', onKey);
  document.getElementById('blov-start-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('blov-shuffle-btn')?.addEventListener('click', handleShuffle);
  document.getElementById('blov-delete-btn')?.addEventListener('click', deleteLetter);
  document.getElementById('blov-submit-btn')?.addEventListener('click', handleSubmit);
  document.getElementById('blov-hint-btn')?.addEventListener('click', handleHint);
  document.getElementById('blov-retry-btn')?.addEventListener('click', () => {
    startNewGame();
    showLayer(playScreen);
  });
  document.getElementById('blov-share-btn')?.addEventListener('click', handleShare);
  document.getElementById('blov-back-to-list')?.addEventListener('click', () => {
    window.location.hash = '#game-list';
  });

  // also click on found to remove? not needed

  startNewGame();
  showLayer(startScreen);

  return () => {
    document.removeEventListener('keydown', onKey);
  };
}
