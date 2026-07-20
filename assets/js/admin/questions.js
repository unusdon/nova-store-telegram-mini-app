/**
 * Nova Kit — Admin Q&A moderation
 * Review customer product questions (shared store `nova:qa`, written by product-qa.html),
 * post an answer, or remove a question. Seeds a few demo questions when empty.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:qa`;
const screen = document.getElementById('screen');
let filter = 'pending';

const all = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const save = (q) => localStorage.setItem(KEY, JSON.stringify(q));

function seed() {
  if (all().length) return;
  save([
    { id: 'qa-seed-1', productId: 'p-101', productName: 'Wireless Headphones', question: 'Is this compatible with iPhone 15?', answer: '', author: 'Marco D.', date: '2024-06-24T00:00:00Z', status: 'pending' },
    { id: 'qa-seed-2', productId: 'p-204', productName: 'Productivity Course', question: 'Do I get lifetime access?', answer: 'Yes — one purchase gives you lifetime access plus all future updates.', author: 'Lena V.', date: '2024-06-22T00:00:00Z', status: 'answered' },
    { id: 'qa-seed-3', productId: 'p-101', productName: 'Wireless Headphones', question: 'What is the battery life?', answer: '', author: 'Ade O.', date: '2024-06-21T00:00:00Z', status: 'pending' },
  ]);
}

function card(q) {
  const answered = Boolean(q.answer);
  return `<div class="card card--pad" style="margin-bottom:12px">
    <div class="row-between">
      <span class="muted text-sm">${esc(q.productName)}</span>
      <span class="status status--${answered ? 'delivered' : 'pending'}">${answered ? 'Answered' : 'Pending'}</span>
    </div>
    <div class="qa-q" style="margin-top:10px"><span class="qa-q__badge">Q</span><span>${esc(q.question)}</span></div>
    ${answered ? `<div class="qa-a"><span class="qa-a__badge">A</span><span>${esc(q.answer)}</span></div>` : ''}
    <div class="qa-meta">Asked by ${esc(q.author)} · ${formatDate(q.date)}</div>
    <div class="row gap-3" style="margin-top:12px">
      <button class="text-accent semibold text-sm" data-answer="${q.id}">${answered ? 'Edit answer' : 'Answer'}</button>
      <button class="semibold text-sm" style="color:var(--danger)" data-del="${q.id}">Remove</button>
    </div>
  </div>`;
}

function render() {
  const list = all().filter((q) => filter === 'all' || (filter === 'pending' ? !q.answer : Boolean(q.answer)));
  const pending = all().filter((q) => !q.answer).length;

  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Questions & Answers', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('help', { size: 18 })}</span>Total questions</span><span class="kpi__value">${all().length}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('bell', { size: 18 })}</span>Awaiting answer</span><span class="kpi__value">${pending}</span></div>
    </div>
    <div class="tabs-pill">${[['pending', 'Pending'], ['answered', 'Answered'], ['all', 'All']].map(([k, l]) => `<button class="chip${k === filter ? ' is-active' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="container" style="padding-top:0">${list.map(card).join('') || '<p class="muted text-sm">Nothing here.</p>'}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
  screen.querySelectorAll('[data-answer]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.answer)));
  screen.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await confirm('Remove this question?')) { save(all().filter((q) => q.id !== b.dataset.del)); toast('Removed'); render(); }
  }));
}

function answer(id) {
  const q = all().find((x) => x.id === id);
  if (!q) return;
  const form = `<div class="qa-q" style="margin-bottom:12px"><span class="qa-q__badge">Q</span><span>${esc(q.question)}</span></div>
    <div class="field"><label class="field__label">Your answer</label>
      <textarea class="textarea" id="a" placeholder="Reply to the customer">${esc(q.answer || '')}</textarea></div>
    <button class="btn btn--block" id="aSave">Publish answer</button>`;
  const sheet = bottomSheet({ title: 'Answer question', content: form });
  sheet.el.querySelector('#aSave').addEventListener('click', () => {
    const text = sheet.el.querySelector('#a').value.trim();
    if (!text) { toast('Please write an answer', { kind: 'danger' }); return; }
    const list = all(); const rec = list.find((x) => x.id === id);
    rec.answer = text; rec.status = 'answered';
    save(list); haptic('success'); sheet.close(); toast('Answer published', { kind: 'success' }); render();
  });
}

seed();
render();
