/**
 * Nova Kit — Admin order detail (management)
 * Status timeline, fulfilment (tracking), full totals, customer / shipping / payment cards,
 * internal notes, and actions (advance status, refund, cancel, contact, print). Real orders
 * (localStorage) persist via dataService.updateOrder; demo orders update in memory.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc, placeholder, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { dataService } from '../core/store.js';
import { getOrderById } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
const FLOW = ['pending', 'paid', 'shipped', 'delivered'];
const STEP_LABEL = { pending: 'Order placed', paid: 'Payment confirmed', shipped: 'Shipped', delivered: 'Delivered' };
let order = getOrderById(id);

const isReal = () => dataService.getOrders().some((o) => o.id === order.id);
function patch(data) {
  Object.assign(order, data);
  if (isReal()) dataService.updateOrder(order.id, data);
}
function nextStatus() {
  const i = FLOW.indexOf(order.status);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}
function setStatus(status) {
  patch({ status });
  haptic('success'); toast(`Order marked ${status}`, { kind: status === 'cancelled' ? 'danger' : 'success' });
  render();
}

function totals() {
  const items = order.items || [];
  const subtotal = order.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0);
  return { subtotal, discount: order.discount || 0, shipping: order.shipping || 0, tax: order.tax || 0, total: order.total ?? subtotal };
}

function timeline() {
  const reached = FLOW.indexOf(order.status);
  const cancelled = order.status === 'cancelled';
  return `<div class="timeline">
    ${FLOW.map((s, i) => `<div class="timeline__step ${!cancelled && i <= reached ? 'is-done' : ''}">
      <span class="timeline__dot"></span>
      <div><div class="semibold">${STEP_LABEL[s]}</div>
        <div class="muted text-sm">${!cancelled && i <= reached ? formatDate(order.createdAt) : 'Pending'}</div></div>
    </div>`).join('')}
  </div>`;
}

function render() {
  if (!order) {
    document.getElementById('appbar').innerHTML = adminHeader({ title: 'Order', back: 'orders.html', menu: false });
    screen.innerHTML = `<div class="empty-state"><div class="empty-state__emoji">🧐</div><h3>Order not found</h3></div>`;
    return;
  }
  const items = order.items || [];
  const t = totals();
  const a = order.address || {};

  document.getElementById('appbar').innerHTML = adminHeader({
    title: order.number, back: 'orders.html', menu: false,
    actions: `<button class="appbar__btn" id="moreBtn" aria-label="More">${icon('filter', { size: 22 })}</button>`,
  });

  screen.innerHTML = `
    <div class="card card--pad row-between">
      <div><div class="muted text-sm">Placed ${formatDate(order.createdAt)}</div>
        <div class="semibold" style="font-size:var(--fs-lg)">${formatPrice(t.total)}</div></div>
      <span class="status status--${order.status}">${order.status}</span>
    </div>

    <div class="quick-actions">
      <button class="quick-action" id="contactBtn"><span class="quick-action__icon">${icon('send', { size: 20 })}</span>Contact</button>
      <button class="quick-action" id="invoiceBtn"><span class="quick-action__icon">${icon('box', { size: 20 })}</span>Invoice</button>
      <button class="quick-action" id="refundBtn"><span class="quick-action__icon">${icon('card', { size: 20 })}</span>Refund</button>
      <button class="quick-action" id="cancelBtn"><span class="quick-action__icon">${icon('close', { size: 20 })}</span>Cancel</button>
    </div>

    <div class="admin-section-title">Status</div>
    <div class="card"><div style="padding:8px 16px">${timeline()}</div></div>

    <div class="admin-section-title">Fulfilment</div>
    <div class="card card--pad">
      <div class="row-between"><span class="muted text-sm">Method</span><span class="semibold">${esc(order.shippingMethod || 'Standard')}</span></div>
      <div class="row-between" style="margin-top:8px"><span class="muted text-sm">Tracking</span>
        <span class="semibold">${order.tracking ? esc(order.tracking) : '<span class="text-faint">Not added</span>'}</span></div>
      <button class="btn btn--sm btn--ghost" id="trackBtn" style="margin-top:12px">${order.tracking ? 'Update' : 'Add'} tracking</button>
    </div>

    <div class="admin-section-title">Items (${items.length})</div>
    <div class="list" style="margin-top:0">
      ${items.map((it) => `<div class="data-row">
        <img class="data-row__avatar" src="${it.image || placeholder(it.emoji || (it.type === 'digital' ? '💾' : '📦'), it.color || '#00FF88', 80, 80)}" alt="" width="40" height="40">
        <span class="data-row__main"><span class="data-row__title">${esc(it.name)}</span>
          <span class="data-row__sub">Qty ${it.qty} × ${formatPrice(it.price)}</span></span>
        <span class="semibold">${formatPrice(it.price * it.qty)}</span></div>`).join('')}
    </div>

    <div class="card"><div class="summary">
      <div class="summary__row"><span>Subtotal</span><span>${formatPrice(t.subtotal)}</span></div>
      ${t.discount ? `<div class="summary__row summary__row--discount"><span>Discount</span><span>-${formatPrice(t.discount)}</span></div>` : ''}
      <div class="summary__row"><span>Shipping</span><span>${t.shipping ? formatPrice(t.shipping) : 'Free'}</span></div>
      <div class="summary__row"><span>Tax</span><span>${formatPrice(t.tax)}</span></div>
      <div class="summary__row summary__row--total"><span>Total</span><span>${formatPrice(t.total)}</span></div>
    </div></div>

    <div class="admin-section-title">Customer</div>
    <div class="card card--pad">
      <div class="semibold">${esc(a.name || order.customer || 'Guest')}</div>
      ${a.phone ? `<div class="muted text-sm">${esc(a.phone)}</div>` : ''}
    </div>

    ${a.line1 ? `<div class="admin-section-title">Shipping address</div>
    <div class="card card--pad"><div class="muted text-sm" style="line-height:1.6">
      ${[a.line1, a.line2, [a.city, a.region].filter(Boolean).join(', '), a.postal, a.country].filter(Boolean).map(esc).join('<br>')}
    </div></div>` : ''}

    <div class="admin-section-title">Payment</div>
    <div class="card card--pad row-between">
      <span class="row gap-2">💳 ${esc(order.paymentMethod || 'Card')}</span>
      <span class="status status--${order.status === 'cancelled' ? 'cancelled' : 'delivered'}">${order.status === 'cancelled' ? 'Refunded' : 'Paid'}</span>
    </div>

    <div class="admin-section-title">Internal note</div>
    <div class="container">
      <textarea class="textarea" id="note" placeholder="Add a private note for your team…">${esc(order.adminNote || '')}</textarea>
      <button class="btn btn--sm btn--ghost" id="saveNote" style="margin-top:8px">Save note</button>
    </div>
    <div style="height:8px"></div>`;

  const next = nextStatus();
  document.getElementById('bottombar').innerHTML = `<div class="bottom-bar">
    <button class="btn btn--outline" id="statusBtn">Set status</button>
    ${next ? `<button class="btn grow" id="advanceBtn">Mark ${next}</button>` : '<button class="btn grow" disabled>Completed</button>'}
  </div>`;

  wire(next);
  bindAdminChrome();
}

function wire(next) {
  document.getElementById('advanceBtn')?.addEventListener('click', () => setStatus(next));
  document.getElementById('statusBtn').addEventListener('click', openStatusSheet);
  document.getElementById('moreBtn').addEventListener('click', openStatusSheet);
  document.getElementById('trackBtn').addEventListener('click', editTracking);
  document.getElementById('contactBtn').addEventListener('click', () => toast('Opening chat with customer (demo)'));
  document.getElementById('invoiceBtn').addEventListener('click', () => toast('Invoice generated (demo)', { kind: 'success' }));
  document.getElementById('refundBtn').addEventListener('click', async () => {
    if (await confirm(`Refund ${formatPrice(totals().total)} to the customer?`)) { setStatus('cancelled'); toast('Refund issued (demo)', { kind: 'success' }); }
  });
  document.getElementById('cancelBtn').addEventListener('click', async () => {
    if (await confirm('Cancel this order?')) setStatus('cancelled');
  });
  document.getElementById('saveNote').addEventListener('click', () => {
    patch({ adminNote: document.getElementById('note').value }); haptic('success'); toast('Note saved', { kind: 'success' });
  });
}

function editTracking() {
  const form = `<div class="field"><label class="field__label">Carrier & tracking number</label>
    <input class="input" id="trk" value="${esc(order.tracking || '')}" placeholder="e.g. DHL 1Z999AA10123456784"></div>
    <button class="btn btn--block" id="trkSave">Save tracking</button>`;
  const sheet = bottomSheet({ title: 'Tracking', content: form });
  sheet.el.querySelector('#trkSave').addEventListener('click', () => {
    patch({ tracking: sheet.el.querySelector('#trk').value.trim() });
    if (order.status === 'paid') patch({ status: 'shipped' });
    haptic('success'); sheet.close(); toast('Tracking saved', { kind: 'success' }); render();
  });
}

function openStatusSheet() {
  const all = [...FLOW, 'cancelled'];
  const rows = all.map((s) => `<button class="list-row" data-set="${s}">
    <span class="status status--${s}">${s}</span><span class="grow"></span>
    ${order.status === s ? icon('check', { size: 20, cls: 'text-accent' }) : ''}</button>`).join('');
  const sheet = bottomSheet({ title: 'Update status', content: `<div class="list" style="margin:0">${rows}</div>` });
  sheet.el.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => { sheet.close(); setStatus(b.dataset.set); }));
}

render();
