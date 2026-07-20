/**
 * Nova Kit — Order confirmation
 * Celebratory confirmation with the order number, total, and next actions.
 */
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

bootstrap();
haptic('success');

const id = new URLSearchParams(location.search).get('id');
const order = dataService.getOrders().find((o) => o.id === id);
const screen = document.getElementById('screen');

screen.innerHTML = `
  <div class="success">
    <div class="success__check">${icon('check', { size: 48 })}</div>
    <h1>Thank you!</h1>
    <p class="muted">Your order has been placed successfully.</p>
    ${order ? `
      <div class="card card--pad success__card">
        <div class="row-between"><span class="muted">Order</span><span class="semibold">${esc(order.number)}</span></div>
        <div class="row-between"><span class="muted">Total</span><span class="semibold">${formatPrice(order.total)}</span></div>
        <div class="row-between"><span class="muted">Payment</span><span class="semibold">${esc(order.paymentMethod || '—')}</span></div>
      </div>` : ''}
    <div class="success__actions">
      ${order ? `<a class="btn btn--block" href="order.html?id=${encodeURIComponent(order.id)}">Track order</a>` : ''}
      <a class="btn btn--outline btn--block" href="index.html">Continue shopping</a>
    </div>
  </div>`;
