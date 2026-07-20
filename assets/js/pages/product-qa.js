/**
 * Nova Kit — Product Questions & Answers (customer)
 * View questions/answers for a product and ask your own. Shared store `nova:qa` (the admin
 * Q&A page answers/moderates them). Seeds a couple of demo Q&As per product.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { formatDate } from '../core/format.js';
import { icon } from '../core/icons.js';
import { dataService } from '../core/store.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:qa`;
const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
let product = null;

const all = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const save = (q) => localStorage.setItem(KEY, JSON.stringify(q));

function seedFor(p) {
  const list = all();
  if (list.some((q) => q.productId === p.id)) return;
  list.push(
    { id: `qa-${p.id}-1`, productId: p.id, productName: p.name, question: `Does the ${p.name} come with a warranty?`, answer: 'Yes — all products include a 12-month warranty.', author: 'Sam R.', date: '2024-06-20T00:00:00Z', status: 'answered' },
    { id: `qa-${p.id}-2`, productId: p.id, productName: p.name, question: 'How long does delivery take?', answer: p.type === 'digital' ? 'Digital items are delivered instantly.' : 'Standard delivery is 3–5 business days.', author: 'Priya K.', date: '2024-06-18T00:00:00Z', status: 'answered' },
  );
  save(list);
}

function qaItem(q) {
  return `<div class="qa-item">
    <div class="qa-q"><span class="qa-q__badge">Q</span><span>${esc(q.question)}</span></div>
    ${q.answer ? `<div class="qa-a"><span class="qa-a__badge">A</span><span>${esc(q.answer)}</span></div>`
      : '<div class="qa-meta">⏳ Awaiting an answer from the store</div>'}
    <div class="qa-meta">Asked by ${esc(q.author)} · ${formatDate(q.date)}</div>
  </div>`;
}

function render() {
  const list = all().filter((q) => q.productId === product.id);
  document.getElementById('appbar').innerHTML = pageHeader({
    title: 'Questions & Answers', subtitle: product.name, back: `product.html?id=${encodeURIComponent(product.id)}`,
    action: `<button class="hbtn" id="askBtn" aria-label="Ask">${icon('plus', { size: 24 })}</button>`,
  });
  bindThemeToggle();

  screen.innerHTML = `<div class="feat-content">
    ${list.length ? list.map(qaItem).join('')
      : `<div class="empty-state" style="padding-top:40px"><div class="empty-state__emoji">❓</div>
          <h3>No questions yet</h3><p>Be the first to ask about this product.</p></div>`}
    <button class="btn btn--outline btn--block" id="askBtn2" style="margin-top:8px">${icon('help', { size: 18 })} Ask a question</button>
  </div>`;

  document.getElementById('askBtn').addEventListener('click', ask);
  document.getElementById('askBtn2').addEventListener('click', ask);
}

function ask() {
  const form = `<div class="field"><label class="field__label">Your question</label>
    <textarea class="textarea" id="q" placeholder="Ask anything about this product"></textarea></div>
    <button class="btn btn--block" id="qSave">Submit question</button>`;
  const sheet = bottomSheet({ title: 'Ask a question', content: form });
  sheet.el.querySelector('#qSave').addEventListener('click', () => {
    const text = sheet.el.querySelector('#q').value.trim();
    if (!text) { toast('Please type your question', { kind: 'danger' }); return; }
    const list = all();
    list.unshift({ id: 'qa-' + Date.now().toString(36), productId: product.id, productName: product.name, question: text, answer: '', author: 'You', date: new Date().toISOString(), status: 'pending' });
    save(list); haptic('success'); sheet.close(); toast('Question submitted', { kind: 'success' }); render();
  });
}

(async function init() {
  product = await dataService.getProduct(id);
  if (!product) {
    document.getElementById('appbar').innerHTML = pageHeader({ title: 'Questions', back: 'catalog.html' });
    screen.innerHTML = `<div class="empty-state"><div class="empty-state__emoji">🧐</div><h3>Product not found</h3></div>`;
    return;
  }
  seedFor(product);
  render();
})();
