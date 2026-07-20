/**
 * Nova Kit — Admin payments
 * Toggle the checkout methods and hold each rail's PUBLISHABLE settings (Telegram Stars,
 * TON Connect, Stripe). Demo only — the real values live in config.js and, for anything
 * secret (Stripe secret key, bot token), on your server. Never ship secrets in the client.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const methods = (config.payments.methods || []).map((m) => ({ ...m }));
const providers = JSON.parse(JSON.stringify(config.payments.providers || {}));

const PROVIDER_LABEL = { telegramStars: 'Telegram Stars', tonConnect: 'TON Connect', stripe: 'Stripe', manual: 'Manual / COD' };

function methodRow(m) {
  return `<div class="list-row">
    <span class="list-row__icon">${m.icon}</span>
    <span class="list-row__text"><span class="list-row__title">${esc(m.label)}</span>
      <span class="list-row__sub">${PROVIDER_LABEL[m.provider] || m.provider} · ${m.enabled ? 'Active' : 'Disabled'}</span></span>
    <label class="switch"><input type="checkbox" data-pay="${m.id}" ${m.enabled ? 'checked' : ''}>
      <span class="switch__track"></span></label>
  </div>`;
}

function field(id, label, value, placeholder = '') {
  return `<div class="field"><label class="field__label">${esc(label)}</label>
    <input class="input" id="${id}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" autocomplete="off"></div>`;
}

function providerCard(id, body) {
  return `<div class="admin-section-title">${PROVIDER_LABEL[id]}</div><div class="container" style="padding-top:0">${body}</div>`;
}

function render() {
  const s = providers.telegramStars || {};
  const t = providers.tonConnect || {};
  const st = providers.stripe || {};

  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Payments', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="admin-section-title">Checkout methods</div>
    <div class="list" style="margin-top:0">${methods.map(methodRow).join('')}</div>

    ${providerCard('telegramStars',
      field('s_url', 'Create-invoice endpoint', s.createInvoiceUrl, 'https://yourapi.com/tg/invoice') +
      field('s_rate', 'Stars per 1 ' + config.currency.code, s.starsPerUnit, '50'))}

    ${providerCard('tonConnect',
      field('t_manifest', 'Manifest URL', t.manifestUrl, 'https://yourapp.com/tonconnect-manifest.json') +
      field('t_addr', 'Recipient wallet address', t.recipientAddress, 'UQ…') +
      field('t_rate', 'TON per 1 ' + config.currency.code, t.tonPerUnit, '0.25'))}

    ${providerCard('stripe',
      `<div class="field"><label class="field__label">Mode</label>
        <select class="select" id="st_mode">
          <option value="checkout" ${st.mode === 'checkout' ? 'selected' : ''}>Hosted Checkout (backend session)</option>
          <option value="paymentLink" ${st.mode === 'paymentLink' ? 'selected' : ''}>Payment Link (fixed URL)</option>
        </select></div>` +
      field('st_pk', 'Publishable key', st.publishableKey, 'pk_live_…') +
      field('st_url', 'Checkout endpoint', st.checkoutUrl, 'https://yourapi.com/stripe/checkout') +
      field('st_link', 'Payment Link URL', st.paymentLinkUrl, 'https://buy.stripe.com/…') +
      field('st_ctry', 'Supported countries (ISO, comma-sep)', (st.supportedCountries || []).join(', '), 'US, CA, GB'))}

    <div class="container" style="padding-top:0">
      <p class="muted text-sm">${icon('info', { size: 14 })} These are demo controls. Keep secret keys (Stripe secret key, bot token) on your server — the client only holds publishable values and endpoints.</p>
    </div>`;
  document.getElementById('bottombar').innerHTML =
    `<div class="bottom-bar"><button class="btn btn--block" id="save">Save payments</button></div>`;

  screen.querySelectorAll('[data-pay]').forEach((c) => c.addEventListener('change', () => {
    const m = methods.find((x) => x.id === c.dataset.pay); m.enabled = c.checked;
    toast(`${m.label} ${m.enabled ? 'enabled' : 'disabled'}`);
    c.closest('.list-row').querySelector('.list-row__sub').textContent = `${PROVIDER_LABEL[m.provider] || m.provider} · ${m.enabled ? 'Active' : 'Disabled'}`;
  }));
  document.getElementById('save').addEventListener('click', () => { haptic('success'); toast('Payments saved (demo) — persist to config.js to apply', { kind: 'success' }); });
  bindAdminChrome();
}

render();
