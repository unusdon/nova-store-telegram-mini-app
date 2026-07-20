/**
 * Nova Kit — Admin dashboard
 * KPIs, quick actions, a 7-day sales chart, and the most recent orders.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc } from '../core/ui.js';
import { getStats, getSalesSeries, getAllOrders } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const stats = getStats();
const series = getSalesSeries();
const orders = getAllOrders().slice(0, 5);

const kpi = (label, iconName, value, delta, dir, href) => `
  <a class="kpi kpi--link" href="${href}">
    <span class="kpi__label"><span class="kpi__icon">${icon(iconName, { size: 18 })}</span>${label}${icon('chevron', { size: 14, cls: 'kpi__go' })}</span>
    <span class="kpi__value">${value}</span>
    ${delta ? `<span class="kpi__delta ${dir}">${dir === 'up' ? '▲' : '▼'} ${delta}</span>` : ''}
  </a>`;

const quickAction = (label, iconName, href) => `
  <a class="quick-action" href="${href}">
    <span class="quick-action__icon">${icon(iconName, { size: 22 })}</span>${label}</a>`;

const max = Math.max(...series.values);
const chart = `
  <div class="chart-card">
    <div class="row-between"><strong>Sales this week</strong>
      <span class="text-accent semibold">${formatPrice(series.values.reduce((a, b) => a + b, 0))}</span></div>
    <div class="bars">
      ${series.values.map((v, i) => `
        <div class="bar"><div class="bar__fill" style="height:${Math.round((v / max) * 100)}%"></div>
          <span class="bar__label">${series.labels[i]}</span></div>`).join('')}
    </div>
  </div>`;

const recent = `
  ${sectionHead('Recent orders', 'orders.html')}
  <div class="list" style="margin-top:0">
    ${orders.map((o) => `
      <a class="data-row" href="order.html?id=${encodeURIComponent(o.id)}">
        <span class="data-row__avatar">${icon('bag', { size: 18 })}</span>
        <span class="data-row__main">
          <span class="data-row__title">${esc(o.number)}</span>
          <span class="data-row__sub">${esc(o.customer || 'Guest')} · ${formatDate(o.createdAt)}</span>
        </span>
        <span class="data-row__end">
          <span class="semibold">${formatPrice(o.total)}</span>
          <span class="status status--${o.status}">${o.status}</span>
        </span>
      </a>`).join('')}
  </div>`;

function sectionHead(title, href) {
  return `<div class="section-head"><h2>${esc(title)}</h2>
    <a class="section-head__link" href="${href}">See all</a></div>`;
}

document.getElementById('appbar').innerHTML = adminHeader({ title: `${config.brand.name} Admin`, menu: true });
screen.innerHTML = `
  <div class="kpi-grid">
    ${kpi('Revenue', 'chart', formatPrice(stats.revenue), '12.4%', 'up', 'reports.html')}
    ${kpi('Orders', 'bag', stats.orders, '8.1%', 'up', 'orders.html')}
    ${kpi('Products', 'box', stats.products, null, null, 'products.html')}
    ${kpi('Customers', 'users', stats.customers, '3.2%', 'up', 'customers.html')}
  </div>
  <div class="admin-section-title">Quick actions</div>
  <div class="quick-actions">
    ${quickAction('Add product', 'plus', 'product-edit.html')}
    ${quickAction('Orders', 'bag', 'orders.html')}
    ${quickAction('Analytics', 'chart', 'analytics.html')}
    ${quickAction('Promos', 'tag', 'marketing.html')}
  </div>
  ${chart}
  ${stats.pending ? `<a class="card card--pad row-between" href="orders.html?status=pending" style="color:var(--text)">
    <span class="row gap-2">${icon('bell', { size: 18 })} ${stats.pending} orders awaiting action</span>
    ${icon('chevron', { size: 18 })}</a>` : ''}
  ${recent}
`;
document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
bindAdminChrome();
