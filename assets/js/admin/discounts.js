/**
 * Nova Kit — Admin discounts / campaigns
 * Automatic & scheduled discounts (percentage, fixed, BOGO, tiered) beyond promo codes.
 * Create/edit rules, toggle active. Demo persists in memory.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const TYPES = { percentage: 'Percentage off', fixed: 'Fixed amount off', bogo: 'Buy one get one', tiered: 'Spend & save' };
let filter = 'all';
const rules = [
  { id: 'd1', name: 'Summer 20% off electronics', type: 'percentage', value: 20, applies: 'Electronics', active: true, redeemed: 142, saved: 1980 },
  { id: 'd2', name: 'Spend $150, save $20', type: 'tiered', value: 20, applies: 'All products', active: true, redeemed: 63, saved: 1260 },
  { id: 'd3', name: 'BOGO on e-books', type: 'bogo', value: 100, applies: 'E-books', active: false, redeemed: 0, saved: 0 },
];

function card(d) {
  return `<div class="card card--pad" style="margin-bottom:12px">
    <div class="row-between">
      <div class="grow"><div class="semibold">${esc(d.name)}</div>
        <div class="muted text-sm">${TYPES[d.type]} · ${esc(d.applies)}</div></div>
      <label class="switch"><input type="checkbox" data-toggle="${d.id}" ${d.active ? 'checked' : ''}><span class="switch__track"></span></label>
    </div>
    <div class="row-between" style="margin-top:12px">
      <span class="status status--${d.active ? 'paid' : 'cancelled'}">${d.type === 'percentage' || d.type === 'bogo' ? d.value + '%' : formatPrice(d.value)}</span>
      <span class="muted text-sm">${d.redeemed} used · ${formatPrice(d.saved)} saved</span>
    </div>
    <div class="row gap-3" style="margin-top:12px">
      <button class="text-accent semibold text-sm" data-edit="${d.id}">Edit</button>
      <button class="semibold text-sm" style="color:var(--danger)" data-del="${d.id}">Delete</button>
    </div>
  </div>`;
}

function render() {
  const list = rules.filter((d) => filter === 'all' || (filter === 'active' ? d.active : !d.active));
  const active = rules.filter((d) => d.active).length;
  const saved = rules.reduce((s, d) => s + d.saved, 0);

  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Discounts', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="addBtn" aria-label="New discount">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('tag', { size: 18 })}</span>Active rules</span><span class="kpi__value">${active}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('card', { size: 18 })}</span>Customer savings</span><span class="kpi__value">${formatPrice(saved)}</span></div>
    </div>
    <div class="tabs-pill">${['all', 'active', 'inactive'].map((s) => `<button class="chip${s === filter ? ' is-active' : ''}" data-f="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>
    <div class="container" style="padding-top:0">${list.map(card).join('') || '<p class="muted text-sm">No discounts.</p>'}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  document.getElementById('addBtn').addEventListener('click', () => edit(null));
  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
  screen.querySelectorAll('[data-toggle]').forEach((t) => t.addEventListener('change', () => { rules.find((d) => d.id === t.dataset.toggle).active = t.checked; toast('Updated'); }));
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(rules.find((d) => d.id === b.dataset.edit))));
  screen.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await confirm('Delete this discount?')) { const i = rules.findIndex((d) => d.id === b.dataset.del); rules.splice(i, 1); toast('Deleted'); render(); }
  }));
}

function edit(d) {
  const rec = d || { type: 'percentage', applies: 'All products' };
  const form = `
    <div class="field"><label class="field__label">Name</label><input class="input" id="d_name" value="${esc(rec.name || '')}" placeholder="e.g. Weekend flash sale"></div>
    <div class="field"><label class="field__label">Type</label>
      <select class="select" id="d_type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${rec.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="form-grid">
      <div class="field"><label class="field__label">Value</label><input class="input" id="d_val" type="number" min="0" value="${rec.value ?? ''}"></div>
      <div class="field"><label class="field__label">Applies to</label><input class="input" id="d_app" value="${esc(rec.applies || '')}"></div>
    </div>
    <button class="btn btn--block" id="d_save">${d ? 'Save discount' : 'Create discount'}</button>`;
  const sheet = bottomSheet({ title: d ? 'Edit discount' : 'New discount', content: form });
  sheet.el.querySelector('#d_save').addEventListener('click', () => {
    const name = sheet.el.querySelector('#d_name').value.trim();
    if (!name) { toast('Name is required', { kind: 'danger' }); return; }
    const data = { name, type: sheet.el.querySelector('#d_type').value, value: +sheet.el.querySelector('#d_val').value, applies: sheet.el.querySelector('#d_app').value || 'All products' };
    if (d) Object.assign(d, data); else rules.unshift({ id: 'd' + Date.now().toString(36), active: true, redeemed: 0, saved: 0, ...data });
    haptic('success'); sheet.close(); toast('Discount saved', { kind: 'success' }); render();
  });
}

render();
