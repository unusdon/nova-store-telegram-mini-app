/**
 * Nova Kit — Transaction detail
 * Full breakdown of one wallet transaction: amount, status, and metadata.
 */
import { bootstrap } from '../app.js';
import { formatPrice, formatDate } from '../core/format.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { pageHeader, bindThemeToggle } from '../components.js';
import { getTransaction, TX_TYPES } from '../data/transactions.js';

bootstrap();

const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
const tx = getTransaction(id);
const STATUS_CLASS = { completed: 'delivered', pending: 'pending', failed: 'cancelled' };

function line(label, value, copy) {
  return `<div class="detail-row"><span class="detail-label">${esc(label)}</span>
    <span class="detail-value">${esc(value)}${copy ? ` <button class="text-accent semibold text-sm" data-copy="${esc(value)}">Copy</button>` : ''}</span></div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Transaction', back: 'transactions.html' });
  bindThemeToggle();

  if (!tx) {
    screen.innerHTML = `<div class="empty-state" style="padding-top:60px"><div class="empty-state__emoji">🧐</div>
      <h3>Transaction not found</h3><a class="btn" href="transactions.html">All transactions</a></div>`;
    return;
  }
  const meta = TX_TYPES[tx.type] || { icon: '💳', label: tx.type };
  const inbound = tx.amount >= 0;
  const fee = tx.type === 'withdraw' ? Math.abs(tx.amount) * 0.01 : 0;

  screen.innerHTML = `
    <div class="tx-detail-hero">
      <div class="tx-icon">${meta.icon}</div>
      <div class="tx-detail-amount ${inbound ? 'in' : ''}">${inbound ? '+' : '−'}${formatPrice(Math.abs(tx.amount))}</div>
      <div class="muted">${esc(tx.title)}</div>
      <div class="tx-detail-status"><span class="status status--${STATUS_CLASS[tx.status] || 'pending'}">${tx.status}</span></div>
    </div>
    <div class="detail-card">
      ${line('Type', meta.label)}
      ${line('Date', formatDate(tx.date))}
      ${line('Method', tx.method || '—')}
      ${tx.counterparty ? line('Counterparty', tx.counterparty) : ''}
      ${fee ? line('Fee', formatPrice(fee)) : ''}
      ${line('Reference', tx.reference || tx.id, true)}
      ${line('Transaction ID', tx.id, true)}
    </div>
    <div class="container" style="margin-top:16px">
      <a class="btn btn--outline btn--block" href="support.html">${icon('help', { size: 18 })} Report a problem</a>
    </div>`;

  screen.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch {} toast('Copied', { kind: 'success' });
  }));
}

render();
