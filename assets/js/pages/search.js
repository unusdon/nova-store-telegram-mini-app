/**
 * Nova Kit — Search
 * Live product search with recent searches and quick suggestions. Recent terms persist.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { dataService } from '../core/store.js';
import { esc, toast } from '../core/ui.js';
import { appBar, productCard, bindWishButtons, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const recentKey = `${config.data.persistNamespace}:recent-search`;
let recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
const suggestions = ['Earbuds', 'Watch', 'Phone', 'Jacket', 'Game', 'E-book'];
let all = [];

function shell() {
  document.getElementById('appbar').innerHTML = appBar({ title: t('home.search_placeholder'), back: 'index.html', themeToggle: true });
  bindThemeToggle();
  screen.innerHTML = `
    <div class="search-field">${icon('search', { size: 20 })}
      <input id="q" placeholder="${t('home.search_placeholder')}" autocomplete="off" autofocus>
      <button id="clr" aria-label="Clear" class="text-faint">${icon('close', { size: 18 })}</button>
    </div>
    <div id="results"></div>`;
  document.getElementById('q').addEventListener('input', (e) => run(e.target.value));
  document.getElementById('clr').addEventListener('click', () => { document.getElementById('q').value = ''; run(''); });
  run('');
}

function chips(title, list) {
  if (!list.length) return '';
  return `<div class="section-head"><h2>${title}</h2></div>
    <div class="search-tags">${list.map((s) => `<button class="chip" data-term="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
}

async function run(q) {
  const results = document.getElementById('results');
  if (!q.trim()) {
    results.innerHTML = chips('Recent', recent) + chips('Popular', suggestions);
    results.querySelectorAll('[data-term]').forEach((b) =>
      b.addEventListener('click', () => { document.getElementById('q').value = b.dataset.term; run(b.dataset.term); }));
    return;
  }
  const found = all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.shortDescription.toLowerCase().includes(q.toLowerCase()));
  saveRecent(q);
  results.innerHTML = found.length
    ? `<div class="admin-section-title">${found.length} result(s)</div>
       <div class="pcard-grid">${found.map(productCard).join('')}</div>`
    : `<div class="empty-state"><div class="empty-state__emoji">🔍</div><h3>No results for “${esc(q)}”</h3></div>`;
  bindWishButtons(results, (_, w) => toast(w ? '❤️ Added to wishlist' : 'Removed from wishlist'));
}

function saveRecent(q) {
  const term = q.trim();
  if (!term) return;
  recent = [term, ...recent.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 6);
  localStorage.setItem(recentKey, JSON.stringify(recent));
}

(async function init() { all = await dataService.getProducts(); shell(); })();
