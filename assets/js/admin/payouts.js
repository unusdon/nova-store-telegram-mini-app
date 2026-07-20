/**
 * Nova Kit — Admin payouts
 * Available balance, request a payout, and settlement history — each history item opens a
 * detail view (amount breakdown, destination, timeline, statement). Demo data; wire to your
 * payment provider's payouts API in production.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
let available = 3480.5;
const history = [
  { id: 'PO-1180', amount: 1200.0, dest: 'Bank ••4471', status: 'paid', date: '2024-06-28T00:00:00Z' },
  { id: 'PO-1173', amount: 950.0, dest: 'Bank ••4471', status: 'paid', date: '2024-06-14T00:00:00Z' },
  { id: 'PO-1166', amount: 1500.0, dest: 'Bank ••4471', status: 'paid', date: '2024-05-31T00:00:00Z' },
];
const CLS = { paid: 'delivered', pending: 'pending', failed: 'cancelled' };
let openId = null;

/* Derive an amount breakdown + fulfilment metadata for a payout. */
function breakdown(p) {
  const fee = Math.round((p.amount * 0.029 + 0.3) * 100) / 100;
  const gross = Math.round((p.amount + fee) * 100) / 100;
  const orders = Math.max(1, Math.round(p.amount / 85));
  const arrival = new Date(p.date); arrival.setDate(arrival.getDate() + 2);
  return { fee, gross, orders, arrival: arrival.toISOString() };
}

function row(p) {
  return `<button class="data-row" data-id="${p.id}">
    <span class="data-row__avatar">🏦</span>
    <span class="data-row__main"><span class="data-row__title">${formatPrice(p.amount)}</span>
      <span class="data-row__sub">${esc(p.dest)} · ${p.id} · ${formatDate(p.date)}</span></span>
    <span class="data-row__end"><span class="status status--${CLS[p.status]}">${p.status}</span>
      ${icon('chevron', { size: 18, cls: 'text-faint' })}</span>
  </button>`;
}

function listView() {
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Payouts', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="chart-card" style="text-align:center">
      <div class="muted text-sm">Available for payout</div>
      <div style="font-size:34px;font-weight:var(--fw-bold);margin:6px 0">${formatPrice(available)}</div>
      <div class="muted text-sm">Next automatic payout: Friday</div>
    </div>
    <div class="container"><button class="btn btn--block" id="payoutBtn">${icon('download', { size: 18 })} Request payout</button></div>
    <div class="admin-section-title">Payout history</div>
    <div class="list" style="margin-top:0">${history.map(row).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();
  document.getElementById('payoutBtn').addEventListener('click', requestPayout);
  screen.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => { openId = b.dataset.id; render(); }));
}

function timeline(status) {
  const steps = [['requested', 'Payout requested'], ['transit', 'In transit'], ['paid', 'Deposited']];
  const reached = status === 'paid' ? 2 : status === 'failed' ? 0 : 1;
  return `<div class="timeline">
    ${steps.map(([, label], i) => `<div class="timeline__step ${i <= reached ? 'is-done' : ''}">
      <span class="timeline__dot"></span><div><div class="semibold">${label}</div>
        <div class="muted text-sm">${i <= reached ? 'Completed' : 'Pending'}</div></div></div>`).join('')}
  </div>`;
}

function detailView() {
  const p = history.find((x) => x.id === openId);
  if (!p) { openId = null; return render(); }
  const b = breakdown(p);

  document.getElementById('appbar').innerHTML = adminHeader({
    title: p.id, back: 'javascript:void(0)', menu: false,
    actions: `<button class="appbar__btn" id="stmtBtn" aria-label="Statement">${icon('download', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="chart-card" style="text-align:center">
      <div style="font-size:34px;font-weight:var(--fw-bold)">${formatPrice(p.amount)}</div>
      <div style="margin-top:8px"><span class="status status--${CLS[p.status]}">${p.status}</span></div>
      <div class="muted text-sm" style="margin-top:8px">${p.status === 'paid' ? 'Arrived' : 'Expected'} ${formatDate(b.arrival)}</div>
    </div>

    <div class="admin-section-title">Details</div>
    <div class="card card--pad">
      ${[['Payout ID', p.id], ['Destination', p.dest], ['Requested', formatDate(p.date)],
        ['Method', 'Standard (2 days)'], ['Orders included', `${b.orders}`]].map(([l, v]) =>
        `<div class="row-between" style="padding:8px 0"><span class="muted text-sm">${l}</span><span class="semibold">${esc(String(v))}</span></div>`).join('')}
    </div>

    <div class="admin-section-title">Breakdown</div>
    <div class="card"><div class="summary">
      <div class="summary__row"><span>Gross sales</span><span>${formatPrice(b.gross)}</span></div>
      <div class="summary__row summary__row--discount"><span>Processing fees</span><span>-${formatPrice(b.fee)}</span></div>
      <div class="summary__row summary__row--total"><span>Net payout</span><span>${formatPrice(p.amount)}</span></div>
    </div></div>

    <div class="admin-section-title">Status</div>
    <div class="card"><div style="padding:8px 16px">${timeline(p.status)}</div></div>
    <div class="container"><a class="btn btn--outline btn--block" href="transactions.html">${icon('card', { size: 18 })} View included transactions</a></div>
    <div style="height:8px"></div>`;

  document.querySelector('.appbar__btn[href^="javascript"]').addEventListener('click', () => { openId = null; render(); });
  document.getElementById('stmtBtn').addEventListener('click', () => toast('Statement downloaded (demo)', { kind: 'success' }));
  bindAdminChrome();
}

function requestPayout() {
  const form = `
    <div style="text-align:center;padding:8px 0 16px"><div class="muted text-sm">Available</div>
      <div style="font-size:28px;font-weight:700">${formatPrice(available)}</div></div>
    <div class="field"><label class="field__label">Payout amount</label>
      <input class="input" id="po_amt" type="number" min="0" step="0.01" value="${available.toFixed(2)}"></div>
    <div class="field"><label class="field__label">Destination</label>
      <select class="select" id="po_dest"><option>Bank ••4471</option><option>PayPal · store@nova.app</option></select></div>
    <button class="btn btn--block" id="po_save">Request payout</button>`;
  const sheet = bottomSheet({ title: 'Request payout', content: form });
  sheet.el.querySelector('#po_save').addEventListener('click', () => {
    const val = parseFloat(sheet.el.querySelector('#po_amt').value);
    if (!val || val <= 0 || val > available) { toast('Enter a valid amount', { kind: 'danger' }); return; }
    history.unshift({ id: 'PO-' + (1181 + history.length), amount: val, dest: sheet.el.querySelector('#po_dest').value, status: 'pending', date: new Date().toISOString() });
    available = Math.max(0, available - val);
    haptic('success'); sheet.close(); toast('Payout requested', { kind: 'success' }); render();
  });
}

function render() { if (openId) detailView(); else listView(); }
render();
