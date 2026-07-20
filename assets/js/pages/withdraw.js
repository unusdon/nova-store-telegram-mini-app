/**
 * Nova Kit — Withdraw / Cash-out
 * Move wallet balance to a bank account or card. Records a pending withdrawal transaction.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { formatPrice } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';
import { walletBalance, addTransaction } from '../data/transactions.js';

bootstrap();

const screen = document.getElementById('screen');
const bottombar = document.getElementById('bottombar');
const sym = config.currency.symbol;
const balance = walletBalance();
const DEST = [['bank', '🏦 Bank ••6789'], ['card', '💳 Visa •••• 4242']];
let amount = '';
let dest = 'bank';

document.getElementById('appbar').innerHTML = pageHeader({ title: 'Withdraw', subtitle: `Balance ${formatPrice(balance)}`, back: 'wallet.html' });
bindThemeToggle();

screen.innerHTML = `
  <div class="amount-entry">
    <div class="amount-entry__label">Withdraw amount</div>
    <div class="amount-input"><span class="amount-input__sym">${sym}</span>
      <input id="amt" inputmode="decimal" placeholder="0"></div>
    <div class="amount-avail">Available: ${formatPrice(balance)} · 1% fee</div>
    <div class="quick-amounts">${[25, 50].map((a) => `<button class="chip" data-amt="${a}">${formatPrice(a)}</button>`).join('')}
      <button class="chip" data-amt="${balance.toFixed(2)}">Max</button></div>
  </div>
  <div class="container">
    <div class="field"><label class="field__label">Destination</label>
      <div class="list" style="margin:0">
        ${DEST.map(([id, l]) => `<label class="pick">
          <input type="radio" name="dest" value="${id}" ${dest === id ? 'checked' : ''}>
          <span class="pick__body"><span class="list-row__title">${l}</span></span></label>`).join('')}
      </div></div>
  </div>`;

bottombar.innerHTML = `<div class="bottom-bar"><button class="btn btn--block" id="wBtn">Withdraw</button></div>`;

const amtEl = document.getElementById('amt');
amtEl.addEventListener('input', () => { amount = amtEl.value; });
screen.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => { amount = b.dataset.amt; amtEl.value = amount; haptic('selection'); }));
screen.querySelectorAll('input[name="dest"]').forEach((r) => r.addEventListener('change', () => { dest = r.value; }));

document.getElementById('wBtn').addEventListener('click', () => {
  const val = parseFloat(amount);
  if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
  if (val > balance) { toast('Amount exceeds your balance', { kind: 'danger' }); haptic('error'); return; }
  const label = DEST.find(([id]) => id === dest)[1].replace(/^\S+\s/, '');
  const tx = addTransaction({ type: 'withdraw', title: `Withdraw to ${label}`, amount: -val, status: 'pending', method: label });
  haptic('success'); toast('Withdrawal requested', { kind: 'success' });
  setTimeout(() => { location.href = `transaction.html?id=${encodeURIComponent(tx.id)}`; }, 700);
});
