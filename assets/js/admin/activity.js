/**
 * Nova Kit — Admin activity log
 * Chronological audit feed of staff actions (orders, products, customers, settings, payouts).
 * Filter by area. Demo data; in production, append entries whenever your admin actions run.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc } from '../core/ui.js';

adminBootstrap();

const screen = document.getElementById('screen');
let filter = 'all';
const AREA = {
  order: { icon: 'bag', tint: 'tint-blue' },
  product: { icon: 'box', tint: 'tint-green' },
  customer: { icon: 'user', tint: 'tint-purple' },
  payout: { icon: 'card', tint: 'tint-orange' },
  settings: { icon: 'gear', tint: 'tint-pink' },
};
const log = [
  { area: 'order', actor: 'Ada N.', action: 'marked order NV-1042 as shipped', date: '2024-06-28T14:20:00Z' },
  { area: 'product', actor: 'You', action: 'updated price of “Wireless Headphones”', date: '2024-06-28T11:05:00Z' },
  { area: 'customer', actor: 'Ada N.', action: 'issued a $10 credit to Marco Diaz', date: '2024-06-27T16:40:00Z' },
  { area: 'payout', actor: 'System', action: 'sent payout PO-1180 to Bank ••4471', date: '2024-06-28T09:00:00Z' },
  { area: 'settings', actor: 'You', action: 'enabled the loyalty program', date: '2024-06-26T18:12:00Z' },
  { area: 'product', actor: 'You', action: 'added “Productivity Course” to Staff Picks', date: '2024-06-26T10:30:00Z' },
  { area: 'order', actor: 'System', action: 'auto-cancelled unpaid order NV-1039', date: '2024-06-25T08:00:00Z' },
  { area: 'customer', actor: 'Ada N.', action: 'answered a product question', date: '2024-06-24T13:15:00Z' },
];

function time(d) {
  const s = new Date(d);
  const hh = String(s.getUTCHours()).padStart(2, '0');
  const mm = String(s.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(d)} · ${hh}:${mm}`;
}

function row(e) {
  const a = AREA[e.area];
  return `<div class="data-row">
    <span class="data-row__avatar ${a.tint}">${icon(a.icon, { size: 20 })}</span>
    <span class="data-row__main"><span class="data-row__title"><strong>${esc(e.actor)}</strong> ${esc(e.action)}</span>
      <span class="data-row__sub">${time(e.date)}</span></span>
  </div>`;
}

function render() {
  const list = log.filter((e) => filter === 'all' || e.area === filter);
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Activity log', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="tabs-pill">${[['all', 'All'], ['order', 'Orders'], ['product', 'Products'], ['customer', 'Customers'], ['payout', 'Payouts'], ['settings', 'Settings']].map(([k, l]) => `<button class="chip${k === filter ? ' is-active' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="list" style="margin-top:0;padding:0 var(--space-4)">${list.map(row).join('') || '<p class="muted text-sm">No activity in this area.</p>'}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();
  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
}

render();
