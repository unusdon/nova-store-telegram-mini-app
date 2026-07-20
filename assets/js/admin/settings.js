/**
 * Nova Kit — Admin store settings
 * Store profile, currency, tax & shipping, appearance (Black/White), and a read-only view of
 * the feature flags. In this demo the values come from `config.js` and save shows a toast —
 * wire `save()` to your backend (or write back to a settings store) to persist changes.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { applyTheme, setColorScheme, savedColorScheme } from '../core/theme.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

adminBootstrap();

const screen = document.getElementById('screen');

function field(label, id, value, type = 'text', attrs = '') {
  return `<div class="field"><label class="field__label" for="${id}">${label}</label>
    <input class="input" id="${id}" type="${type}" value="${esc(value)}" ${attrs}></div>`;
}

function flagRow(key, on) {
  return `<div class="list-row">
    <span class="list-row__text"><span class="list-row__title">${key}</span></span>
    <label class="switch"><input type="checkbox" data-flag="${key}" ${on ? 'checked' : ''}>
      <span class="switch__track"></span></label>
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Store settings', back: 'index.html', menu: false });
  const scheme = savedColorScheme();

  screen.innerHTML = `
    <div class="admin-section-title">Store profile</div>
    <div class="container">
      ${field('Store name', 's_name', config.brand.name)}
      ${field('Tagline', 's_tagline', config.brand.tagline)}
      ${field('Support URL', 's_support', config.brand.supportUrl || '')}
    </div>

    <div class="admin-section-title">Appearance</div>
    <div class="card card--pad">
      <div class="segmented" id="themeSeg">
        <button data-scheme="light" class="${scheme === 'light' ? 'is-active' : ''}">☀️ Light</button>
        <button data-scheme="dark" class="${scheme === 'dark' ? 'is-active' : ''}">🌙 Dark</button>
        <button data-scheme="auto" class="${scheme === 'auto' ? 'is-active' : ''}">Auto</button>
      </div>
    </div>

    <div class="admin-section-title">Currency &amp; tax</div>
    <div class="container">
      <div class="form-grid">
        ${field('Currency code', 's_ccode', config.currency.code)}
        ${field('Symbol', 's_symbol', config.currency.symbol)}
      </div>
      <div class="form-grid">
        ${field('Tax rate (%)', 's_tax', config.commerce.taxRate * 100, 'number', 'min="0" step="0.1"')}
        ${field('Flat shipping', 's_ship', config.commerce.shippingFlat, 'number', 'min="0" step="0.01"')}
      </div>
      ${field('Free shipping over', 's_freeship', config.commerce.freeShippingThreshold, 'number', 'min="0" step="1"')}
    </div>

    <div class="admin-section-title">Features</div>
    <div class="list">
      ${Object.entries(config.features).map(([k, v]) => flagRow(k, v)).join('')}
    </div>
    <p class="muted text-sm container" style="padding-block:12px">
      ${icon('info', { size: 14 })} Enable or disable storefront features here. In this demo,
      changes preview only — connect your backend to save them permanently.
    </p>
  `;

  document.getElementById('bottombar').innerHTML =
    `<div class="bottom-bar"><button class="btn btn--block" id="saveBtn">Save settings</button></div>`;

  wire();
  bindAdminChrome();
}

function wire() {
  bindThemeToggle();
  screen.querySelectorAll('[data-scheme]').forEach((b) => b.addEventListener('click', () => {
    setColorScheme(b.dataset.scheme); applyTheme(); haptic('selection'); render();
  }));
  document.getElementById('saveBtn').addEventListener('click', () => {
    haptic('success'); toast('Settings saved (demo)', { kind: 'success' });
  });
}

render();
