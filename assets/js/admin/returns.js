/**
 * Nova Kit — Admin returns & refunds
 * Review customer return requests (shared `nova:returns`) and approve, reject, or refund.
 */
import { config } from '../config.js';
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const KEY = `${config.data.persistNamespace}:returns`;
const screen = document.getElementById('screen');
const STATUSES = ['all', 'requested', 'approved', 'refunded', 'rejected'];
const CLS = { requested: 'pending', approved: 'shipped', refunded: 'delivered', rejected: 'cancelled' };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
let filter = 'all';

function getReturns() {
  let r = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (!r) { // seed a couple so the admin isn't empty
    r = [
      { id: 'ret-demo1', orderNumber: 'NV-1002', item: 'Pulse Smart Watch', reason: 'Damaged or defective', status: 'requested', date: '2024-07-03T08:00:00Z' },
      { id: 'ret-demo2', orderNumber: 'NV-0998', item: 'Terra Field Jacket', reason: 'Wrong item received', status: 'approved', date: '2024-06-29T12:00:00Z' },
    ];
    localStorage.setItem(KEY, JSON.stringify(r));
  }
  return r;
}
const save = (r) => localStorage.setItem(KEY, JSON.stringify(r));

function setStatus(id, status) {
  const r = getReturns(); const item = r.find((x) => x.id === id);
  if (item) { item.status = status; save(r); }
  haptic('success'); toast(`Return ${status}`, { kind: status === 'rejected' ? 'danger' : 'success' }); render();
}

/** Refunding money back to a shopper cannot be undone — always confirm first. Returns true if issued. */
async function refund(id) {
  const r = getReturns().find((x) => x.id === id);
  if (!r) return false;
  if (!await confirm(`Issue a refund for ${r.item}? This cannot be undone.`)) return false;
  setStatus(id, 'refunded');
  return true;
}

/**
 * Full request detail in a bottom sheet — the same Approve / Reject / Issue-refund actions as the
 * inline row buttons, plus the reason and any note the shopper left.
 */
function openDetail(id) {
  const r = getReturns().find((x) => x.id === id);
  if (!r) return;
  haptic('selection');
  const actions = r.status === 'requested'
    ? `<div class="row gap-2">
        <button class="btn btn--block" data-act="approved">Approve</button>
        <button class="btn btn--block btn--outline" data-act="rejected" style="color:var(--danger);border-color:var(--danger)">Reject</button>
      </div>`
    : r.status === 'approved'
      ? `<button class="btn btn--block" data-act="refunded">${icon('card', { size: 16 })} Issue refund</button>`
      : '<p class="muted text-sm" style="text-align:center">This request is closed.</p>';

  const sheet = bottomSheet({
    title: 'Return request',
    content: `
      <div class="row-between" style="margin-bottom:16px">
        <div><div class="semibold">${esc(r.item)}</div>
          <div class="muted text-sm">Order ${esc(r.orderNumber)} · ${formatDate(r.date)}</div></div>
        <span class="status status--${CLS[r.status]}">${esc(r.status)}</span>
      </div>
      <div class="summary" style="padding:0;margin-bottom:16px">
        <div class="summary__row"><span>Reason</span><span>${esc(r.reason)}</span></div>
        <div class="summary__row"><span>Status</span><span>${esc(cap(r.status))}</span></div>
        ${r.note ? `<div class="summary__row"><span>Note</span><span>${esc(r.note)}</span></div>` : ''}
      </div>
      ${actions}`,
  });

  sheet.el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', async () => {
    const next = b.dataset.act;
    // On a cancelled refund confirm, leave the sheet open so the admin can pick another action.
    if (next === 'refunded') { if (await refund(r.id)) sheet.close(); return; }
    sheet.close();
    setStatus(r.id, next);
  }));
}

function render() {
  const list = getReturns().filter((r) => filter === 'all' || r.status === filter);
  const pending = getReturns().filter((r) => r.status === 'requested').length;

  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Returns', back: 'index.html', menu: false });
  screen.innerHTML = `
    ${pending ? `<div class="card card--pad row gap-2" style="color:var(--warning)">${icon('bell', { size: 18 })} ${pending} request${pending > 1 ? 's' : ''} awaiting review</div>` : ''}
    <div class="tabs-pill">
      ${STATUSES.map((s) => `<button class="chip${s === filter ? ' is-active' : ''}" data-f="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}
    </div>
    ${list.length ? list.map((r) => `<div class="card card--pad" style="margin-bottom:12px">
      <div class="row-between">
        <button class="grow" style="text-align:start" data-open="${esc(r.id)}"><div class="semibold">${esc(r.item)}</div>
        <div class="muted text-sm">Order ${esc(r.orderNumber)} · ${esc(r.reason)} · ${formatDate(r.date)}</div></button>
        <span class="status status--${CLS[r.status]}">${r.status}</span></div>
      ${r.status === 'requested' ? `<div class="row gap-2" style="margin-top:12px">
        <button class="btn btn--sm" data-approve="${r.id}">Approve</button>
        <button class="btn btn--sm btn--outline" data-reject="${r.id}" style="color:var(--danger);border-color:var(--danger)">Reject</button></div>`
      : r.status === 'approved' ? `<div class="row" style="margin-top:12px">
        <button class="btn btn--sm" data-refund="${r.id}">${icon('card', { size: 16 })} Issue refund</button></div>` : ''}
    </div>`).join('') : `<div class="empty-state"><div class="empty-state__emoji">📦</div><h3>No ${filter} returns</h3></div>`}`;

  document.getElementById('tabbar').innerHTML = adminTabBar('orders');
  bindAdminChrome();

  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; haptic('selection'); render(); }));
  screen.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openDetail(b.dataset.open)));
  screen.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.approve, 'approved')));
  screen.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.reject, 'rejected')));
  screen.querySelectorAll('[data-refund]').forEach((b) => b.addEventListener('click', () => refund(b.dataset.refund)));
}

render();
