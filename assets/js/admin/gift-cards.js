/**
 * Nova Kit — Admin gift cards
 * Manage issued gift cards (shared store `nova:giftcards`, written by the customer gift-cards
 * page): view balances/status, issue a new card, or void an active one. Seeds demo cards.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:giftcards`;
const screen = document.getElementById('screen');
let filter = 'all';
const STATUS = { active: 'delivered', redeemed: 'paid', void: 'cancelled' };

const all = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const save = (c) => localStorage.setItem(KEY, JSON.stringify(c));

function seed() {
  if (all().length) return;
  save([
    { code: 'GIFT-7H2K-9QMP', amount: 100, status: 'active', design: '#00C853', to: '@amelia', msg: 'Happy birthday!', date: '2024-06-26T00:00:00Z' },
    { code: 'GIFT-3RTX-8LZ2', amount: 50, status: 'redeemed', design: '#5B6CFF', to: 'sam@mail.com', msg: '', date: '2024-06-19T00:00:00Z' },
    { code: 'GIFT-P4WD-2NBF', amount: 25, status: 'active', design: '#F59E0B', to: '', msg: '', date: '2024-06-12T00:00:00Z' },
  ]);
}

function newCode() {
  const seed = String(all().length) + config.brand.name;
  const h = Math.abs([...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, Date.now()));
  return 'GIFT-' + h.toString(36).toUpperCase().padStart(8, 'X').slice(0, 8).replace(/(.{4})/, '$1-');
}

function row(c) {
  return `<div class="data-row" data-copy="${c.code}">
    <span class="data-row__avatar" style="background:${c.design || 'var(--accent-soft)'};color:#fff">🎁</span>
    <span class="data-row__main"><span class="data-row__title">${esc(c.code)}</span>
      <span class="data-row__sub">${c.to ? esc(c.to) + ' · ' : ''}${formatDate(c.date)}</span></span>
    <span class="data-row__end"><span class="semibold">${formatPrice(c.amount)}</span>
      <span class="status status--${STATUS[c.status]}">${c.status}</span></span>
  </div>`;
}

function render() {
  const list = all().filter((c) => filter === 'all' || c.status === filter);
  const active = all().filter((c) => c.status === 'active');
  const outstanding = active.reduce((s, c) => s + c.amount, 0);

  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Gift cards', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="issueBtn" aria-label="Issue">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('gift', { size: 18 })}</span>Active cards</span><span class="kpi__value">${active.length}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('card', { size: 18 })}</span>Outstanding</span><span class="kpi__value">${formatPrice(outstanding)}</span></div>
    </div>
    <div class="tabs-pill">${[['all', 'All'], ['active', 'Active'], ['redeemed', 'Redeemed'], ['void', 'Void']].map(([k, l]) => `<button class="chip${k === filter ? ' is-active' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="list" style="margin-top:0;padding:0 var(--space-4)">${list.map(row).join('') || '<p class="muted text-sm">No gift cards.</p>'}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  document.getElementById('issueBtn').addEventListener('click', issue);
  screen.querySelectorAll('[data-copy]').forEach((r) => r.addEventListener('click', () => manage(r.dataset.copy)));
  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
}

function manage(code) {
  const c = all().find((x) => x.code === code);
  if (!c) return;
  const node = document.createElement('div');
  node.innerHTML = `<div class="stack gap-3">
    <div class="row-between"><span class="muted text-sm">Amount</span><span class="semibold">${formatPrice(c.amount)}</span></div>
    <div class="row-between"><span class="muted text-sm">Status</span><span class="status status--${STATUS[c.status]}">${c.status}</span></div>
    ${c.msg ? `<div class="row-between"><span class="muted text-sm">Message</span><span>${esc(c.msg)}</span></div>` : ''}
    <button class="btn btn--outline btn--block" id="gcCopy">${icon('card', { size: 18 })} Copy code</button>
    ${c.status === 'active' ? '<button class="btn btn--outline btn--block" id="gcVoid" style="color:var(--danger);border-color:var(--danger)">Void card</button>' : ''}
  </div>`;
  const sheet = bottomSheet({ title: code, content: node });
  node.querySelector('#gcCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(code); } catch {} toast('Code copied', { kind: 'success' }); });
  node.querySelector('#gcVoid')?.addEventListener('click', async () => {
    sheet.close();
    if (await confirm('Void this gift card? The balance becomes unusable.')) {
      const list = all(); list.find((x) => x.code === code).status = 'void';
      save(list); haptic('success'); toast('Card voided'); render();
    }
  });
}

function issue() {
  const form = `
    <div class="field"><label class="field__label">Amount</label>
      <div class="chip-row" style="padding-inline:0">${[25, 50, 100, 200].map((a, i) => `<button type="button" class="chip${i === 1 ? ' is-active' : ''}" data-amt="${a}">${formatPrice(a)}</button>`).join('')}</div></div>
    <div class="field"><label class="field__label">Recipient (optional)</label><input class="input" id="gc_to" placeholder="@username or email"></div>
    <button class="btn btn--block" id="gc_save">Issue gift card</button>`;
  const sheet = bottomSheet({ title: 'Issue gift card', content: form });
  let amount = 50;
  sheet.el.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => {
    amount = +b.dataset.amt; sheet.el.querySelectorAll('[data-amt]').forEach((x) => x.classList.toggle('is-active', x === b));
  }));
  sheet.el.querySelector('#gc_save').addEventListener('click', () => {
    const list = all();
    list.unshift({ code: newCode(), amount, status: 'active', design: '#00C853', to: (sheet.el.querySelector('#gc_to').value || '').trim(), msg: '', date: new Date().toISOString() });
    save(list); haptic('success'); sheet.close(); toast('Gift card issued', { kind: 'success' }); render();
  });
}

seed();
render();
