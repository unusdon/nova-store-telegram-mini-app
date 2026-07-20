/**
 * Nova Kit — Admin orders list
 * Filter by status, see totals and customer at a glance, tap through to the detail page.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc } from '../core/ui.js';
import { getAllOrders } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];
let active = new URLSearchParams(location.search).get('status') || 'all';

function render() {
  const orders = getAllOrders().filter((o) => active === 'all' || o.status === active);

  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Orders', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="tabs-pill">
      ${STATUSES.map((s) => `<button class="chip${s === active ? ' is-active' : ''}" data-status="${s}">
        ${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}
    </div>
    ${orders.length ? `<div class="list" style="margin-top:0">
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
    </div>` : `<div class="empty-state"><div class="empty-state__emoji">📦</div><h3>No ${active} orders</h3></div>`}
  `;
  document.getElementById('tabbar').innerHTML = adminTabBar('orders');
  bindAdminChrome();

  screen.querySelectorAll('[data-status]').forEach((b) =>
    b.addEventListener('click', () => { active = b.dataset.status; render(); }));
}

render();
