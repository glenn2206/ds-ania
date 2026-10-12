import { translations, type Language } from '../data/translations';

export const LANGUAGE_KEY = 'ania:language';
export const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/[’]/g, "'").toLowerCase();
const english = new Map(Object.entries(translations).map(([en, id]) => [normalizeText(en), { en, id }]));
const indonesian = new Map(Object.entries(translations).map(([en, id]) => [normalizeText(id), { en, id }]));

export function normalizeSearchQuery(value: string): string {
  const aliases: Record<string, string> = {
    'bunga matahari': 'sunflower', 'ulang tahun': 'birthday', 'hari jadi': 'anniversary', 'kotak bunga': 'bloom box',
    'mawar': 'rose', 'krisan': 'chrysanthemum', 'anyelir': 'carnation', 'hortensia': 'hydrangea', 'anggrek': 'orchid',
    'wisuda': 'graduation', 'buket': 'bouquet', 'merah': 'red', 'putih': 'white', 'kuning': 'yellow', 'biru': 'blue', 'ungu': 'purple',
  };
  let query = value.trim().toLowerCase();
  for (const [id, en] of Object.entries(aliases)) query = query.replace(new RegExp(`\\b${id}\\b`, 'g'), en);
  return query;
}

export function translateText(value: string, language: Language): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (language === 'en' && english.has(normalizeText(trimmed))) return value;
  const pair = english.get(normalizeText(trimmed)) || indonesian.get(normalizeText(trimmed));
  if (pair) {
    let translated = pair[language];
    if (trimmed === trimmed.toUpperCase()) translated = translated.toUpperCase();
    return value.replace(trimmed, translated);
  }
  const count = /^(\d+) results?$/.exec(trimmed);
  if (count) return language === 'id' ? `${count[1]} hasil` : value;
  const countId = /^(\d+) hasil$/.exec(trimmed);
  if (countId) return language === 'en' ? `${countId[1]} result${countId[1] === '1' ? '' : 's'}` : value;
  const photo = /^(Photo|Foto|Slide) (\d+)$/.exec(trimmed);
  if (photo) return `${language === 'id' ? (photo[1] === 'Slide' ? 'Slide' : 'Foto') : (photo[1] === 'Slide' ? 'Slide' : 'Photo')} ${photo[2]}`;
  const check = /^(Please check:|Periksa:) (.+)\.$/.exec(trimmed);
  if (check) return `${language === 'id' ? 'Periksa:' : 'Please check:'} ${check[2].split(', ').map((part) => translateText(part, language)).join(', ')}.`;
  const delivery = /^(Delivery:|Pengiriman:) (.+)$/.exec(trimmed);
  if (delivery) return `${language === 'id' ? 'Pengiriman:' : 'Delivery:'} ${delivery[2].replace(language === 'id' ? ' (est.)' : ' (estimasi)', language === 'id' ? ' (estimasi)' : ' (est.)')}`;
  const added = /^(Add|Tambah) (.+) (to cart|ke keranjang)$/.exec(trimmed);
  if (added) return language === 'id' ? `Tambah ${added[2]} ke keranjang` : `Add ${added[2]} to cart`;
  const wrapped = /^([✓“"]\s*)(.+?)([”"]?)$/.exec(trimmed);
  if (wrapped) return value.replace(trimmed, wrapped[1] + translateText(wrapped[2], language) + wrapped[3]);
  const title = trimmed.split(' — ANIA Flower Boutique');
  if (title.length === 2) return translateText(title[0], language) + ' — ANIA Flower Boutique';
  const unavailable = /^Produk "(.+)" tidak tersedia\.$/.exec(trimmed);
  if (unavailable && language === 'en') return `Product "${unavailable[1]}" is unavailable.`;
  const stock = /^Stok "(.+)" tidak cukup\.$/.exec(trimmed);
  if (stock && language === 'en') return `Insufficient stock for "${stock[1]}".`;
  const onRequest = /^"(.+)" harus dipesan lewat WhatsApp \(harga on request\)\.$/.exec(trimmed);
  if (onRequest && language === 'en') return `Please order "${onRequest[1]}" via WhatsApp (price on request).`;
  const order = /^Order ([A-Z0-9-]+) dibuat\. Pembayaran online belum aktif — lanjut via WhatsApp\.$/.exec(trimmed);
  if (order && language === 'en') return `Order ${order[1]} created. Online payment is not active — continue via WhatsApp.`;
  return value;
}

export function readLanguage(): Language {
  try { return localStorage.getItem(LANGUAGE_KEY) === 'id' ? 'id' : 'en'; }
  catch { return 'en'; }
}

export function initLanguage() {
  let language = readLanguage();
  const textStates = new WeakMap<Text, { source: string; output: string }>();
  const attributeStates = new WeakMap<Element, Map<string, { source: string; output: string }>>();
  let titleState = { source: document.title, output: document.title };
  const excluded = 'script,style,code,pre,textarea,[data-i18n-ignore],[data-language],.buybox__name,.cart__name,.pcard__tp > .type-h2';
  const attributes = ['placeholder', 'aria-label', 'title'];
  const observer = new MutationObserver(() => render());
  const render = () => {
    // Translate text nodes in place; never replace controls, inputs or event handlers.
    observer.disconnect();
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let next: Node | null;
    while ((next = walker.nextNode())) {
      const node = next as Text;
      if (node.parentElement?.closest(excluded)) continue;
      const previous = textStates.get(node);
      const source = previous && node.data === previous.output ? previous.source : node.data;
      const output = translateText(source, language);
      if (node.data !== output) node.data = output;
      textStates.set(node, { source, output });
    }
    for (const element of document.querySelectorAll('[placeholder],[aria-label],[title]')) {
      if (element.closest('[data-i18n-ignore],script,style')) continue;
      const states = attributeStates.get(element) || new Map();
      for (const attribute of attributes) {
        const current = element.getAttribute(attribute);
        if (current === null) continue;
        const previous = states.get(attribute);
        const source = previous && current === previous.output ? previous.source : current;
        const output = translateText(source, language);
        if (current !== output) element.setAttribute(attribute, output);
        states.set(attribute, { source, output });
      }
      attributeStates.set(element, states);
    }
    for (const button of document.querySelectorAll<HTMLElement>('[data-language]')) {
      const selected = button.dataset.language === language;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    const titleSource = document.title === titleState.output ? titleState.source : document.title;
    document.title = translateText(titleSource, language);
    titleState = { source: titleSource, output: document.title };
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  };
  document.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-language]');
    if (!button) return;
    language = button.dataset.language === 'id' ? 'id' : 'en';
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Selection still works without persistent storage. */ }
    render();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === LANGUAGE_KEY) { language = readLanguage(); render(); }
  });
  render();
}
