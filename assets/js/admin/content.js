/**
 * Nova Kit — Admin content
 * Manage home banners (add / edit / remove / reorder) and the store's static pages.
 * Banners persist under `nova:banners`; wire to your backend/CMS in production.
 */
import { config } from '../config.js';
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const KEY = `${config.data.persistNamespace}:banners`;
const screen = document.getElementById('screen');
const COLORS = ['#00FF88', '#5B6CFF', '#F59E0B', '#EC4899', '#A855F7'];
let banners = JSON.parse(localStorage.getItem(KEY) || 'null') || [
  { id: 'b1', title: 'Summer Sale', subtitle: 'Up to 40% off electronics', color: '#5B6CFF', emoji: '⚡', active: true },
  { id: 'b2', title: 'New Arrivals', subtitle: 'Fresh drops every week', color: '#00FF88', emoji: '✨', active: true },
];
const save = () => localStorage.setItem(KEY, JSON.stringify(banners));

const PAGES = [
  { name: 'Terms & Conditions', href: '../legal.html?doc=terms' },
  { name: 'Privacy Policy', href: '../legal.html?doc=privacy' },
  { name: 'Shipping & Returns', href: '../legal.html?doc=shipping' },
  { name: 'About', href: '../about.html' },
];

function bannerCard(b) {
  return `<div class="card card--pad" style="margin-bottom:12px">
    <div class="row gap-3">
      <div style="width:56px;height:56px;border-radius:12px;background:${b.color};display:flex;align-items:center;justify-content:center;font-size:24px;flex:none">${b.emoji}</div>
      <div class="grow"><div class="semibold">${esc(b.title)}</div><div class="muted text-sm">${esc(b.subtitle)}</div></div>
      <label class="switch"><input type="checkbox" data-active="${b.id}" ${b.active ? 'checked' : ''}><span class="switch__track"></span></label>
    </div>
    <div class="row gap-3" style="margin-top:12px">
      <button class="text-accent semibold text-sm" data-edit="${b.id}">Edit</button>
      <button class="semibold text-sm" style="color:var(--danger)" data-del="${b.id}">Delete</button>
    </div>
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Content', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="addBtn" aria-label="Add banner">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="admin-section-title">Home banners</div>
    <div class="container" style="padding-top:0">${banners.map(bannerCard).join('') || '<p class="muted text-sm">No banners yet.</p>'}</div>
    <div class="admin-section-title">Store pages</div>
    <div class="list" style="margin-top:0">
      ${PAGES.map((p) => `<a class="data-row" href="${p.href}">
        <span class="data-row__avatar">${icon('image', { size: 18 })}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(p.name)}</span>
          <span class="data-row__sub">Static page</span></span>${icon('edit', { size: 18, cls: 'text-faint' })}</a>`).join('')}
    </div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  document.getElementById('addBtn').addEventListener('click', () => edit(null));
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(banners.find((x) => x.id === b.dataset.edit))));
  screen.querySelectorAll('[data-active]').forEach((t) => t.addEventListener('change', () => { banners.find((x) => x.id === t.dataset.active).active = t.checked; save(); }));
  screen.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await confirm('Delete this banner?')) { banners = banners.filter((x) => x.id !== b.dataset.del); save(); toast('Banner deleted'); render(); }
  }));
}

function edit(b) {
  const d = b || { color: COLORS[0], emoji: '⚡' };
  const form = `
    <div class="field"><label class="field__label">Title</label><input class="input" id="c_title" value="${esc(d.title || '')}"></div>
    <div class="field"><label class="field__label">Subtitle</label><input class="input" id="c_sub" value="${esc(d.subtitle || '')}"></div>
    <div class="form-grid">
      <div class="field"><label class="field__label">Emoji</label><input class="input" id="c_emoji" value="${esc(d.emoji || '⚡')}"></div>
      <div class="field"><label class="field__label">Colour</label>
        <div class="swatches" id="c_sw">${COLORS.map((c) => `<span class="swatch ${c === d.color ? 'on' : ''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div></div>
    </div>
    <button class="btn btn--block" id="c_save">${b ? 'Save banner' : 'Add banner'}</button>`;
  const sheet = bottomSheet({ title: b ? 'Edit banner' : 'New banner', content: form });
  let color = d.color;
  sheet.el.querySelectorAll('[data-c]').forEach((s) => s.addEventListener('click', () => {
    color = s.dataset.c; sheet.el.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === s));
  }));
  sheet.el.querySelector('#c_save').addEventListener('click', () => {
    const title = sheet.el.querySelector('#c_title').value.trim();
    if (!title) { toast('Title is required', { kind: 'danger' }); return; }
    const rec = { title, subtitle: sheet.el.querySelector('#c_sub').value, emoji: sheet.el.querySelector('#c_emoji').value || '⚡', color };
    if (b) Object.assign(b, rec); else banners.push({ id: 'b' + Date.now().toString(36), active: true, ...rec });
    save(); haptic('success'); sheet.close(); toast('Banner saved', { kind: 'success' }); render();
  });
}

render();
