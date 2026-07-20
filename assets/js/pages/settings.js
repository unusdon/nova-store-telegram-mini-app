/**
 * Nova Kit — Settings
 * Appearance (Black/White/Auto), language, currency, and notification preferences —
 * everything a shopper can personalise. All choices persist and apply immediately.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t, availableLocales, getLocale, setLocale, applyDocumentDirection } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { applyTheme, setColorScheme, savedColorScheme } from '../core/theme.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { appBar, tabBar } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const screen = document.getElementById('screen');
const prefsKey = `${NS}:prefs`;
const prefs = JSON.parse(localStorage.getItem(prefsKey) || '{}');

function render() {
  document.getElementById('appbar').innerHTML = appBar({ title: t('profile.settings'), back: 'profile.html' });

  const scheme = savedColorScheme();
  const themeControl = config.theme.allowUserToggle ? `
    <div class="settings-group">
      <div class="settings-group__label">Appearance</div>
      <div class="card card--pad">
        <div class="segmented" id="themeSeg">
          <button data-scheme="light" class="${scheme === 'light' ? 'is-active' : ''}">☀️ Light</button>
          <button data-scheme="dark" class="${scheme === 'dark' ? 'is-active' : ''}">🌙 Dark</button>
          <button data-scheme="auto" class="${scheme === 'auto' ? 'is-active' : ''}">Auto</button>
        </div>
      </div>
    </div>` : '';

  const langControl = config.features.languageSwitcher ? `
    <div class="settings-group">
      <div class="settings-group__label">${t('profile.language')}</div>
      <div class="list">
        ${availableLocales().map((l) => `
          <button class="list-row" data-locale="${l.code}">
            <span class="list-row__icon">${icon('globe', { size: 20 })}</span>
            <span class="list-row__text"><span class="list-row__title">${esc(l.name)}</span></span>
            ${getLocale() === l.code ? icon('check', { size: 20, cls: 'text-accent' }) : ''}
          </button>`).join('')}
      </div>
    </div>` : '';

  const CURRENCY_NAMES = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', NGN: 'Nigerian Naira',
    INR: 'Indian Rupee', JPY: 'Japanese Yen', CAD: 'Canadian Dollar', AUD: 'Australian Dollar', BRL: 'Brazilian Real' };
  const currencyName = CURRENCY_NAMES[config.currency.code] || config.currency.code;
  const currencyRow = `
    <div class="settings-group">
      <div class="settings-group__label">Currency</div>
      <div class="list"><div class="list-row">
        <span class="list-row__icon">${icon('tag', { size: 20 })}</span>
        <span class="list-row__text"><span class="list-row__title">${currencyName}</span>
          <span class="list-row__sub">${config.currency.code} · ${config.currency.symbol}</span></span>
      </div></div>
    </div>`;

  const notifRow = config.features.notifications ? toggleRow(
    'notifications', '🔔 Order notifications', prefs.notifications !== false) : '';
  const emailRow = toggleRow('marketing', '📣 Promotions & offers', Boolean(prefs.marketing));

  screen.innerHTML = `
    ${themeControl}
    ${langControl}
    ${currencyRow}
    <div class="settings-group">
      <div class="settings-group__label">Notifications</div>
      <div class="list">${notifRow}${emailRow}</div>
    </div>`;

  document.getElementById('tabbar').innerHTML = tabBar('profile');
  wire();
}

function toggleRow(key, label, checked) {
  return `<div class="list-row">
    <span class="list-row__text"><span class="list-row__title">${label}</span></span>
    <label class="switch"><input type="checkbox" data-pref="${key}" ${checked ? 'checked' : ''}>
      <span class="switch__track"></span></label>
  </div>`;
}

function wire() {
  screen.querySelectorAll('[data-scheme]').forEach((b) => b.addEventListener('click', () => {
    setColorScheme(b.dataset.scheme);
    applyTheme();
    haptic('selection');
    render();
  }));
  screen.querySelectorAll('[data-locale]').forEach((b) => b.addEventListener('click', () => {
    setLocale(b.dataset.locale);
    applyDocumentDirection();
    haptic('selection');
    toast('Language updated', { kind: 'success' });
    render();
  }));
  screen.querySelectorAll('[data-pref]').forEach((c) => c.addEventListener('change', () => {
    prefs[c.dataset.pref] = c.checked;
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }));
}

render();
