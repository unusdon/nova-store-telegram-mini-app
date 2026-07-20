/**
 * Nova Kit — Admin customers
 * Searchable customer list with lifetime orders/spend and account status. Tap a customer for
 * a full profile (user ID, contact, activity) with Ban / Unban controls.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { demoCustomers, tierFor, staffFor } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
let query = '';

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function row(c) {
  return `<button class="data-row" data-id="${c.id}">
    <span class="data-row__avatar">${initials(c.name)}</span>
    <span class="data-row__main"><span class="data-row__title">${esc(c.name)}
      ${c.status === 'banned' ? '<span class="status status--cancelled" style="margin-inline-start:6px">Banned</span>' : ''}</span>
      <span class="data-row__sub">${esc(c.handle)} · ID ${esc(c.userId)}</span></span>
    <span class="data-row__end"><span class="semibold">${formatPrice(c.spent)}</span>
      <span class="muted text-sm">${c.orders} orders</span></span>
  </button>`;
}

function line(label, value) {
  return `<div class="summary__row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`;
}

/* Same row markup as `line()`, but the value keeps its own colour/markup. */
function lineHtml(label, valueHtml) {
  return `<div class="summary__row"><span>${esc(label)}</span><span>${valueHtml}</span></div>`;
}

function detail(c) {
  const banned = c.status === 'banned';
  const tier = tierFor(c.points);
  const staff = staffFor(c.handle);
  const node = document.createElement('div');
  node.innerHTML = `
    <div class="row gap-3" style="margin-bottom:16px">
      <span class="data-row__avatar" style="width:56px;height:56px;font-size:22px">${initials(c.name)}</span>
      <div><div class="semibold" style="font-size:17px">${esc(c.name)}</div>
        <div class="muted text-sm">${esc(c.handle)}</div>
        <div style="margin-top:4px"><span class="status status--${banned ? 'cancelled' : 'delivered'}">${banned ? 'Banned' : 'Active'}</span></div>
      </div>
    </div>

    <div class="admin-section-title" style="padding-inline:0">Account</div>
    <div class="card" style="margin:0"><div class="summary">
      ${line('User ID', c.userId)}
      ${line('Username', c.handle)}
      ${line('Email', c.email)}
      ${line('Phone', c.phone)}
      ${line('Location', c.location)}
      ${line('Joined', formatDate(c.joined))}
      ${line('Last active', formatDate(c.lastActive))}
      ${line('Loyalty', `${tier.name} · ${c.points.toLocaleString()} pts`)}
      ${lineHtml('Staff', staff
    ? `<span class="text-accent">${esc(staff.role)}</span>`
    : '<span class="muted">Not a staff member</span>')}
    </div></div>

    <div class="kpi-grid" style="padding:16px 0">
      <div class="kpi"><span class="kpi__label">Orders</span><span class="kpi__value">${c.orders}</span></div>
      <div class="kpi"><span class="kpi__label">Lifetime spend</span><span class="kpi__value">${formatPrice(c.spent)}</span></div>
    </div>

    <div class="stack gap-2">
      <a class="btn btn--ghost btn--block" href="orders.html">${icon('bag', { size: 18 })} View orders</a>
      <button class="btn btn--block ${banned ? '' : 'btn--outline'}" id="banBtn"
        style="${banned ? '' : 'color:var(--danger);border-color:var(--danger)'}">
        ${banned ? 'Unban customer' : 'Ban customer'}</button>
    </div>`;

  const sheet = bottomSheet({ title: 'Customer', content: node });
  node.querySelector('#banBtn').addEventListener('click', async () => {
    if (banned) {
      c.status = 'active'; haptic('success'); sheet.close(); toast(`${c.name} unbanned`, { kind: 'success' }); render();
    } else if (await confirm(`Ban ${c.name}? They won't be able to place orders.`)) {
      c.status = 'banned'; haptic('warning'); sheet.close(); toast(`${c.name} banned`, { kind: 'danger' }); render();
    }
  });
}

function render() {
  const list = demoCustomers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())
    || c.userId.includes(query) || c.handle.toLowerCase().includes(query.toLowerCase()));
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Customers', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="searchbar"><div class="searchbar__field">${icon('search', { size: 20 })}
      <input id="q" placeholder="Search name, @handle or ID" value="${esc(query)}" autocomplete="off"></div></div>
    <div class="admin-section-title">${list.length} customers</div>
    <div class="list" style="margin-top:0">${list.map(row).join('') || '<div class="empty-state"><h3>No matches</h3></div>'}</div>
  `;
  document.getElementById('tabbar').innerHTML = adminTabBar('customers');
  bindAdminChrome();

  document.getElementById('q').addEventListener('input', (e) => { query = e.target.value; render(); });
  screen.querySelectorAll('[data-id]').forEach((b) =>
    b.addEventListener('click', () => detail(demoCustomers.find((c) => c.id === b.dataset.id))));
}

render();

/* Deep link — `customers.html?id=c-05` (e.g. from Loyalty → Top members) opens that profile. */
const deepLinkId = new URLSearchParams(location.search).get('id');
if (deepLinkId) {
  const target = demoCustomers.find((c) => c.id === deepLinkId);
  if (target) detail(target);
}
