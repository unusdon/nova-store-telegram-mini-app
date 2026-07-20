/**
 * Nova Kit — Admin support
 * Respond to customer tickets (shared `nova:tickets`). List → thread with an agent reply box.
 */
import { config } from '../config.js';
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const KEY = `${config.data.persistNamespace}:tickets`;
const screen = document.getElementById('screen');
const getTickets = () => JSON.parse(localStorage.getItem(KEY) || 'null') || seed();
const save = (t) => localStorage.setItem(KEY, JSON.stringify(t));
function seed() {
  const t = [{ id: 'tk-1001', subject: 'Where is my order NV-1002?', status: 'open', date: '2024-07-02T09:00:00Z',
    messages: [{ from: 'me', text: 'My order shows shipped but no tracking updates in 3 days.', date: '2024-07-02T09:00:00Z' }] }];
  save(t); return t;
}

let openId = null;

function listView() {
  const tickets = getTickets();
  const openCount = tickets.filter((t) => t.status === 'open').length;
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Support', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('help', { size: 18 })}</span>Open</span><span class="kpi__value">${openCount}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('check', { size: 18 })}</span>Total</span><span class="kpi__value">${tickets.length}</span></div>
    </div>
    <div class="admin-section-title">Tickets</div>
    <div class="list" style="margin-top:0">
      ${tickets.map((tk) => `<button class="data-row" data-open="${tk.id}">
        <span class="data-row__avatar">${icon('help', { size: 18 })}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(tk.subject)}</span>
          <span class="data-row__sub">${esc(tk.messages[tk.messages.length - 1].text)}</span></span>
        <span class="status status--${tk.status === 'open' ? 'shipped' : 'delivered'}">${tk.status}</span>
      </button>`).join('')}
    </div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('customers');
  bindAdminChrome();
  screen.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => { openId = b.dataset.open; render(); }));
}

function threadView() {
  const tickets = getTickets();
  const tk = tickets.find((x) => x.id === openId);
  document.getElementById('appbar').innerHTML = adminHeader({
    title: tk.subject, back: 'javascript:void(0)', menu: false,
    actions: `<button class="appbar__btn" id="resolveBtn">${tk.status === 'open' ? 'Resolve' : 'Reopen'}</button>`,
  });
  screen.innerHTML = `<div class="thread" style="padding-bottom:80px">
    ${tk.messages.map((m) => `<div class="bubble ${m.from === 'them' ? 'me' : 'them'}">${esc(m.text)}
      <span class="bubble__time">${m.from === 'them' ? 'You · ' : 'Customer · '}${formatDate(m.date)}</span></div>`).join('')}
  </div>
  <div class="thread-compose"><input class="input" id="reply" placeholder="Reply to customer…" autocomplete="off">
    <button class="btn" id="send">${icon('send', { size: 18 })}</button></div>`;
  document.querySelector('.appbar__btn[href^="javascript"]').addEventListener('click', () => { openId = null; render(); });
  document.getElementById('resolveBtn').addEventListener('click', () => { tk.status = tk.status === 'open' ? 'resolved' : 'open'; save(tickets); haptic('success'); threadView(); });
  const send = () => {
    const input = document.getElementById('reply'); const text = input.value.trim(); if (!text) return;
    tk.messages.push({ from: 'them', text, date: new Date().toISOString() }); save(tickets); haptic('light'); toast('Reply sent'); threadView();
  };
  document.getElementById('send').addEventListener('click', send);
  document.getElementById('reply').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  bindAdminChrome();
}

function render() { if (openId) threadView(); else listView(); }
render();
