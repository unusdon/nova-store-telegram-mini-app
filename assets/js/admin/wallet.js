/**
 * Nova Kit — Admin wallet management
 * Overview of store credit, per-customer wallet balances, and credit/debit adjustments.
 * Balances live in memory for the demo — wire to your backend to persist.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { demoCustomers } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
// Seed each demo customer with a wallet balance + recent adjustments (in-memory).
const wallets = demoCustomers.map((c, i) => ({
  id: c.id, name: c.name, handle: c.handle,
  balance: [120, 0, 45, 15, 260][i % 5],
  tx: [{ label: 'Cashback', amount: [12, 0, 5, 3, 20][i % 5], date: '2024-06-30' }],
}));
const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function render() {
  const total = wallets.reduce((s, w) => s + w.balance, 0);
  const funded = wallets.filter((w) => w.balance > 0).length;

  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Wallets', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('card', { size: 18 })}</span>Outstanding credit</span>
        <span class="kpi__value">${formatPrice(total)}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('users', { size: 18 })}</span>Funded wallets</span>
        <span class="kpi__value">${funded}/${wallets.length}</span></div>
    </div>
    <div class="admin-section-title">Customer wallets</div>
    <div class="list" style="margin-top:0">
      ${wallets.map((w) => `<button class="data-row" data-id="${w.id}">
        <span class="data-row__avatar">${initials(w.name)}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(w.name)}</span>
          <span class="data-row__sub">${esc(w.handle)}</span></span>
        <span class="data-row__end"><span class="semibold" style="color:${w.balance ? 'var(--accent)' : 'var(--text-muted)'}">${formatPrice(w.balance)}</span></span>
      </button>`).join('')}
    </div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('customers');
  bindAdminChrome();

  screen.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => manage(wallets.find((w) => w.id === b.dataset.id))));
}

function manage(w) {
  const txRows = w.tx.map((tr) => `<div class="summary__row"><span>${esc(tr.label)} · ${tr.date}</span>
    <span style="color:${tr.amount >= 0 ? 'var(--success)' : 'var(--text)'}">${tr.amount >= 0 ? '+' : '−'}${formatPrice(Math.abs(tr.amount))}</span></div>`).join('');
  const form = `
    <div class="row-between" style="margin-bottom:16px">
      <div><div class="semibold">${esc(w.name)}</div><div class="muted text-sm">${esc(w.handle)}</div></div>
      <div style="text-align:right"><div class="muted text-sm">Balance</div><div class="semibold" style="font-size:20px">${formatPrice(w.balance)}</div></div>
    </div>
    <div class="field"><label class="field__label">Amount</label>
      <input class="input" id="amt" type="number" min="0" step="0.01" placeholder="0.00"></div>
    <div class="field"><label class="field__label">Reason</label>
      <input class="input" id="reason" placeholder="Goodwill credit, refund, correction…"></div>
    <div class="row gap-2">
      <button class="btn" id="credit" style="flex:1">Credit</button>
      <button class="btn btn--outline" id="debit" style="flex:1">Debit</button>
    </div>
    ${w.tx.length ? `<div class="admin-section-title" style="padding-inline:0">Recent</div><div class="summary" style="padding:0">${txRows}</div>` : ''}`;
  const sheet = bottomSheet({ title: 'Manage wallet', content: form });

  /* `sign` is +1 for a credit, −1 for a debit; the input itself is always a positive amount. */
  const apply = (sign) => {
    const amt = parseFloat(sheet.el.querySelector('#amt').value);
    if (!amt || amt <= 0 || Number.isNaN(amt)) {
      toast('Enter an amount', { kind: 'danger' }); haptic('error'); return;
    }
    const delta = sign * amt;
    if (w.balance + delta < 0) {
      toast('Balance cannot go below zero', { kind: 'danger' }); haptic('error'); return;
    }
    w.balance += delta;
    w.tx.unshift({
      label: sheet.el.querySelector('#reason').value || 'Adjustment',
      amount: delta,
      date: new Date().toISOString().slice(0, 10),
    });
    haptic('success'); sheet.close();
    toast(`${sign > 0 ? 'Credited' : 'Debited'} ${formatPrice(amt)}`, { kind: 'success' });
    render();
  };
  sheet.el.querySelector('#credit').addEventListener('click', () => apply(1));
  sheet.el.querySelector('#debit').addEventListener('click', () => apply(-1));
}

render();
