/**
 * Nova Kit — Categories (faithful replica of the original categories page)
 * Type filter, featured grid, and a full category list; each links into the filtered catalog.
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { dataService } from '../core/store.js';
import { esc } from '../core/ui.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const TINTS = ['tint-blue', 'tint-green', 'tint-orange', 'tint-pink', 'tint-purple', 'tint-red'];
const GRADS = ['linear-gradient(135deg,#5B6CFF,#3B4BE0)', 'linear-gradient(135deg,#00C853,#009e42)',
  'linear-gradient(135deg,#F59E0B,#d97706)', 'linear-gradient(135deg,#EC4899,#be2765)'];
let categories = [];
let type = 'all';

function card(c, i) {
  const total = (c.subcategories || []).reduce((n, s) => n + (s.count || 0), 0);
  const tint = c.type === 'digital' ? 'tint-blue' : 'tint-green';
  return `<a class="category-card" href="catalog.html?category=${c.id}">
    <span class="category-image ${TINTS[i % TINTS.length]}">${c.icon}</span>
    <span class="category-info">
      <span class="category-name">${esc(c.name)}
        <span class="category-type ${tint}">${c.type === 'digital' ? 'Digital' : 'Physical'}</span></span>
      <span class="category-count">${total} products · ${(c.subcategories || []).length} subcategories</span>
    </span>
    <span class="category-arrow">›</span>
  </a>`;
}

function render() {
  const list = categories.filter((c) => type === 'all' || c.type === type);
  const featured = categories.slice(0, 4);

  document.getElementById('appbar').innerHTML = `<header class="categories-header"><div class="header-top">
    <a class="back-button" href="index.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">${t('home.categories')}</h1></div>
    <a class="search-button" href="search.html" aria-label="Search">${icon('search', { size: 22 })}</a>
  </div></header>`;
  bindThemeToggle();

  screen.innerHTML = `<div class="categories-content">
    <div class="product-type-filter">
      ${[['all', 'All'], ['physical', 'Physical'], ['digital', 'Digital']].map(([id, label]) =>
        `<button class="type-button${type === id ? ' active' : ''}" data-type="${id}">${label}</button>`).join('')}
    </div>

    ${type === 'all' ? `<div class="featured-section"><h3 class="section-title">Featured</h3>
      <div class="featured-grid">
        ${featured.map((c, i) => `<a class="featured-category" href="catalog.html?category=${c.id}" style="background:${GRADS[i % GRADS.length]}">
          <span class="featured-category__icon">${c.icon}</span>
          <span><span class="featured-category__name">${esc(c.name)}</span><br>
            <span class="featured-category__count">${(c.subcategories || []).reduce((n, s) => n + (s.count || 0), 0)} items</span></span>
        </a>`).join('')}
      </div></div>` : ''}

    <div class="categories-section"><h3 class="section-title">All Categories</h3>
      <div class="categories-list">${list.map(card).join('')}</div>
    </div>
  </div>`;

  screen.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => { type = b.dataset.type; render(); }));
}

(async function init() { categories = await dataService.getCategories(); render(); })();
