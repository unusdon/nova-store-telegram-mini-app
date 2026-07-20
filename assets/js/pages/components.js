/**
 * Nova Kit — Components showcase
 * A living style guide that renders every core component in the active theme, so buyers can
 * see the whole system (and test the Black/White toggle) at a glance.
 */
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { appBar, ratingStars, priceTag, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');

function block(title, body) {
  return `<div class="showcase-block"><h3>${title}</h3>${body}</div>`;
}

document.getElementById('appbar').innerHTML = appBar({ title: 'Components', back: 'index.html', themeToggle: true });
bindThemeToggle();

screen.innerHTML = `
  ${block('Buttons', `<div class="showcase-row">
    <button class="btn">Primary</button>
    <button class="btn btn--ghost">Ghost</button>
    <button class="btn btn--outline">Outline</button>
    <button class="btn btn--sm">Small</button>
    <button class="btn" disabled>Disabled</button>
  </div>`)}

  ${block('Chips', `<div class="showcase-row">
    <span class="chip is-active">Active</span><span class="chip">Default</span>
    <span class="chip">${icon('star', { size: 14, filled: true })} Rated</span>
  </div>`)}

  ${block('Badges & status', `<div class="showcase-row">
    <span class="status status--pending">Pending</span>
    <span class="status status--paid">Paid</span>
    <span class="status status--shipped">Shipped</span>
    <span class="status status--delivered">Delivered</span>
    <span class="status status--cancelled">Cancelled</span>
  </div>`)}

  ${block('Rating & price', `<div class="showcase-row" style="gap:20px">
    ${ratingStars(4.5, 128)} ${priceTag(89, 119)}
  </div>`)}

  ${block('Form controls', `
    <div class="field"><label class="field__label">Text input</label><input class="input" placeholder="Type here"></div>
    <div class="field"><label class="field__label">Select</label><select class="select"><option>Option A</option><option>Option B</option></select></div>
    <div class="row-between"><span>Switch</span><label class="switch"><input type="checkbox" checked><span class="switch__track"></span></label></div>
    <div class="segmented" style="margin-top:12px"><button class="is-active">One</button><button>Two</button><button>Three</button></div>
    <div class="row" style="margin-top:12px"><div class="stepper"><button>${icon('minus', { size: 16 })}</button><span class="stepper__value">2</span><button>${icon('plus', { size: 16 })}</button></div></div>
  `)}

  ${block('List rows', `<div class="list" style="margin:0">
    <div class="list-row"><span class="list-row__icon">${icon('bag', { size: 20 })}</span>
      <span class="list-row__text"><span class="list-row__title">List item</span><span class="list-row__sub">With subtitle</span></span>
      ${icon('chevron', { size: 18, cls: 'text-faint' })}</div>
  </div>`)}

  ${block('Overlays', `<div class="showcase-row">
    <button class="btn btn--ghost" id="toastBtn">Show toast</button>
    <button class="btn btn--ghost" id="sheetBtn">Open sheet</button>
  </div>`)}

  ${block('Skeleton', `<div class="skeleton" style="height:56px;border-radius:12px"></div>`)}
`;

document.getElementById('toastBtn').addEventListener('click', () => { haptic('success'); toast('This is a toast', { kind: 'success' }); });
document.getElementById('sheetBtn').addEventListener('click', () =>
  bottomSheet({ title: 'Bottom sheet', content: '<p class="muted">Sheets slide up for pickers, forms, and confirmations.</p>' }));
