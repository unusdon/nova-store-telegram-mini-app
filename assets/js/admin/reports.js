/**
 * Nova Kit — Admin reports
 * Date-range sales report: KPI row, a daily revenue chart, a period breakdown table, and an
 * export action. Demo figures derive from the sales series; wire to your backend for real data.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { getSalesSeries, getStats, getTopProducts } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const RANGES = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days']];

/* Canned reports a merchant can pull for the selected range. Demo-only: the click just toasts —
   swap `download()` for a call to your reporting endpoint. */
const REPORTS = [
  ['Sales summary', 'Revenue, orders, AOV by day'],
  ['Product performance', 'Units sold + revenue per product'],
  ['Customer report', 'New vs returning, lifetime value'],
  ['Tax report', 'Collected tax by period'],
  ['Payouts statement', 'Settlements & fees'],
];

let range = '7d';

function download(name) {
  haptic('success');
  toast(`${name} exported as CSV (demo)`, { kind: 'success' });
}

function series() {
  const base = getSalesSeries();
  const mult = range === '30d' ? 4.3 : range === '90d' ? 13 : 1;
  return { labels: base.labels, values: base.values.map((v) => Math.round(v * (mult === 1 ? 1 : mult / 7 * 7))) , mult };
}

function render() {
  const s = getSalesSeries();
  const mult = range === '30d' ? 4.3 : range === '90d' ? 13 : 1;
  const revenue = Math.round(s.values.reduce((a, b) => a + b, 0) * mult);
  const stats = getStats();
  const orders = Math.round(stats.orders * mult);
  const aov = revenue / Math.max(1, orders);
  const refunds = Math.round(revenue * 0.03);
  const max = Math.max(...s.values);

  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Reports', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="exportBtn" aria-label="Export">${icon('box', { size: 22 })}</button>`,
  });

  screen.innerHTML = `
    <div class="tabs-pill">
      ${RANGES.map(([id, label]) => `<button class="chip${id === range ? ' is-active' : ''}" data-range="${id}">${label}</button>`).join('')}
    </div>

    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('chart', { size: 18 })}</span>Revenue</span>
        <span class="kpi__value">${formatPrice(revenue)}</span><span class="kpi__delta up">▲ 9.6%</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('bag', { size: 18 })}</span>Orders</span>
        <span class="kpi__value">${orders}</span><span class="kpi__delta up">▲ 6.2%</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('tag', { size: 18 })}</span>Avg order</span>
        <span class="kpi__value">${formatPrice(aov)}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('trash', { size: 18 })}</span>Refunds</span>
        <span class="kpi__value">${formatPrice(refunds)}</span><span class="kpi__delta down">▼ 1.1%</span></div>
    </div>

    <div class="chart-card">
      <div class="row-between"><strong>Revenue by day</strong><span class="text-accent semibold">${formatPrice(revenue)}</span></div>
      <div class="bars">
        ${s.values.map((v, i) => `<div class="bar"><div class="bar__fill" style="height:${Math.round((v / max) * 100)}%"></div>
          <span class="bar__label">${s.labels[i]}</span></div>`).join('')}
      </div>
    </div>

    <div class="admin-section-title">Breakdown</div>
    <div class="list" style="margin-top:0">
      ${s.labels.map((d, i) => `<div class="data-row">
        <span class="data-row__main"><span class="data-row__title">${d}</span>
          <span class="data-row__sub">${Math.round(s.values[i] / aov * mult)} orders</span></span>
        <span class="semibold">${formatPrice(Math.round(s.values[i] * mult))}</span>
      </div>`).join('')}
    </div>

    <div class="admin-section-title">Top products</div>
    <div class="list" style="margin-top:0">
      ${getTopProducts().map((p, i) => `<div class="data-row">
        <span class="data-row__avatar" style="font-weight:700">${i + 1}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(p.name)}</span>
          <span class="data-row__sub">${p.sold} sold</span></span>
        <span class="semibold">${formatPrice(p.price * p.sold)}</span>
      </div>`).join('')}
    </div>

    <div class="admin-section-title">Download reports</div>
    <div class="list" style="margin-top:0">
      ${REPORTS.map(([name, desc]) => `<button class="data-row" data-report="${esc(name)}">
        <span class="data-row__avatar">${icon('chart', { size: 18 })}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(name)}</span>
          <span class="data-row__sub">${esc(desc)}</span></span>
        <span class="data-row__end text-accent">${icon('download', { size: 18 })}</span>
      </button>`).join('')}
    </div>`;

  document.getElementById('tabbar').innerHTML = adminTabBar('analytics');
  bindAdminChrome();

  screen.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => { range = b.dataset.range; haptic('selection'); render(); }));
  screen.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', () => download(b.dataset.report)));
  document.getElementById('exportBtn').addEventListener('click', () => toast('Report exported as CSV (demo)', { kind: 'success' }));
}

render();
