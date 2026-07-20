/**
 * Nova Kit — i18n engine
 * ======================
 * Registers all locale files and exposes `t()`, `setLocale()`, `getLocale()`.
 *
 * ADDING A LANGUAGE (two steps):
 *   1. Create `locales/xx.js` (copy `en.js`, translate the values, keep the keys).
 *   2. Import it below and add it to the `locales` map, then list 'xx' in
 *      `config.locale.available` (and `config.locale.rtlLocales` if it is RTL).
 */
import { config } from '../config.js';
import en from './locales/en.js';
import es from './locales/es.js';
import ar from './locales/ar.js';

const locales = { en, es, ar };

const STORAGE_KEY = `${config.data.persistNamespace}:locale`;

let current =
  localStorage.getItem(STORAGE_KEY) ||
  config.locale.default ||
  'en';

if (!locales[current]) current = config.locale.default || 'en';

/** Available locales for a language switcher: [{ code, name }]. */
export function availableLocales() {
  return (config.locale.available || Object.keys(locales))
    .filter((code) => locales[code])
    .map((code) => ({ code, name: locales[code].name }));
}

export function getLocale() {
  return current;
}

export function isRtl(code = current) {
  return (config.locale.rtlLocales || []).includes(code);
}

/** Switch language, persist it, and update the document direction. */
export function setLocale(code) {
  if (!locales[code]) return;
  current = code;
  localStorage.setItem(STORAGE_KEY, code);
  applyDocumentDirection();
}

export function applyDocumentDirection() {
  document.documentElement.lang = current;
  document.documentElement.dir = isRtl() ? 'rtl' : 'ltr';
}

/**
 * Translate a key with optional interpolation, e.g. t('product.reviews', { count: 12 }).
 * Falls back to the default locale, then to the key itself, so a missing string never
 * breaks the UI.
 */
export function t(key, vars) {
  const table = locales[current]?.strings || {};
  const fallback = locales[config.locale.default]?.strings || {};
  let str = table[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

export default { t, setLocale, getLocale, isRtl, availableLocales, applyDocumentDirection };
