/**
 * Nova Kit — Admin marketing / discounts
 * Manage promo codes (sourced from config) and create new ones. Demo persists to memory;
 * wire the create form to your API to make it permanent.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome, openDrawer } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
// Start from configured codes; new ones are added to this working copy for the demo.
const codes = Object.entries(config.commerce.promoCodes).map(([code, v]) => ({ code, ...v, enabled: true }));

function valueLabel(c) {
  return c.type === 'percentage' ? `${c.value}% off` : `${formatPrice(c.value)} off`;
}

function card(c) {
  return `<div class="card card--pad promo-card">
    <div class="row-between">
      <div class="row gap-2"><span class="kpi__icon">${icon('tag', { size: 18 })}</span>
        <div><div class="semibold">${esc(c.code)}</div><div class="muted text-sm">${esc(c.label)}</div></div></div>
      <label class="switch"><input type="checkbox" data-toggle="${esc(c.code)}" ${c.enabled ? 'checked' : ''}>
        <span class="switch__track"></span></label>
    </div>
    <div class="row-between" style="margin-top:12px">
      <span class="status status--paid">${valueLabel(c)}</span>
      <span class="muted text-sm">${c.type}</span>
    </div>
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Marketing', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="addBtn" aria-label="New discount">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="admin-section-title">Discount codes (${codes.length})</div>
    <div class="stack">${codes.map(card).join('')}</div>
  `;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  document.getElementById('addBtn').addEventListener('click', openCreate);
  document.getElementById('adminMoreBtn')?.addEventListener('click', openDrawer);
  screen.querySelectorAll('[data-toggle]').forEach((t) => t.addEventListener('change', () => {
    const c = codes.find((x) => x.code === t.dataset.toggle); c.enabled = t.checked;
    toast(`${c.code} ${c.enabled ? 'enabled' : 'disabled'}`);
  }));
}

function openCreate() {
  const form = `
    <div class="field"><label class="field__label">Code</label><input class="input" id="d_code" placeholder="SUMMER25" autocomplete="off"></div>
    <div class="field"><label class="field__label">Label</label><input class="input" id="d_label" placeholder="25% summer sale"></div>
    <div class="field"><label class="field__label">Type</label>
      <select class="select" id="d_type"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></div>
    <div class="field"><label class="field__label">Value</label><input class="input" id="d_value" type="number" min="0" step="1" placeholder="25"></div>
    <button class="btn btn--block" id="d_save">Create discount</button>`;
  const sheet = bottomSheet({ title: 'New discount', content: form });
  sheet.el.querySelector('#d_save').addEventListener('click', () => {
    const v = (id) => sheet.el.querySelector('#' + id).value.trim();
    if (!v('d_code') || !v('d_value')) { toast('Code and value are required', { kind: 'danger' }); return; }
    codes.push({ code: v('d_code').toUpperCase(), label: v('d_label') || valueForLabel(v), type: v('d_type'), value: parseFloat(v('d_value')), enabled: true });
    haptic('success'); sheet.close(); toast('Discount created (demo)', { kind: 'success' }); render();
  });
}
function valueForLabel() { return 'New discount'; }

render();
