/**
 * Nova Kit — Admin analytics
 * Revenue KPIs, a weekly sales chart, and best-selling products.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, placeholder } from '../core/ui.js';
import { getStats, getSalesSeries, getTopProducts } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const stats = getStats();
const series = getSalesSeries();
const top = getTopProducts();
const max = Math.max(...series.values);
const weekTotal = series.values.reduce((a, b) => a + b, 0);

document.getElementById('appbar').innerHTML = adminHeader({ title: 'Analytics', back: 'index.html', menu: false });
screen.innerHTML = `
  <div class="kpi-grid">
    <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('chart', { size: 18 })}</span>Revenue (7d)</span>
      <span class="kpi__value">${formatPrice(weekTotal)}</span><span class="kpi__delta up">▲ 12.4%</span></div>
    <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('bag', { size: 18 })}</span>Orders</span>
      <span class="kpi__value">${stats.orders}</span><span class="kpi__delta up">▲ 8.1%</span></div>
    <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('users', { size: 18 })}</span>Avg order</span>
      <span class="kpi__value">${formatPrice(stats.revenue / Math.max(1, stats.orders))}</span></div>
    <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('tag', { size: 18 })}</span>Conversion</span>
      <span class="kpi__value">3.8%</span><span class="kpi__delta down">▼ 0.4%</span></div>
  </div>

  <div class="chart-card">
    <div class="row-between"><strong>Sales this week</strong><span class="text-accent semibold">${formatPrice(weekTotal)}</span></div>
    <div class="bars">
      ${series.values.map((v, i) => `<div class="bar"><div class="bar__fill" style="height:${Math.round((v / max) * 100)}%"></div>
        <span class="bar__label">${series.labels[i]}</span></div>`).join('')}
    </div>
  </div>

  <div class="admin-section-title">Top Selling Products</div>
  <div class="list" style="margin-top:0">
    ${top.map((p, i) => `<div class="data-row">
      <span class="data-row__avatar" style="font-weight:700">${i + 1}</span>
      <img class="data-row__avatar" src="${placeholder(p.emoji, p.color, 80, 80)}" alt="" width="40" height="40">
      <span class="data-row__main"><span class="data-row__title">${esc(p.name)}</span>
        <span class="data-row__sub">${p.sold} sold</span></span>
      <span class="semibold">${formatPrice(p.price * p.sold)}</span>
    </div>`).join('')}
  </div>
`;
document.getElementById('tabbar').innerHTML = adminTabBar('analytics');
bindAdminChrome();
