/**
 * Nova Kit — Returns & Refunds (customer)
 * List existing return requests and start a new one (pick an order + item + reason).
 * Requests are stored under `nova:returns` and shared with the admin Returns page.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:returns`;
const screen = document.getElementById('screen');
const REASONS = ['Damaged or defective', 'Wrong item received', 'No longer needed', 'Better price found', 'Other'];
const STATUS_CLASS = { requested: 'pending', approved: 'shipped', refunded: 'delivered', rejected: 'cancelled' };

const getReturns = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const setReturns = (r) => localStorage.setItem(KEY, JSON.stringify(r));

function row(r) {
  return `<div class="ticket-item">
    <span class="ticket-item__icon">${icon('box', { size: 18 })}</span>
    <span class="ticket-item__body"><span class="ticket-item__title">${esc(r.item)}</span>
      <span class="ticket-item__sub">Order ${esc(r.orderNumber)} · ${esc(r.reason)} · ${formatDate(r.date)}</span></span>
    <span class="status status--${STATUS_CLASS[r.status] || 'pending'}">${r.status}</span>
  </div>`;
}

function render() {
  const returns = getReturns();
  document.getElementById('appbar').innerHTML = pageHeader({
    title: 'Returns', subtitle: 'Requests & refunds', back: 'profile.html',
    action: `<button class="hbtn" id="newBtn" aria-label="New return">${icon('plus', { size: 24 })}</button>`,
  });
  bindThemeToggle();

  screen.innerHTML = returns.length ? `<div class="list" style="margin-top:16px">${returns.map(row).join('')}</div>`
    : `<div class="empty-state" style="padding-top:60px"><div class="empty-state__emoji">📦</div>
        <h3>No return requests</h3><p>Request a return or refund for a delivered order.</p>
        <button class="btn" id="newFirst">Request a return</button></div>`;

  document.getElementById('newBtn').addEventListener('click', openNew);
  document.getElementById('newFirst')?.addEventListener('click', openNew);
}

function openNew() {
  const orders = dataService.getOrders().filter((o) => ['delivered', 'shipped', 'paid'].includes(o.status));
  if (!orders.length) { toast('No eligible orders to return', { kind: 'danger' }); return; }
  const items = orders.flatMap((o) => (o.items || []).map((it) => ({ order: o.number, name: it.name })));
  const form = `
    <div class="field"><label class="field__label">Item</label>
      <select class="input" id="r_item">${items.map((it, i) => `<option value="${i}">${esc(it.name)} — ${esc(it.order)}</option>`).join('')}</select></div>
    <div class="field"><label class="field__label">Reason</label>
      <select class="input" id="r_reason">${REASONS.map((r) => `<option>${r}</option>`).join('')}</select></div>
    <div class="field"><label class="field__label">Details (optional)</label>
      <textarea class="textarea" id="r_note" placeholder="Tell us what happened"></textarea></div>
    <button class="btn btn--block" id="r_save">Submit request</button>`;
  const sheet = bottomSheet({ title: 'Request a return', content: form });
  sheet.el.querySelector('#r_save').addEventListener('click', () => {
    const it = items[+sheet.el.querySelector('#r_item').value];
    const returns = getReturns();
    returns.unshift({ id: 'ret-' + Date.now().toString(36), orderNumber: it.order, item: it.name,
      reason: sheet.el.querySelector('#r_reason').value, note: sheet.el.querySelector('#r_note').value,
      status: 'requested', date: new Date().toISOString() });
    setReturns(returns);
    haptic('success'); sheet.close(); toast('Return requested', { kind: 'success' }); render();
  });
}

render();
