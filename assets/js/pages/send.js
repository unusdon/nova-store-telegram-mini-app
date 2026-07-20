/**
 * Nova Kit — Send / Transfer
 * Send wallet balance to another user. Validates against the available balance, records the
 * transaction, and returns to the wallet.
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
let amount = '';

document.getElementById('appbar').innerHTML = pageHeader({ title: 'Send', subtitle: `Balance ${formatPrice(balance)}`, back: 'wallet.html' });
bindThemeToggle();

screen.innerHTML = `
  <div class="container" style="padding-top:16px">
    <div class="field"><label class="field__label">Send to</label>
      <input class="input" id="to" placeholder="@username or email" autocomplete="off"></div>
  </div>
  <div class="amount-entry">
    <div class="amount-entry__label">Amount</div>
    <div class="amount-input"><span class="amount-input__sym">${sym}</span>
      <input id="amt" inputmode="decimal" placeholder="0"></div>
    <div class="amount-avail">Available: ${formatPrice(balance)}</div>
    <div class="quick-amounts">${[10, 25, 50].map((a) => `<button class="chip" data-amt="${a}">${formatPrice(a)}</button>`).join('')}
      <button class="chip" data-amt="${balance.toFixed(2)}">Max</button></div>
  </div>
  <div class="container"><div class="field"><label class="field__label">Note (optional)</label>
    <input class="input" id="note" placeholder="What's it for?"></div></div>`;

bottombar.innerHTML = `<div class="bottom-bar"><button class="btn btn--block" id="sendBtn">Send money</button></div>`;

const amtEl = document.getElementById('amt');
amtEl.addEventListener('input', () => { amount = amtEl.value; });
screen.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => { amount = b.dataset.amt; amtEl.value = amount; haptic('selection'); }));

document.getElementById('sendBtn').addEventListener('click', () => {
  const to = document.getElementById('to').value.trim();
  const val = parseFloat(amount);
  if (!to) { toast('Enter a recipient', { kind: 'danger' }); return; }
  if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
  if (val > balance) { toast('Amount exceeds your balance', { kind: 'danger' }); haptic('error'); return; }
  const tx = addTransaction({ type: 'send', title: `To ${to}`, amount: -val, method: 'Wallet transfer', counterparty: to });
  haptic('success'); toast(`Sent ${formatPrice(val)} to ${esc(to)}`, { kind: 'success' });
  setTimeout(() => { location.href = `transaction.html?id=${encodeURIComponent(tx.id)}`; }, 700);
});
