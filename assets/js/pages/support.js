/**
 * Nova Kit — Support (customer)
 * A ticket list + a conversation thread with a compose bar, plus "new ticket". Tickets are
 * stored under `nova:tickets` and shared with the admin Support page.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:tickets`;
const screen = document.getElementById('screen');
const getTickets = () => JSON.parse(localStorage.getItem(KEY) || 'null') || seed();
const setTickets = (t) => localStorage.setItem(KEY, JSON.stringify(t));

function seed() {
  const t = [{ id: 'tk-1001', subject: 'Where is my order NV-1002?', status: 'open',
    date: '2024-07-02T09:00:00Z', messages: [
      { from: 'me', text: 'Hi, my order shows shipped but no tracking updates in 3 days.', date: '2024-07-02T09:00:00Z' },
      { from: 'them', text: 'Thanks for reaching out! Your parcel is in transit and should arrive by Friday. Here is your tracking link.', date: '2024-07-02T10:15:00Z' },
    ] }];
  setTickets(t); return t;
}

function listView() {
  const tickets = getTickets();
  document.getElementById('appbar').innerHTML = pageHeader({
    title: 'Support', subtitle: 'Your conversations', back: 'profile.html',
    action: `<button class="hbtn" id="newBtn" aria-label="New ticket">${icon('plus', { size: 24 })}</button>`,
  });
  bindThemeToggle();

  screen.innerHTML = tickets.length ? `<div class="list" style="margin-top:16px">
    ${tickets.map((tk) => `<a class="ticket-item" href="support.html?ticket=${tk.id}">
      <span class="ticket-item__icon">${icon('help', { size: 18 })}</span>
      <span class="ticket-item__body"><span class="ticket-item__title">${esc(tk.subject)}</span>
        <span class="ticket-item__sub">${esc(tk.messages[tk.messages.length - 1].text)}</span></span>
      <span class="status status--${tk.status === 'open' ? 'shipped' : 'delivered'}">${tk.status}</span>
    </a>`).join('')}</div>`
    : `<div class="empty-state" style="padding-top:60px"><div class="empty-state__emoji">💬</div>
        <h3>No conversations</h3><p>Start a ticket and our team will reply.</p>
        <button class="btn" id="newFirst">New ticket</button></div>`;

  document.getElementById('newBtn').addEventListener('click', openNew);
  document.getElementById('newFirst')?.addEventListener('click', openNew);
}

function openNew() {
  const form = `
    <div class="field"><label class="field__label">Subject</label><input class="input" id="s_subj" placeholder="How can we help?"></div>
    <div class="field"><label class="field__label">Message</label><textarea class="textarea" id="s_msg" placeholder="Describe your issue"></textarea></div>
    <button class="btn btn--block" id="s_save">Send</button>`;
  const sheet = bottomSheet({ title: 'New ticket', content: form });
  sheet.el.querySelector('#s_save').addEventListener('click', () => {
    const subj = sheet.el.querySelector('#s_subj').value.trim();
    const msg = sheet.el.querySelector('#s_msg').value.trim();
    if (!subj || !msg) { toast('Add a subject and message', { kind: 'danger' }); return; }
    const tickets = getTickets();
    const id = 'tk-' + Date.now().toString(36);
    tickets.unshift({ id, subject: subj, status: 'open', date: new Date().toISOString(), messages: [{ from: 'me', text: msg, date: new Date().toISOString() }] });
    setTickets(tickets); haptic('success'); sheet.close();
    location.href = `support.html?ticket=${id}`;
  });
}

function threadView(id) {
  const tickets = getTickets();
  const tk = tickets.find((x) => x.id === id);
  if (!tk) { location.href = 'support.html'; return; }
  document.getElementById('appbar').innerHTML = pageHeader({ title: tk.subject, subtitle: `Ticket ${tk.id}`, back: 'support.html' });
  bindThemeToggle();

  screen.innerHTML = `<div class="thread" style="padding-bottom:80px">
    ${tk.messages.map((m) => `<div class="bubble ${m.from === 'me' ? 'me' : 'them'}">${esc(m.text)}
      <span class="bubble__time">${formatDate(m.date)}</span></div>`).join('')}
  </div>
  <div class="thread-compose"><input class="input" id="reply" placeholder="Type a message…" autocomplete="off">
    <button class="btn" id="send">${icon('send', { size: 18 })}</button></div>`;

  const send = () => {
    const input = document.getElementById('reply');
    const text = input.value.trim(); if (!text) return;
    tk.messages.push({ from: 'me', text, date: new Date().toISOString() });
    setTickets(tickets); haptic('light'); threadView(id);
  };
  document.getElementById('send').addEventListener('click', send);
  document.getElementById('reply').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

const id = new URLSearchParams(location.search).get('ticket');
if (id) threadView(id); else listView();
