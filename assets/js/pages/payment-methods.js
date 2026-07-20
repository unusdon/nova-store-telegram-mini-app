/**
 * Nova Kit — Payment Methods (faithful replica of the original payment page)
 * Default banner, saved-card rows, digital wallets (connect/enable), and an add-card sheet.
 * Cards are stored locally for the demo — never store real card data client-side in production.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const screen = document.getElementById('screen');
const key = `${NS}:cards`;
let cards = JSON.parse(localStorage.getItem(key) || '[]');
const wallets = JSON.parse(localStorage.getItem(`${NS}:wallets`) || '{"paypal":false,"apple":false,"google":false}');
const save = () => localStorage.setItem(key, JSON.stringify(cards));
const saveW = () => localStorage.setItem(`${NS}:wallets`, JSON.stringify(wallets));

function cardRow(c) {
  return `<div class="payment-method-card${c.default ? ' default' : ''}">
    <div class="pm-brand">${c.brand === 'Visa' ? 'VISA' : c.brand === 'Mastercard' ? 'MC' : '💳'}</div>
    <div class="pm-info"><div class="pm-number">${esc(c.brand)} •••• ${esc(c.last4)}</div>
      <div class="pm-meta">Expires ${esc(c.exp)}</div></div>
    <div class="pm-actions">
      ${c.default ? '<span class="pm-default-badge">Default</span>'
        : `<button class="pm-action-btn" data-default="${c.id}" aria-label="Set default">${icon('check', { size: 16 })}</button>`}
      <button class="pm-action-btn delete" data-del="${c.id}" aria-label="Remove">${icon('trash', { size: 16 })}</button>
    </div>
  </div>`;
}

function walletItem(id, emoji, name, connectedLabel, availLabel) {
  const on = wallets[id];
  return `<div class="wallet-item">
    <div class="wallet-icon">${emoji}</div>
    <div class="wallet-info"><div class="wallet-name">${name}</div>
      <div class="wallet-status">${on ? connectedLabel : availLabel}</div></div>
    <button class="connect-btn ${on ? 'connected' : 'enabled'}" data-wallet="${id}">${on ? 'Connected' : (id === 'paypal' ? 'Connect' : 'Enable')}</button>
  </div>`;
}

function render() {
  const hasDefault = cards.some((c) => c.default);
  document.getElementById('appbar').innerHTML = `<header class="payment-header"><div class="header-top">
    <a class="back-button" href="profile.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Payment Methods</h1>
      <span class="payment-subtitle">Manage cards and payment options</span></div>
    <button class="add-button" id="addBtn" aria-label="Add">${icon('plus', { size: 24 })}</button>
  </div></header>`;
  bindThemeToggle();

  screen.innerHTML = `<div class="payment-content">
    ${cards.length && !hasDefault ? `<div class="default-payment-banner"><div class="banner-icon">💳</div>
      <div class="banner-text"><strong>Set a default payment method</strong> for faster checkout</div></div>` : ''}
    ${cards.length ? `<div class="payment-methods-list">${cards.map(cardRow).join('')}</div>`
      : `<div class="empty-payments"><div class="empty-icon">💳</div>
          <h3 class="empty-title">No payment methods added</h3><p>Add a credit card or connect a digital wallet.</p>
          <button class="add-payment-btn" id="addFirst">Add Payment Method</button></div>`}

    <div class="digital-wallets-section"><h3 class="section-title">Digital Wallets</h3>
      <div class="wallet-options">
        ${walletItem('paypal', '🅿️', 'PayPal', 'Connected', 'Not connected')}
        ${walletItem('apple', '', 'Apple Pay', 'Enabled', 'Available')}
        ${walletItem('google', 'G', 'Google Pay', 'Enabled', 'Available')}
      </div>
    </div>
  </div>`;

  wire();
}

function wire() {
  document.getElementById('addBtn').addEventListener('click', addCard);
  document.getElementById('addFirst')?.addEventListener('click', addCard);
  screen.querySelectorAll('[data-default]').forEach((b) => b.addEventListener('click', () => {
    cards = cards.map((c) => ({ ...c, default: c.id === b.dataset.default })); save(); haptic('selection'); render();
  }));
  screen.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await confirm('Remove this card?')) { cards = cards.filter((c) => c.id !== b.dataset.del); save(); toast('Card removed'); render(); }
  }));
  screen.querySelectorAll('[data-wallet]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.wallet; wallets[id] = !wallets[id]; saveW(); haptic('success');
    toast(`${id === 'paypal' ? 'PayPal' : id === 'apple' ? 'Apple Pay' : 'Google Pay'} ${wallets[id] ? 'connected' : 'disconnected'}`); render();
  }));
}

function addCard() {
  const form = `
    <div class="payment-type-tabs"><button class="payment-tab active">Credit/Debit Card</button><button class="payment-tab">Bank Account</button></div>
    <div class="field"><label class="field__label">Card Number *</label><input class="input" id="c_num" inputmode="numeric" placeholder="1234 5678 9012 3456" maxlength="19"></div>
    <div class="form-grid">
      <div class="field"><label class="field__label">Expiry *</label><input class="input" id="c_exp" placeholder="MM/YY" maxlength="5"></div>
      <div class="field"><label class="field__label">CVC *</label><input class="input" id="c_cvc" inputmode="numeric" placeholder="123" maxlength="4"></div>
    </div>
    <div class="field"><label class="field__label">Name on card</label><input class="input" id="c_name" placeholder="Full name"></div>
    <label class="checkbox-container" style="margin-bottom:16px"><input type="checkbox" id="c_default" ${cards.length === 0 ? 'checked' : ''}>
      <span class="checkmark"></span><span class="checkbox-text">Set as default payment method</span></label>
    <button class="btn btn--block" id="c_save">Save Card</button>`;
  const sheet = bottomSheet({ title: 'Add Payment Method', content: form });
  sheet.el.querySelector('#c_save').addEventListener('click', () => {
    const num = sheet.el.querySelector('#c_num').value.replace(/\s/g, '');
    const exp = sheet.el.querySelector('#c_exp').value.trim();
    if (num.length < 12 || !exp) { toast('Enter a valid card', { kind: 'danger' }); haptic('error'); return; }
    const brand = num.startsWith('4') ? 'Visa' : num.startsWith('5') ? 'Mastercard' : 'Card';
    const makeDefault = sheet.el.querySelector('#c_default').checked;
    if (makeDefault) cards = cards.map((c) => ({ ...c, default: false }));
    cards.push({ id: 'card-' + Date.now().toString(36), brand, last4: num.slice(-4), exp, default: makeDefault || cards.length === 0 });
    save(); haptic('success'); sheet.close(); toast('Card added', { kind: 'success' }); render();
  });
}

render();
