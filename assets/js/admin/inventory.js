/**
 * Nova Kit — Admin inventory
 * Stock levels at a glance with low-stock highlighting; adjust stock via a bottom sheet.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, placeholder, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { dataService } from '../core/store.js';

adminBootstrap();

const screen = document.getElementById('screen');
let items = [];
const LOW = 15;

function row(p) {
  const cls = !p.inStock ? 'cancelled' : p.stock <= LOW ? 'pending' : 'delivered';
  const label = !p.inStock ? 'Out of stock' : `${p.stock} units`;
  return `<button class="data-row" data-id="${p.id}">
    <img class="data-row__avatar" src="${placeholder(p.emoji, p.color, 80, 80)}" alt="" width="40" height="40">
    <span class="data-row__main"><span class="data-row__title">${esc(p.name)}</span>
      <span class="data-row__sub">${esc(p.categoryId)}</span></span>
    <span class="status status--${cls}">${label}</span>
  </button>`;
}

function render() {
  const low = items.filter((p) => p.inStock && p.stock <= LOW).length;
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Inventory', back: 'index.html', menu: false });
  screen.innerHTML = `
    ${low ? `<div class="card card--pad row gap-2" style="color:var(--warning)">
      ${icon('bell', { size: 18 })} ${low} product${low > 1 ? 's' : ''} running low on stock</div>` : ''}
    <div class="admin-section-title">${items.length} products</div>
    <div class="list" style="margin-top:0">${items.map(row).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('products');
  bindAdminChrome();
  screen.querySelectorAll('[data-id]').forEach((b) =>
    b.addEventListener('click', () => adjust(items.find((p) => p.id === b.dataset.id))));
}

/* Square +/- stepper buttons flanking the stock input. */
const STEP_BTN = 'border:1px solid var(--border);border-radius:8px;width:40px;height:40px;display:grid;place-items:center';

function adjust(p) {
  haptic('selection');
  const form = `
    <div class="row gap-3" style="margin-bottom:16px">
      <img src="${placeholder(p.emoji, p.color, 120, 120)}" width="48" height="48" style="border-radius:12px" alt="">
      <div><div class="semibold">${esc(p.name)}</div><div class="muted text-sm">Current: ${p.stock} units</div></div>
    </div>
    <div class="field"><label class="field__label">New stock level</label>
      <div class="row gap-2">
        <button type="button" id="stkDown" aria-label="Decrease" style="${STEP_BTN}">${icon('minus', { size: 18 })}</button>
        <input class="input" id="stk" type="number" min="0" step="1" value="${p.stock}" style="text-align:center">
        <button type="button" id="stkUp" aria-label="Increase" style="${STEP_BTN}">${icon('plus', { size: 18 })}</button>
      </div>
    </div>
    <button class="btn btn--block" id="stkSave">Update stock</button>`;
  const sheet = bottomSheet({ title: 'Adjust stock', content: form });
  const input = sheet.el.querySelector('#stk');

  // Steppers never go below zero, so they can't push the field into an invalid state.
  const step = (d) => { input.value = String(Math.max(0, (parseInt(input.value, 10) || 0) + d)); haptic('selection'); };
  sheet.el.querySelector('#stkDown').addEventListener('click', () => step(-1));
  sheet.el.querySelector('#stkUp').addEventListener('click', () => step(1));

  sheet.el.querySelector('#stkSave').addEventListener('click', () => {
    // A blank/typed-garbage/negative field is a mistake, not a zero — reject it instead of coercing.
    const val = parseInt(input.value, 10);
    if (Number.isNaN(val) || val < 0) { toast('Enter a valid stock level', { kind: 'danger' }); haptic('error'); return; }
    p.stock = Math.max(0, val); p.inStock = p.stock > 0;
    haptic('success'); sheet.close(); toast('Stock updated (demo)', { kind: 'success' }); render();
  });
}

(async function init() { items = [...await dataService.getProducts()]; render(); })();
