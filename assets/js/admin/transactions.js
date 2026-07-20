/**
 * Nova Kit — Admin transactions
 * Every money movement through the store (payments, refunds, payouts) with filters and KPIs.
 * Demo data; wire to your payment provider's ledger in production.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc } from '../core/ui.js';

adminBootstrap();

const screen = document.getElementById('screen');
const TX = [
  { id: 'CH-9012', kind: 'payment', title: 'Order NV-0915', who: 'Kenji Tanaka', amount: 699.0, status: 'completed', date: '2024-07-01T18:22:00Z' },
  { id: 'CH-9011', kind: 'payment', title: 'Order NV-0914', who: 'Sofia Marín', amount: 59.0, status: 'completed', date: '2024-06-30T09:05:00Z' },
  { id: 'RF-2201', kind: 'refund', title: 'Refund NV-0902', who: 'Liam Brooks', amount: -74.0, status: 'completed', date: '2024-06-29T13:10:00Z' },
  { id: 'CH-9010', kind: 'payment', title: 'Order NV-0913', who: 'Liam Brooks', amount: 149.0, status: 'completed', date: '2024-06-29T14:40:00Z' },
  { id: 'PO-1180', kind: 'payout', title: 'Payout to bank ••4471', who: 'You', amount: -1200.0, status: 'paid', date: '2024-06-28T00:00:00Z' },
  { id: 'CH-9009', kind: 'payment', title: 'Order NV-0912', who: 'Amara Okafor', amount: 178.0, status: 'completed', date: '2024-06-28T10:12:00Z' },
];
const CLS = { completed: 'delivered', paid: 'delivered', pending: 'pending', failed: 'cancelled' };
const ICON = { payment: '💰', refund: '↩️', payout: '🏦' };
let filter = 'all';

function render() {
  const list = TX.filter((t) => filter === 'all' || t.kind === filter);
  const gross = TX.filter((t) => t.kind === 'payment').reduce((s, t) => s + t.amount, 0);
  const refunds = -TX.filter((t) => t.kind === 'refund').reduce((s, t) => s + t.amount, 0);

  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Transactions', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="exportBtn" aria-label="Export">${icon('download', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('card', { size: 18 })}</span>Gross</span><span class="kpi__value">${formatPrice(gross)}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('box', { size: 18 })}</span>Refunds</span><span class="kpi__value">${formatPrice(refunds)}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('chart', { size: 18 })}</span>Net</span><span class="kpi__value">${formatPrice(gross - refunds)}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('bag', { size: 18 })}</span>Count</span><span class="kpi__value">${TX.length}</span></div>
    </div>
    <div class="tabs-pill">
      ${[['all', 'All'], ['payment', 'Payments'], ['refund', 'Refunds'], ['payout', 'Payouts']].map(([id, l]) =>
        `<button class="chip${filter === id ? ' is-active' : ''}" data-f="${id}">${l}</button>`).join('')}
    </div>
    <div class="list" style="margin-top:0">
      ${list.map((t) => `<div class="data-row">
        <span class="data-row__avatar">${ICON[t.kind]}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(t.title)}</span>
          <span class="data-row__sub">${esc(t.who)} · ${t.id} · ${formatDate(t.date)}</span></span>
        <span class="data-row__end"><span class="semibold" style="color:${t.amount >= 0 ? 'var(--success)' : 'var(--text)'}">${t.amount >= 0 ? '+' : '−'}${formatPrice(Math.abs(t.amount))}</span>
          <span class="status status--${CLS[t.status]}">${t.status}</span></span>
      </div>`).join('')}
    </div>`;

  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();
  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
  document.getElementById('exportBtn').addEventListener('click', async () => { const { toast } = await import('../core/ui.js'); toast('Ledger exported as CSV (demo)', { kind: 'success' }); });
}

render();
