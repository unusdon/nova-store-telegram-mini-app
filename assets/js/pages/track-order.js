/**
 * Nova Kit — Track Order (guest lookup by order number)
 * Enter an order number to see its status + tracking timeline, without signing in.
 * Looks up local orders; wire to your API for real guest tracking.
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const FLOW = ['pending', 'paid', 'shipped', 'delivered'];
const STATUS = {
  pending: '⏳ Pending', paid: '📦 Confirmed', shipped: '🚚 On the way',
  delivered: '✅ Delivered', cancelled: '❌ Cancelled',
};

function header() {
  return `<header class="order-view-header"><div class="header-top">
    <a class="back-button" href="index.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Track Order</h1></div>
    <span style="width:40px"></span></div></header>`;
}

function form(prefill = '') {
  return `<div class="container" style="padding-top:24px">
    <div class="track-hero">
      <div class="track-hero__icon">🔎</div>
      <h2>Track your order</h2>
      <p class="muted">Enter your order number (e.g. NV-1001) to see live status.</p>
    </div>
    <div class="field" style="margin-top:16px"><label class="field__label">Order number</label>
      <input class="input" id="num" value="${esc(prefill)}" placeholder="NV-1001" autocomplete="off"></div>
    <button class="btn btn--block" id="trackBtn">${icon('search', { size: 18 })} Track</button>
    <div id="result"></div>
  </div>`;
}

function timeline(status) {
  const reached = FLOW.indexOf(status);
  return `<div class="tracking-timeline" style="margin-top:16px">
    ${['Order Placed', 'Confirmed', 'Shipped', 'Delivered'].map((label, i) => {
      const cls = i < reached ? 'completed' : i === reached ? 'current' : '';
      return `<div class="timeline-item ${cls}"><div class="timeline-dot">${i < reached ? '✓' : i + 1}</div>
        <div class="timeline-content"><div class="timeline-title">${label}</div>
          <div class="timeline-description">${i <= reached ? 'Completed' : 'Pending'}</div></div></div>`;
    }).join('')}
  </div>`;
}

function showResult(order) {
  const box = document.getElementById('result');
  if (!order) {
    box.innerHTML = `<div class="empty-state" style="padding:32px 0"><div class="empty-state__emoji">🧐</div>
      <h3>Order not found</h3><p>Check the number and try again.</p></div>`;
    return;
  }
  const st = order.status === 'cancelled' ? 'paid' : order.status;
  box.innerHTML = `
    <div class="status-card" style="margin-top:20px">
      <div class="status-icon">${STATUS[order.status].split(' ')[0]}</div>
      <div class="status-info"><div class="status-text">${STATUS[order.status].slice(2)}</div>
        <div class="status-description">${order.number} · placed ${formatDate(order.createdAt)}</div>
        <div class="estimated-delivery">${(order.items || []).length} item(s) · ${formatPrice(order.total)}</div></div>
    </div>
    ${timeline(st)}
    <a class="btn btn--outline btn--block" style="margin-top:16px" href="order.html?id=${encodeURIComponent(order.id)}">View full details</a>`;
}

function render() {
  document.getElementById('appbar').innerHTML = header();
  bindThemeToggle();
  screen.innerHTML = form();
  wire();
}

function wire() {
  const track = () => {
    const num = document.getElementById('num').value.trim().toUpperCase();
    if (!num) { toast('Enter an order number', { kind: 'danger' }); return; }
    const order = dataService.getOrders().find((o) => (o.number || o.id).toUpperCase() === num);
    haptic(order ? 'success' : 'error');
    showResult(order || null);
  };
  document.getElementById('trackBtn').addEventListener('click', track);
  document.getElementById('num').addEventListener('keydown', (e) => { if (e.key === 'Enter') track(); });
}

render();
