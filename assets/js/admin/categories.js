/**
 * Nova Kit — Admin categories
 * List categories with their subcategory counts; add a new category via a bottom sheet. Tapping a
 * row opens an "Edit category" sheet to rename / re-type it or delete it. In-memory demo state.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { dataService } from '../core/store.js';

adminBootstrap();

const screen = document.getElementById('screen');
let categories = [];

function row(c) {
  const subCount = (c.subcategories || []).reduce((n, s) => n + (s.count || 0), 0);
  return `<button class="data-row" data-edit="${esc(c.id)}">
    <span class="data-row__avatar">${esc(c.icon || '📦')}</span>
    <span class="data-row__main"><span class="data-row__title">${esc(c.name)}</span>
      <span class="data-row__sub">${esc(c.type)} · ${(c.subcategories || []).length} subcategories · ${subCount} items</span></span>
    ${icon('chevron', { size: 18, cls: 'text-faint' })}
  </button>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Categories', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="addBtn" aria-label="Add category">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="admin-section-title">${categories.length} categories</div>
    <div class="list" style="margin-top:0">${categories.map(row).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('products');
  bindAdminChrome();
  document.getElementById('addBtn').addEventListener('click', openAdd);
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openEdit(b.dataset.edit)));
}

/** Shared category form (add + edit sheets use the same fields). */
function catForm(c = {}, cta = 'Add category', extra = '') {
  const type = c.type || 'physical';
  return `
    <div class="field"><label class="field__label">Name</label>
      <input class="input" id="c_name" placeholder="Accessories" value="${esc(c.name || '')}"></div>
    <div class="field"><label class="field__label">Emoji</label>
      <input class="input" id="c_icon" placeholder="🎒" value="${esc(c.icon || '📦')}"></div>
    <div class="field"><label class="field__label">Type</label>
      <select class="select" id="c_type">
        <option value="physical"${type === 'physical' ? ' selected' : ''}>Physical</option>
        <option value="digital"${type === 'digital' ? ' selected' : ''}>Digital</option>
      </select></div>
    <button class="btn btn--block" id="c_save">${esc(cta)}</button>
    ${extra}`;
}

/** Reads + validates the sheet inputs. Returns null (after a danger toast) when invalid. */
function readCatForm(sheet) {
  const name = sheet.el.querySelector('#c_name').value.trim();
  if (!name) { toast('Name is required', { kind: 'danger' }); haptic('error'); return null; }
  return {
    name,
    icon: sheet.el.querySelector('#c_icon').value || '📦',
    type: sheet.el.querySelector('#c_type').value,
  };
}

function openAdd() {
  haptic('selection');
  const sheet = bottomSheet({ title: 'New category', content: catForm() });
  sheet.el.querySelector('#c_save').addEventListener('click', () => {
    const data = readCatForm(sheet);
    if (!data) return;
    categories.push({ id: data.name.toLowerCase().replace(/\s+/g, '-'), ...data, subcategories: [] });
    haptic('success'); sheet.close(); toast('Category added (demo)', { kind: 'success' }); render();
  });
}

function openEdit(id) {
  const c = categories.find((x) => x.id === id);
  if (!c) return;
  haptic('selection');
  const del = `<button class="btn btn--outline btn--block" id="c_del" style="margin-top:8px;color:var(--danger);border-color:var(--danger)">${icon('trash', { size: 18 })} Delete category</button>`;
  const sheet = bottomSheet({ title: 'Edit category', content: catForm(c, 'Save changes', del) });

  sheet.el.querySelector('#c_save').addEventListener('click', () => {
    const data = readCatForm(sheet);
    if (!data) return;
    Object.assign(c, data);
    haptic('success'); sheet.close(); toast('Category saved (demo)', { kind: 'success' }); render();
  });

  sheet.el.querySelector('#c_del').addEventListener('click', async () => {
    if (!await confirm(`Delete "${c.name}"?`)) return;
    const i = categories.indexOf(c);
    if (i > -1) categories.splice(i, 1);
    haptic('success'); sheet.close(); toast('Category deleted (demo)', { kind: 'success' }); render();
  });
}

(async function init() { categories = [...await dataService.getCategories()]; render(); })();
