/**
 * Nova Kit — Languages (faithful replica of the original languages page)
 * Current-language card, a radio list with flags, and an Apply action. Persists + sets
 * document direction (RTL-aware).
 */
import { bootstrap } from '../app.js';
import { t, availableLocales, getLocale, setLocale, applyDocumentDirection } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const META = {
  en: { flag: '🇬🇧', native: 'English', english: 'English' },
  es: { flag: '🇪🇸', native: 'Español', english: 'Spanish' },
  ar: { flag: '🇸🇦', native: 'العربية', english: 'Arabic' },
  fr: { flag: '🇫🇷', native: 'Français', english: 'French' },
  de: { flag: '🇩🇪', native: 'Deutsch', english: 'German' },
};
let selected = getLocale();

function meta(code) { return META[code] || { flag: '🌐', native: code.toUpperCase(), english: code }; }

function render() {
  const locales = availableLocales();
  const current = meta(getLocale());

  document.getElementById('appbar').innerHTML = `<header class="languages-header"><div class="header-top">
    <a class="back-button" href="profile.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">${t('profile.language')}</h1></div>
    <span style="width:40px"></span>
  </div></header>`;
  bindThemeToggle();

  screen.innerHTML = `<div class="languages-content">
    <div class="current-language-section"><div class="section-title">Current</div>
      <div class="current-language-card"><span class="language-flag">${current.flag}</span>
        <div><div class="language-name">${esc(current.native)}</div>
          <div class="language-subtitle">${esc(current.english)}</div></div>
        <span class="current-indicator">${icon('check', { size: 22 })}</span></div>
    </div>

    <div class="language-options-section"><div class="section-title">All languages</div>
      <div class="languages-list">
        ${locales.map((l) => { const m = meta(l.code); return `<div class="language-item${selected === l.code ? ' selected' : ''}" data-locale="${l.code}">
          <span class="language-flag">${m.flag}</span>
          <div class="language-details"><div class="language-name">${esc(m.native)}</div>
            <div class="language-subtitle">${esc(m.english)}</div></div>
          <span class="language-radio"></span></div>`; }).join('')}
      </div>
      <div class="apply-section">
        <button class="btn btn--block" id="applyBtn">${t('action.apply')}</button>
        <div class="apply-note">The app language updates instantly.</div>
      </div>
    </div>
  </div>`;

  screen.querySelectorAll('[data-locale]').forEach((el) => el.addEventListener('click', () => {
    selected = el.dataset.locale;
    screen.querySelectorAll('.language-item').forEach((x) => x.classList.toggle('selected', x === el));
    haptic('selection');
  }));
  document.getElementById('applyBtn').addEventListener('click', () => {
    setLocale(selected); applyDocumentDirection(); haptic('success');
    toast('Language updated', { kind: 'success' }); render();
  });
}

render();
