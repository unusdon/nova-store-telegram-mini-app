/**
 * Nova Kit — Transactions (wallet history)
 * Full activity list with All / Received / Spent filters; taps through to the detail page.
 */
import { bootstrap } from '../app.js';
import { formatPrice, formatDate } from '../core/format.js';
import { esc } from '../core/ui.js';
import { pageHeader, bindThemeToggle } from '../components.js';
import { getTransactions, TX_TYPES } from '../data/transactions.js';

bootstrap();

const screen = document.getElementById('screen');
let filter = 'all';

function row(t) {
  const meta = TX_TYPES[t.type] || { icon: '💳', label: t.type };
  const inbound = t.amount >= 0;
  return `<a class="tx-row" href="transaction.html?id=${encodeURIComponent(t.id)}">
    <span class="tx-icon">${meta.icon}</span>
    <span class="tx-body"><span class="tx-title">${esc(t.title)}</span>
      <span class="tx-sub">${formatDate(t.date)}${t.status !== 'completed' ? ' · ' + t.status : ''}</span></span>
    <span class="tx-amount ${inbound ? 'in' : ''}">${inbound ? '+' : '−'}${formatPrice(Math.abs(t.amount))}</span>
  </a>`;
}

function render() {
  let list = getTransactions();
  if (filter === 'in') list = list.filter((t) => t.amount >= 0);
  else if (filter === 'out') list = list.filter((t) => t.amount < 0);

  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Transactions', subtitle: `${list.length} entries`, back: 'wallet.html' });
  bindThemeToggle();

  screen.innerHTML = `<div class="fin-content">
    <div class="chip-row" style="padding-inline:0">
      ${[['all', 'All'], ['in', 'Received'], ['out', 'Spent']].map(([id, l]) =>
        `<button class="chip${filter === id ? ' is-active' : ''}" data-f="${id}">${l}</button>`).join('')}
    </div>
    ${list.length ? `<div class="tx-list">${list.map(row).join('')}</div>`
      : `<div class="empty-state"><div class="empty-state__emoji">🧾</div><h3>No transactions</h3></div>`}
  </div>`;

  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
}

render();
