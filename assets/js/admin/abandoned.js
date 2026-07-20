/**
 * Nova Kit — Admin abandoned carts
 * Carts that were started but not checked out, with a one-tap reminder. Demo data; wire to
 * your backend to capture real carts and send recovery messages.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { demoAbandoned } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const carts = demoAbandoned.map((c) => ({ ...c, reminded: false }));
const initials = (n) => n === 'Guest' ? '👤' : n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function render() {
  const recoverable = carts.reduce((s, c) => s + c.value, 0);
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Abandoned Carts', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="remindAll" aria-label="Remind all">${icon('send', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('cart', { size: 18 })}</span>Abandoned</span><span class="kpi__value">${carts.length}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('card', { size: 18 })}</span>Recoverable</span><span class="kpi__value">${formatPrice(recoverable)}</span></div>
    </div>
    <div class="admin-section-title">Carts</div>
    <div class="list" style="margin-top:0">
      ${carts.map((c) => `<div class="data-row">
        <span class="data-row__avatar">${initials(c.customer)}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(c.customer)}</span>
          <span class="data-row__sub">${c.items} item(s) · ${formatDate(c.updated)}</span></span>
        <span class="data-row__end"><span class="semibold">${formatPrice(c.value)}</span>
          <button class="btn btn--sm ${c.reminded ? 'btn--outline' : 'btn--ghost'}" data-remind="${c.id}">${c.reminded ? 'Sent' : 'Remind'}</button></span>
      </div>`).join('')}
    </div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('orders');
  bindAdminChrome();

  const remind = (c) => { c.reminded = true; haptic('success'); };
  screen.querySelectorAll('[data-remind]').forEach((b) => b.addEventListener('click', () => {
    const c = carts.find((x) => x.id === b.dataset.remind); if (c.reminded) return;
    remind(c); toast(`Reminder sent to ${c.customer}`, { kind: 'success' }); render();
  }));
  document.getElementById('remindAll').addEventListener('click', () => {
    carts.forEach(remind); toast('Reminders sent to all', { kind: 'success' }); render();
  });
}

render();
