/**
 * data.js — dane węzłów + localStorage helpers
 */
const BASE_DATA = [
  { id: 'klasyczna', label: 'KLASYCZNA\nDZIWKA', x: 600, y: 400, color: '#ff6b9d', type: 'core', category: 'pink', shape: 'rect', desc: 'Nieszkodliwa, puszczająca się dziwka, która jest dziwką dlatego, że się puszcza.', tag: '🌸 Klasa Główna', connects: ['fajna','chyba','mobilna','ksiazkowa','ex','klasyczna-glupia'] },
  { id: 'glupia', label: 'GŁUPIA\nDZIWKA', x: 1050, y: 400, color: '#4ecdc4', type: 'core', category: 'green', shape: 'rect', desc: 'Dziwką jest dlatego, że po prostu wkurwia.', tag: '🟢 Klasa Główna', connects: ['pol-dziwka','brzydka','randomowa','dziwka-z-pracy','klasyczna-glupia'] },
  { id: 'klasyczna-glupia', label: 'KLASYCZNA GŁUPIA\nDZIWKA\n(CAŁKOWITA)', x: 825, y: 560, color: '#a29bfe', type: 'core', category: 'purple', shape: 'rect', desc: 'Połączenie klasycznej i głupiej — najwyższa forma dziwectwa.', tag: '💜 Hybryda / Klasa Specjalna', connects: ['klasyczna','glupia'] },
  { id: 'fajna', label: 'FAJNA\nDZIWKA', x: 280, y: 200, color: '#ff6b9d', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Może i jest dziwką, ale ją lubię.', tag: '🌸 Klasyczne', connects: ['klasyczna'] },
  { id: 'chyba', label: 'CHYBA\nDZIWKA', x: 280, y: 340, color: '#ff6b9d', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Nie znasz jej, ale słyszałeś, że jest dziwką lub wygląda jak dziwka.', tag: '🌸 Klasyczne', connects: ['klasyczna'] },
  { id: 'mobilna', label: 'MOBILNA\nDZIWKA', x: 340, y: 480, color: '#ff6b9d', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Klasyczna dziwka wysyłana w teren.', tag: '🌸 Klasyczne', connects: ['klasyczna'] },
  { id: 'tania', label: 'TANIA\nDZIWKA', x: 200, y: 100, color: '#ff9fb3', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Się tanio sprzedaje, to jest dziwką.', tag: '🌸 Klasyczne', connects: ['fajna'] },
  { id: 'ksiazkowa', label: 'KSIĄŻKOWA\nDZIWKA', x: 500, y: 220, color: '#ff6b9d', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Tradycyjna, ruchająca się dla korzyści dziwka.', tag: '🌸 Klasyczne', connects: ['klasyczna','burdelowa'] },
  { id: 'burdelowa', label: 'DZIWKA\nBURDELOWA', x: 440, y: 100, color: '#ff6b9d', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Książkowa dziwka, która jest striptizerką lub burdel-mamą.', tag: '🌸 Klasyczne', connects: ['ksiazkowa'] },
  { id: 'ex', label: 'EX\nDZIWKA', x: 580, y: 230, color: '#d63da8', type: 'leaf', category: 'pink', shape: 'bubble', desc: 'Była dziwką, ale już nie jest.', tag: '🌸 Klasyczne', connects: ['klasyczna'] },
  { id: 'pol-dziwka', label: 'PÓŁ-DZIWKA', x: 1100, y: 220, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Raz wkurwia, raz nie — w zależności od humoru.', tag: '🟢 Charakterologiczne', connects: ['glupia'] },
  { id: 'brzydka', label: 'BRZYDKA\nDZIWKA', x: 1250, y: 280, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Dziwką jest dlatego, że jest brzydka i to wkurwia.', tag: '🟢 Charakterologiczne', connects: ['glupia'] },
  { id: 'randomowa', label: 'TA\nDZIWKA', x: 1300, y: 400, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Pojawia się w losowej sytuacji i swoim zachowaniem pokazuje, że jest dziwką.', tag: '🟢 Charakterologiczne', connects: ['glupia'] },
  { id: 'skryta', label: 'SKRYTA\nDZIWKA', x: 1300, y: 520, color: '#55efc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Sprawia wrażenie nie-dziwki, ale okazuje się być dziwką.', tag: '🟢 Charakterologiczne', connects: ['randomowa'] },
  { id: 'multi', label: 'MULTI-\nDZIWKA', x: 700, y: 700, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Ma cechy kilku rodzajów dziwek jednocześnie.', tag: '🟢 Charakterologiczne', connects: ['klasyczna-glupia'] },
  { id: 'niewdzieczna', label: 'DZIWKA\nNIEWDZIĘCZNA', x: 830, y: 720, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Coś się dla niej robi, a ta dziwka nie docenia.', tag: '🟢 Charakterologiczne', connects: ['multi'] },
  { id: 'natretna', label: 'NATRĘTNA\nDZIWKA', x: 950, y: 710, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Męczy Cię i gada, a ty jej nie lubisz.', tag: '🟢 Charakterologiczne', connects: ['klasyczna-glupia'] },
  { id: 'materialna', label: 'MATERIALNA\nDZIWKA', x: 1100, y: 650, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Obiera taką stronę, jaka jej się teraz opłaca.', tag: '🟢 Charakterologiczne', connects: ['glupia','randomowa'] },
  { id: 'te-dziwki', label: 'TE\nDZIWKI', x: 1230, y: 600, color: '#4ecdc4', type: 'leaf', category: 'green', shape: 'bubble', desc: 'Ogólne określenie na grupy ze studiów.', tag: '🟢 Charakterologiczne', connects: ['randomowa'] },
  { id: 'dziwki-ex', label: 'DZIWKI\nTWOJEGO EX', x: 960, y: 560, color: '#a29bfe', type: 'leaf', category: 'purple', shape: 'bubble', desc: 'Wszystkie byłe, niedoszłe i przyszłe partnerki Twoich partnerów.', tag: '💜 Hybrydowe', connects: ['klasyczna-glupia'] },
  { id: 'dziwka-z-pracy', label: 'DZIWKA\nZ PRACY', x: 1100, y: 850, color: '#ff9f43', type: 'branch', category: 'orange', shape: 'rect', desc: 'Pracujecie razem i wkurwia, dlatego jest dziwką.', tag: '🟠 Z Pracy', connects: ['glupia','mailowa','przeloz','neutralna','marudna','stara','problematyczna','koordynatorka','lodowa','wokalizujaca'] },
  { id: 'mailowa', label: 'DZIWKA\nMAILOWA', x: 830, y: 940, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Oznacza dyrektorów w DW kiedy się pomylisz.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy','korpo'] },
  { id: 'korpo', label: 'KORPO\nDZIWKA', x: 680, y: 960, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Dodaje wszystkich dyrektorów w DW, jak jej nie odpiszesz na maila.', tag: '🟠 Z Pracy', connects: ['mailowa'] },
  { id: 'przeloz', label: 'DZIWKA\nPRZEŁOŻONA', x: 960, y: 970, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Jest dziwką, bo jest Twoją przełożoną.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'neutralna', label: 'DZIWKA\nNEUTRALNA', x: 1100, y: 1010, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Nigdy nie stanie w Twojej obronie w pracy.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'marudna', label: 'DZIWKA\nMARUDNA', x: 1260, y: 980, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Cokolwiek nie zaproponujesz, to jej się nie podoba.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'stara', label: 'DZIWKA\nBABONA', x: 1380, y: 900, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Jest dziwką, bo jest starą babą gadającą o swoich dzieciach.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'problematyczna', label: 'DZIWKA\nPROBLEMATYCZNA', x: 1380, y: 780, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Dopierdala się o wszystko, dlatego jest dziwką.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'koordynatorka', label: 'DZIWKA\nKOORDYNATORKA', x: 880, y: 1080, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Samozwańczo przydziela Ci zadania, a sobie samej rolę koordynatorki.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'lodowa', label: 'DZIWKA\nLODÓWA', x: 700, y: 1080, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Robi loda szefostwu częściej niż rzeczywiście pracuje.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'wokalizujaca', label: 'DZIWKA\nWOKALIZUJĄCA', x: 540, y: 1040, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Drze ryja w pracy i wkurwia.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'strategiczna', label: 'STRATEGICZNA\nDZIWKA', x: 700, y: 830, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Musisz mieć z nią kontakt, chociaż nie chcesz.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
  { id: 'ofiarna', label: 'DZIWKA\nOFIARNA', x: 560, y: 880, color: '#ff9f43', type: 'leaf', category: 'orange', shape: 'bubble', desc: 'Ciągle robi z siebie ofiarę, dlatego jest dziwką.', tag: '🟠 Z Pracy', connects: ['dziwka-z-pracy'] },
];

const LS_KEY = 'dziwki_local_v2';
function getLocalNodes() { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
function saveLocalNodes(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
function isLocalNode(id) { return getLocalNodes().some(n => n.id === id); }

async function loadData() {
  const local = getLocalNodes();
  let base;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('fetch failed');
    base = await res.json();
  } catch {
    base = BASE_DATA;
  }
  const baseIds = new Set(base.map(n => n.id));
  const extraLocal = local.filter(n => !baseIds.has(n.id));
  return [...base, ...extraLocal];
}
