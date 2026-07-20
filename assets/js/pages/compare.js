/**
 * Nova Kit — Compare products
 * Side-by-side comparison of products the shopper added (from the product page). Stored under
 * `nova:compare`; each column can be removed, and rows compare key attributes.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, placeholder, toast } from '../core/ui.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:compare`;
const screen = document.getElementById('screen');
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

async function render() {
  const ids = JSON.parse(localStorage.getItem(KEY) || '[]');
  const all = await dataService.getProducts();
  const items = ids.map((id) => all.find((p) => p.id === id)).filter(Boolean);

  document.getElementById('appbar').innerHTML = pageHeader({
    title: 'Compare', subtitle: `${items.length} product${items.length === 1 ? '' : 's'}`, back: 'catalog.html',
    action: items.length ? `<button class="hbtn" id="clearBtn" aria-label="Clear">${icon('trash', { size: 22 })}</button>` : '',
  });
  bindThemeToggle();

  if (!items.length) {
    screen.innerHTML = `<div class="empty-state" style="padding-top:60px"><div class="empty-state__emoji">⚖️</div>
      <h3>Nothing to compare</h3><p>Add products from their page to compare them side by side.</p>
      <a class="btn" href="catalog.html">${t('nav.catalog')}</a></div>`;
    return;
  }

  const rows = [
    ['Price', (p) => formatPrice(p.price)],
    ['Rating', (p) => `${p.rating} ★ (${p.reviewCount})`],
    ['Type', (p) => p.type === 'digital' ? 'Digital' : 'Physical'],
    ['Category', (p) => cap(p.categoryId)],
    ['Availability', (p) => p.inStock ? `${p.stock} in stock` : 'Out of stock'],
  ];

  screen.innerHTML = `<div class="feat-content"><div class="compare-scroll"><div class="compare-table">
    ${items.map((p) => `<div class="compare-col">
      <a class="compare-col__media" href="product.html?id=${encodeURIComponent(p.id)}">
        <img src="${placeholder(p.emoji, p.color)}" alt="${esc(p.name)}">
        <button class="compare-col__rm" data-rm="${p.id}" aria-label="Remove">×</button></a>
      <div class="compare-cell"><span class="compare-cell__name">${esc(p.name)}</span></div>
      ${rows.map(([label, fn]) => `<div class="compare-cell"><span class="compare-cell__label">${label}</span><br>${esc(String(fn(p)))}</div>`).join('')}
      <div class="compare-cell"><a class="btn btn--sm btn--block" href="product.html?id=${encodeURIComponent(p.id)}">View</a></div>
    </div>`).join('')}
  </div></div></div>`;

  screen.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const next = ids.filter((id) => id !== b.dataset.rm);
    localStorage.setItem(KEY, JSON.stringify(next)); toast('Removed'); render();
  }));
  document.getElementById('clearBtn')?.addEventListener('click', () => { localStorage.removeItem(KEY); render(); });
}

render();
