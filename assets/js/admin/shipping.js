/**
 * Nova Kit — Admin shipping
 * Configure shipping zones and rates plus the free-shipping threshold. Zones can be added, edited
 * (tap a row), deleted, and toggled active/inactive. Demo previews the values (seeded from config);
 * wire `save()` to persist to your backend.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const zones = [
  { id: 'z1', name: 'Domestic', rate: config.commerce.shippingFlat, eta: '3–5 days', active: true },
  { id: 'z2', name: 'Express', rate: config.commerce.shippingFlat + 8, eta: '1–2 days', active: true },
  { id: 'z3', name: 'International', rate: 24.99, eta: '7–14 days', active: true },
];

/** Shared zone form (add + edit sheets use the same fields). */
function zoneForm(z = {}, cta = 'Add zone', extra = '') {
  return `
    <div class="field"><label class="field__label">Zone name</label>
      <input class="input" id="z_name" placeholder="Europe" value="${esc(z.name || '')}"></div>
    <div class="form-grid">
      <div class="field"><label class="field__label">Rate</label>
        <input class="input" id="z_rate" type="number" min="0" step="0.01" placeholder="12.00" value="${z.rate == null ? '' : esc(z.rate)}"></div>
      <div class="field"><label class="field__label">ETA</label>
        <input class="input" id="z_eta" placeholder="3–6 days" value="${esc(z.eta || '')}"></div>
    </div>
    <button class="btn btn--block" id="z_save">${esc(cta)}</button>
    ${extra}`;
}

/** Reads + validates the sheet inputs. Returns null (after a danger toast) when invalid. */
function readZoneForm(sheet) {
  const name = sheet.el.querySelector('#z_name').value.trim();
  if (!name) { toast('Zone name is required', { kind: 'danger' }); haptic('error'); return null; }
  const rate = parseFloat(sheet.el.querySelector('#z_rate').value || '0') || 0;
  if (rate < 0) { toast('Rate cannot be negative', { kind: 'danger' }); haptic('error'); return null; }
  return { name, rate, eta: sheet.el.querySelector('#z_eta').value.trim() || '—' };
}

function zoneRow(z) {
  return `<div class="data-row">
    <span class="data-row__avatar">${icon('truck', { size: 18 })}</span>
    <button class="data-row__main" data-edit="${esc(z.id)}"
      style="background:none;border:0;padding:0;text-align:start;font:inherit;color:inherit;cursor:pointer">
      <span class="data-row__title">${esc(z.name)}</span>
      <span class="data-row__sub">${esc(z.eta)}</span>
    </button>
    <span class="data-row__end">
      <span class="semibold">${formatPrice(z.rate)}</span>
      <label class="switch"><input type="checkbox" data-toggle="${esc(z.id)}"${z.active ? ' checked' : ''}>
        <span class="switch__track"></span></label>
    </span>
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Shipping', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="addZone" aria-label="Add zone">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="admin-section-title">Shipping zones</div>
    <div class="list" style="margin-top:0">${zones.map(zoneRow).join('')}</div>
    <div class="admin-section-title">Rules</div>
    <div class="container">
      <div class="field"><label class="field__label">Free shipping over</label>
        <input class="input" id="free" type="number" min="0" step="1" value="${config.commerce.freeShippingThreshold}"></div>
      <div class="list-row" style="border:1px solid var(--border);border-radius:var(--radius-lg)">
        <span class="list-row__text"><span class="list-row__title">Charge tax on shipping</span></span>
        <label class="switch"><input type="checkbox"><span class="switch__track"></span></label>
      </div>
    </div>`;
  document.getElementById('bottombar').innerHTML =
    `<div class="bottom-bar"><button class="btn btn--block" id="save">Save shipping</button></div>`;

  document.getElementById('save').addEventListener('click', () => { haptic('success'); toast('Shipping saved (demo)', { kind: 'success' }); });
  document.getElementById('addZone').addEventListener('click', addZone);
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editZone(b.dataset.edit)));
  screen.querySelectorAll('[data-toggle]').forEach((c) => c.addEventListener('change', () => toggleZone(c.dataset.toggle, c.checked)));
  bindAdminChrome();
}

function toggleZone(id, active) {
  const z = zones.find((x) => x.id === id);
  if (!z) return;
  z.active = active;
  haptic('selection');
  toast(`${z.name} ${active ? 'enabled' : 'disabled'} (demo)`, { kind: 'success' });
}

function addZone() {
  haptic('selection');
  const sheet = bottomSheet({ title: 'New zone', content: zoneForm() });
  sheet.el.querySelector('#z_save').addEventListener('click', () => {
    const data = readZoneForm(sheet);
    if (!data) return;
    zones.push({ id: 'z' + Date.now(), active: true, ...data });
    haptic('success'); sheet.close(); toast('Zone added (demo)', { kind: 'success' }); render();
  });
}

function editZone(id) {
  const z = zones.find((x) => x.id === id);
  if (!z) return;
  haptic('selection');
  const del = '<button class="btn btn--outline btn--block" id="z_del" style="margin-top:8px;color:var(--danger);border-color:var(--danger)">Delete zone</button>';
  const sheet = bottomSheet({ title: 'Edit zone', content: zoneForm(z, 'Save changes', del) });

  sheet.el.querySelector('#z_save').addEventListener('click', () => {
    const data = readZoneForm(sheet);
    if (!data) return;
    Object.assign(z, data);
    haptic('success'); sheet.close(); toast('Zone updated (demo)', { kind: 'success' }); render();
  });

  sheet.el.querySelector('#z_del').addEventListener('click', async () => {
    if (!await confirm(`Delete "${z.name}"?`)) return;
    const i = zones.indexOf(z);
    if (i > -1) zones.splice(i, 1);
    haptic('success'); sheet.close(); toast('Zone deleted (demo)', { kind: 'success' }); render();
  });
}

render();
