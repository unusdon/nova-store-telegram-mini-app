/**
 * Nova Kit — Admin collections
 * Curated product groups (e.g. "New arrivals", "Staff picks") used to merchandise the storefront.
 * Create/edit a collection, toggle featured/visible. Demo persists in memory.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const collections = [
  { id: 'c1', name: 'New Arrivals', emoji: '✨', desc: 'The latest additions to the store', count: 12, visible: true, featured: true },
  { id: 'c2', name: 'Staff Picks', emoji: '⭐', desc: 'Hand-selected favourites', count: 8, visible: true, featured: false },
  { id: 'c3', name: 'Best Sellers', emoji: '🔥', desc: 'Most popular this month', count: 15, visible: true, featured: true },
  { id: 'c4', name: 'Clearance', emoji: '🏷️', desc: 'Last chance deals', count: 6, visible: false, featured: false },
];

function card(c) {
  return `<div class="card card--pad" style="margin-bottom:12px">
    <div class="row gap-3">
      <span class="data-row__avatar">${c.emoji}</span>
      <div class="grow"><div class="semibold">${esc(c.name)}${c.featured ? ' <span class="status status--paid" style="margin-inline-start:6px">Featured</span>' : ''}</div>
        <div class="muted text-sm">${esc(c.desc)} · ${c.count} products</div></div>
    </div>
    <div class="row-between" style="margin-top:12px">
      <label class="row gap-3" style="align-items:center"><span class="text-sm">Visible</span>
        <label class="switch"><input type="checkbox" data-vis="${c.id}" ${c.visible ? 'checked' : ''}><span class="switch__track"></span></label></label>
      <div class="row gap-3">
        <button class="text-accent semibold text-sm" data-edit="${c.id}">Edit</button>
        <button class="semibold text-sm" style="color:var(--danger)" data-del="${c.id}">Delete</button>
      </div>
    </div>
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Collections', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="addBtn" aria-label="New collection">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('grid', { size: 18 })}</span>Collections</span><span class="kpi__value">${collections.length}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('star', { size: 18 })}</span>Featured</span><span class="kpi__value">${collections.filter((c) => c.featured).length}</span></div>
    </div>
    <div class="container">${collections.map(card).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('products');
  bindAdminChrome();

  document.getElementById('addBtn').addEventListener('click', () => edit(null));
  screen.querySelectorAll('[data-vis]').forEach((t) => t.addEventListener('change', () => { collections.find((c) => c.id === t.dataset.vis).visible = t.checked; toast('Updated'); }));
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(collections.find((c) => c.id === b.dataset.edit))));
  screen.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await confirm('Delete this collection?')) { const i = collections.findIndex((c) => c.id === b.dataset.del); collections.splice(i, 1); toast('Deleted'); render(); }
  }));
}

function edit(c) {
  const rec = c || { emoji: '✨', featured: false };
  const form = `
    <div class="form-grid">
      <div class="field"><label class="field__label">Emoji</label><input class="input" id="c_emoji" value="${esc(rec.emoji)}" maxlength="2"></div>
      <div class="field"><label class="field__label">Products</label><input class="input" id="c_count" type="number" min="0" value="${rec.count ?? 0}"></div>
    </div>
    <div class="field"><label class="field__label">Name</label><input class="input" id="c_name" value="${esc(rec.name || '')}" placeholder="e.g. Summer Essentials"></div>
    <div class="field"><label class="field__label">Description</label><input class="input" id="c_desc" value="${esc(rec.desc || '')}"></div>
    <label class="row-between" style="padding:12px 0"><span>Feature on storefront</span>
      <label class="switch"><input type="checkbox" id="c_feat" ${rec.featured ? 'checked' : ''}><span class="switch__track"></span></label></label>
    <button class="btn btn--block" id="c_save">${c ? 'Save collection' : 'Create collection'}</button>`;
  const sheet = bottomSheet({ title: c ? 'Edit collection' : 'New collection', content: form });
  sheet.el.querySelector('#c_save').addEventListener('click', () => {
    const name = sheet.el.querySelector('#c_name').value.trim();
    if (!name) { toast('Name is required', { kind: 'danger' }); return; }
    const data = { name, emoji: sheet.el.querySelector('#c_emoji').value || '✨', desc: sheet.el.querySelector('#c_desc').value, count: +sheet.el.querySelector('#c_count').value, featured: sheet.el.querySelector('#c_feat').checked };
    if (c) Object.assign(c, data); else collections.unshift({ id: 'c' + Date.now().toString(36), visible: true, ...data });
    haptic('success'); sheet.close(); toast('Collection saved', { kind: 'success' }); render();
  });
}

render();
