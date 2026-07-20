/**
 * Nova Kit — Orders (faithful replica of the original order-history page)
 * Stats grid, status filter tabs, and rich order cards with an item preview.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc } from '../core/ui.js';
import { tabBar, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const TABS = [['all', 'All Orders'], ['active', 'Active'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
const ACTIVE = ['pending', 'paid', 'shipped'];
let filter = 'all';

function seedIfEmpty() {
  const seededKey = `${config.data.persistNamespace}:seeded-orders`;
  if (dataService.getOrders().length || localStorage.getItem(seededKey)) return;
  localStorage.setItem(seededKey, '1');
  // A saved address is reused so the seeded orders show complete shipping details.
  const addr = dataService.getAddresses().find((a) => a.default) || {
    name: 'Alex Morgan', phone: '+1 (415) 555-0132', line1: '742 Evergreen Terrace',
    line2: 'Apt 4B', city: 'San Francisco', region: 'CA', postal: '94103', country: 'United States',
  };
  dataService.placeOrder({ number: 'NV-1001', items: [{ name: 'Aurora Wireless Earbuds', qty: 1, price: 89, type: 'physical', emoji: '🎧' }],
    subtotal: 89, discount: 0, shipping: 0, tax: 7.12, total: 96.12, address: addr, paymentMethod: 'Credit / Debit Card', shippingMethod: 'Standard', status: 'delivered' });
  dataService.placeOrder({ number: 'NV-1002', items: [{ name: 'Pulse Smart Watch', qty: 1, price: 149, type: 'physical', emoji: '⌚' }],
    subtotal: 149, discount: 0, shipping: 9.99, tax: 11.92, total: 170.91, address: addr, paymentMethod: 'Credit / Debit Card', shippingMethod: 'Express', status: 'shipped' });
}

function stats(orders) {
  const completed = orders.filter((o) => o.status === 'delivered').length;
  const transit = orders.filter((o) => o.status === 'shipped').length;
  const processing = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;
  const spent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const card = (cls, ic, num, label) => `<div class="stat-card">
    <span class="stat-icon ${cls}">${ic}</span>
    <span class="stat-info"><span class="stat-number">${num}</span><span class="stat-label">${label}</span></span></div>`;
  return `<div class="stats-grid">
    ${card('completed', '📦', completed, 'Completed')}
    ${card('processing', '🚚', transit, 'In Transit')}
    ${card('pending', '⏳', processing, 'Processing')}
    ${card('total', '💰', formatPrice(spent), 'Total Spent')}
  </div>`;
}

function orderCard(o) {
  const items = o.items || [];
  const preview = items.slice(0, 3);
  const remaining = Math.max(0, items.length - 3);
  const imgs = preview.map((it) => it.image
    ? `<img class="item-image" src="${it.image}" alt="${esc(it.name)}">`
    : `<span class="item-image">${it.emoji || (it.type === 'digital' ? '💾' : '📦')}</span>`).join('');
  return `<div class="order-item" data-id="${o.id}">
    <div class="order-header">
      <div class="order-info"><div class="order-id">${esc(o.number)}</div>
        <div class="order-date">${formatDate(o.createdAt)}</div></div>
      <div class="order-status ${o.status}">${t('order.status.' + o.status)}</div>
    </div>
    <div class="order-items-preview">
      <div class="item-images">${imgs}${remaining ? `<span class="item-image more">+${remaining}</span>` : ''}</div>
      <div class="items-summary">
        <div class="items-count">${items.length} ${items.length === 1 ? 'item' : 'items'}</div>
        <div class="items-preview">${esc(items.map((i) => i.name).join(', '))}</div>
      </div>
    </div>
    <div class="order-footer">
      <div class="order-total">${formatPrice(o.total)}</div>
      <div class="order-actions"><span class="btn btn--ghost btn--sm">View ${icon('chevron', { size: 16 })}</span></div>
    </div>
  </div>`;
}

function render() {
  const all = dataService.getOrders();
  const list = all.filter((o) => filter === 'all' ? true
    : filter === 'active' ? ACTIVE.includes(o.status) : o.status === filter);

  document.getElementById('appbar').innerHTML = `
    <header class="orders-header"><div class="header-top">
      <a class="back-button" href="index.html" aria-label="Back">${icon('back', { size: 24 })}</a>
      <div class="header-center"><h1 class="page-title">${t('orders.title')}</h1>
        <span class="order-count">${all.length} orders</span></div>
      <span class="filter-button" style="visibility:hidden">${icon('filter', { size: 24 })}</span>
    </div></header>`;

  screen.innerHTML = `<div class="orders-content">
    ${stats(all)}
    <div class="filter-tabs">
      ${TABS.map(([id, label]) => `<button class="filter-tab${id === filter ? ' active' : ''}" data-tab="${id}">${label}</button>`).join('')}
    </div>
    ${list.length ? `<div class="orders-list">${list.map(orderCard).join('')}</div>`
      : `<div class="empty-orders"><div class="empty-icon">📦</div>
          <h3 class="empty-title">No orders found</h3><p>Start shopping to see your orders here.</p>
          <a class="btn" href="catalog.html" style="margin-top:12px">${t('nav.catalog')}</a></div>`}
  </div>`;

  document.getElementById('tabbar').innerHTML = tabBar('orders');
  bindThemeToggle();

  screen.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.tab; render(); }));
  screen.querySelectorAll('[data-id]').forEach((c) => c.addEventListener('click', () => { location.href = `order.html?id=${encodeURIComponent(c.dataset.id)}`; }));
}

/** Upgrade any earlier demo order that was seeded with an incomplete address. */
function migrateSeeds() {
  const demoAddr = { name: 'Alex Morgan', phone: '+1 (415) 555-0132', line1: '742 Evergreen Terrace',
    line2: 'Apt 4B', city: 'San Francisco', region: 'CA', postal: '94103', country: 'United States' };
  dataService.getOrders().forEach((o) => {
    if (o.address && o.address.name && !o.address.line1) {
      dataService.updateOrder(o.id, {
        address: { ...demoAddr, name: o.address.name === 'Demo User' ? demoAddr.name : o.address.name },
        shippingMethod: o.shippingMethod || (o.shipping ? 'Express' : 'Standard'),
        paymentMethod: o.paymentMethod === 'card' ? 'Credit / Debit Card' : o.paymentMethod,
      });
    }
  });
}

seedIfEmpty();
migrateSeeds();
render();
