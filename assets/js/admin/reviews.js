/**
 * Nova Kit — Admin reviews moderation
 * Approve or hide customer reviews. Demo data is derived from the catalogue; replace with
 * your review store in production.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { dataService } from '../core/store.js';
import { ratingStars } from '../components.js';

adminBootstrap();

const screen = document.getElementById('screen');
let reviews = [];
let filter = 'pending';

function card(r) {
  return `<div class="card card--pad" data-review="${r.id}">
    <div class="row-between">
      <div class="semibold">${esc(r.author)} <span class="muted text-sm">on ${esc(r.product)}</span></div>
      <span class="muted text-sm">${formatDate(r.date)}</span>
    </div>
    <div style="margin:6px 0">${ratingStars(r.rating)}</div>
    <div class="text-sm">${esc(r.body)}</div>
    <div class="row gap-2" style="margin-top:12px">
      ${r.status === 'pending'
        ? `<button class="btn btn--sm" data-approve="${r.id}">${icon('check', { size: 16 })} Approve</button>
           <button class="btn btn--sm btn--outline" data-hide="${r.id}">Hide</button>`
        : `<span class="status status--${r.status === 'approved' ? 'delivered' : 'cancelled'}">${r.status}</span>`}
    </div>
  </div>`;
}

function render() {
  const list = reviews.filter((r) => filter === 'all' || r.status === filter);
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Reviews', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="tabs-pill">
      ${['pending', 'approved', 'hidden', 'all'].map((s) =>
        `<button class="chip${s === filter ? ' is-active' : ''}" data-filter="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}
    </div>
    ${list.length ? `<div class="stack">${list.map(card).join('')}</div>`
      : `<div class="empty-state"><div class="empty-state__emoji">⭐</div><h3>No ${filter} reviews</h3></div>`}`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  screen.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));
  screen.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.approve, 'approved')));
  screen.querySelectorAll('[data-hide]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.hide, 'hidden')));
}

function setStatus(id, status) {
  const r = reviews.find((x) => x.id === id); if (r) r.status = status;
  haptic('success'); toast(`Review ${status}`, { kind: status === 'approved' ? 'success' : 'default' }); render();
}

(async function init() {
  const products = (await dataService.getProducts()).slice(0, 4);
  const nested = await Promise.all(products.map(async (p) => {
    const rs = await dataService.getReviews(p.id);
    return rs.map((r, i) => ({ ...r, product: p.name, status: i === 0 ? 'pending' : 'approved' }));
  }));
  reviews = nested.flat();
  render();
})();
