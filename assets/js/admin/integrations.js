/**
 * Nova Kit — Admin integrations
 * Connect/disconnect third-party services (payments, marketing, automation, Telegram).
 * Connection state persists locally for the demo — wire to your backend/OAuth in production.
 */
import { config } from '../config.js';
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const key = `${config.data.persistNamespace}:integrations`;
const state = JSON.parse(localStorage.getItem(key) || '{}');
const save = () => localStorage.setItem(key, JSON.stringify(state));

const GROUPS = [
  { title: 'Payments', items: [
    { id: 'stripe', emoji: '💳', name: 'Stripe', desc: 'Cards, wallets & subscriptions' },
    { id: 'paypal', emoji: '🅿️', name: 'PayPal', desc: 'PayPal & Pay Later' },
    { id: 'crypto', emoji: '🪙', name: 'Crypto Gateway', desc: 'BTC, ETH, USDT payments' },
  ] },
  { title: 'Marketing & Analytics', items: [
    { id: 'ga', emoji: '📈', name: 'Google Analytics', desc: 'Track traffic & conversions' },
    { id: 'mailchimp', emoji: '📧', name: 'Mailchimp', desc: 'Email campaigns & lists' },
    { id: 'meta', emoji: '📘', name: 'Meta Pixel', desc: 'Facebook & Instagram ads' },
  ] },
  { title: 'Automation', items: [
    { id: 'webhooks', emoji: '🔗', name: 'Webhooks', desc: 'POST order events to your URL' },
    { id: 'zapier', emoji: '⚡', name: 'Zapier', desc: 'Connect 5,000+ apps' },
  ] },
  { title: 'Messaging', items: [
    { id: 'bot', emoji: '🤖', name: 'Telegram Bot', desc: 'Order alerts & broadcasts' },
  ] },
];

function itemRow(it) {
  const on = Boolean(state[it.id]);
  return `<div class="integration-item">
    <span class="integration-icon">${it.emoji}</span>
    <span class="integration-info"><span class="integration-name">${esc(it.name)}
      ${on ? '<span class="status status--delivered" style="margin-inline-start:6px">Connected</span>' : ''}</span>
      <span class="integration-desc">${esc(it.desc)}</span></span>
    <button class="connect-btn ${on ? 'connected' : 'enabled'}" data-int="${it.id}">${on ? 'Disconnect' : 'Connect'}</button>
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Integrations', back: 'index.html', menu: false });
  const connected = Object.values(state).filter(Boolean).length;
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('plug', { size: 18 })}</span>Connected</span>
        <span class="kpi__value">${connected}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('check', { size: 18 })}</span>Available</span>
        <span class="kpi__value">${GROUPS.reduce((n, g) => n + g.items.length, 0)}</span></div>
    </div>
    ${GROUPS.map((g) => `<div class="admin-section-title">${g.title}</div>
      <div class="integration-list">${g.items.map(itemRow).join('')}</div>`).join('')}`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  screen.querySelectorAll('[data-int]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.int; state[id] = !state[id]; save(); haptic(state[id] ? 'success' : 'medium');
    const name = GROUPS.flatMap((g) => g.items).find((x) => x.id === id).name;
    toast(`${name} ${state[id] ? 'connected' : 'disconnected'}`, { kind: state[id] ? 'success' : 'default' });
    render();
  }));
}

render();
