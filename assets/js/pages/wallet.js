/**
 * Nova Kit — Wallet
 * Balance card, quick actions (Top up / Send / Request / Withdraw), and a recent-activity
 * preview backed by the shared transactions store. "See all" opens the full history.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, sectionHeader, bindThemeToggle } from '../components.js';
import { getTransactions, walletBalance, addTransaction, TX_TYPES } from '../data/transactions.js';

bootstrap();

const screen = document.getElementById('screen');
const sym = config.currency.symbol;

function actions() {
  const items = [
    { icon: 'plus', label: 'Top up', act: topUp },
    { icon: 'send', label: 'Send', href: 'send.html' },
    { icon: 'download', label: 'Request', href: 'payment-request.html' },
    { icon: 'card', label: 'Withdraw', href: 'withdraw.html' },
  ];
  return `<div class="wallet-actions" style="grid-template-columns:repeat(4,1fr)">
    ${items.map((a) => `<${a.href ? 'a' : 'button'} class="wallet-act" ${a.href ? `href="${a.href}"` : `data-act="${a.label}"`}>
      <span class="wallet-act__icon">${icon(a.icon, { size: 20 })}</span><span>${a.label}</span>
    </${a.href ? 'a' : 'button'}>`).join('')}
  </div>`;
}

function render() {
  const balance = walletBalance();
  const tx = getTransactions().slice(0, 5);

  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Wallet', back: 'profile.html' });
  bindThemeToggle();

  screen.innerHTML = `
    <div class="wallet-card">
      <small>Available balance</small>
      <div class="wallet-balance">${formatPrice(balance)}</div>
    </div>
    ${actions()}
    ${sectionHeader('Recent activity', 'transactions.html')}
    <div class="tx-list" style="margin:0 16px">
      ${tx.map((t) => { const m = TX_TYPES[t.type] || { icon: '💳' }; const inb = t.amount >= 0;
        return `<a class="tx-row" href="transaction.html?id=${encodeURIComponent(t.id)}">
          <span class="tx-icon">${m.icon}</span>
          <span class="tx-body"><span class="tx-title">${esc(t.title)}</span>
            <span class="tx-sub">${formatDate(t.date)}${t.status !== 'completed' ? ' · ' + t.status : ''}</span></span>
          <span class="tx-amount ${inb ? 'in' : ''}">${inb ? '+' : '−'}${formatPrice(Math.abs(t.amount))}</span></a>`; }).join('')}
    </div>
    <div style="height:24px"></div>`;

  screen.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', topUp));
}

function topUp() {
  const amounts = [25, 50, 100, 200];
  const form = `<div class="quick-amounts" style="justify-content:flex-start">
    ${amounts.map((a) => `<button class="chip" data-amt="${a}">${formatPrice(a)}</button>`).join('')}</div>
    <div class="field" style="margin-top:16px"><label class="field__label">Custom amount (${sym})</label>
      <input class="input" id="amt" inputmode="decimal" placeholder="0"></div>
    <button class="btn btn--block" id="tu">Add funds</button>`;
  const sheet = bottomSheet({ title: 'Top up wallet', content: form });
  const amtEl = sheet.el.querySelector('#amt');
  sheet.el.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => { amtEl.value = b.dataset.amt; }));
  sheet.el.querySelector('#tu').addEventListener('click', () => {
    const val = parseFloat(amtEl.value);
    if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); return; }
    addTransaction({ type: 'topup', title: 'Top-up · Visa •••• 4242', amount: val, method: 'Visa •••• 4242' });
    haptic('success'); sheet.close(); toast(`Added ${formatPrice(val)}`, { kind: 'success' }); render();
  });
}

render();
