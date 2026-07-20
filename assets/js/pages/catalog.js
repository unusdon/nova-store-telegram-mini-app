/**
 * Nova Kit — Catalog (faithful replica of the original products page)
 * Sticky header, type filter, category chips, subcategory chips, sort row, full-width
 * product cards, and a filter sheet (price / rating / availability).
 */
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, placeholder, toast, bottomSheet } from '../core/ui.js';
import { tabBar, bindThemeToggle } from '../components.js';

bootstrap();

const params = new URLSearchParams(location.search);
const state = {
  type: params.get('type') || 'all',
  category: params.get('category') || 'all',
  subcategory: params.get('subcategory') || 'all',
  sort: params.get('sort') || 'newest',
  filters: { maxPrice: 1000, rating: 0, inStock: true, outOfStock: false },
};

const screen = document.getElementById('screen');
let categories = [];

const SORT_MAP = { newest: 'newest', oldest: 'newest', 'price-low': 'price-asc', 'price-high': 'price-desc', rating: 'rating', popular: 'rating' };

function stars(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => `<span class="star${i < full ? ' filled' : ''}">★</span>`).join('');
}

function productCard(p) {
  const discount = p.compareAtPrice ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  return `<div class="product-card" data-id="${p.id}">
    <div class="product-image-container">
      <img class="product-image" src="${placeholder(p.emoji, p.color)}" alt="${esc(p.name)}" loading="lazy">
      ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
      ${p.type === 'digital' ? '<div class="digital-badge">Digital</div>' : ''}
      ${!p.inStock ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
    </div>
    <div class="product-info">
      <h3 class="product-name">${esc(p.name)}</h3>
      <div class="product-rating">
        <div class="rating-stars">${stars(p.rating)}</div>
        <span class="rating-text">${p.rating} (${p.reviewCount})</span>
      </div>
      <div class="product-price">
        <span class="current-price">${formatPrice(p.price)}</span>
        ${p.compareAtPrice ? `<span class="original-price">${formatPrice(p.compareAtPrice)}</span>` : ''}
      </div>
      <div class="product-availability">
        ${p.inStock ? '<span class="in-stock">✓ In Stock</span>' : '<span class="out-of-stock">✗ Out of Stock</span>'}
        ${p.type === 'digital' && p.inStock ? '<span class="instant-delivery">⚡ Instant</span>'
          : p.inStock ? `<span class="stock-count">${p.stock} left</span>` : ''}
      </div>
    </div>
  </div>`;
}

function subcatBar() {
  const cat = categories.find((c) => c.id === state.category);
  if (!cat || !cat.subcategories?.length) return '';
  return `<div class="subcategory-filter">
    <div class="subcategory-title">Subcategories:</div>
    <div class="subcategory-scroll">
      <button class="subcategory-chip${state.subcategory === 'all' ? ' active' : ''}" data-sub="all">All</button>
      ${cat.subcategories.map((s) => `<button class="subcategory-chip${state.subcategory === s.id ? ' active' : ''}" data-sub="${s.id}">${esc(s.name)}</button>`).join('')}
    </div>
  </div>`;
}

async function render() {
  const products = await dataService.getProducts({
    type: state.type, category: state.category,
    subcategory: state.subcategory, sort: SORT_MAP[state.sort],
  });
  const list = products.filter((p) => (p.inStock || state.filters.outOfStock)
    && p.price <= state.filters.maxPrice && p.rating >= state.filters.rating);

  document.getElementById('appbar').innerHTML = `
    <header class="products-header"><div class="header-top">
      <a class="back-button" href="index.html" aria-label="Back">${icon('back', { size: 24 })}</a>
      <div class="header-center"><h1 class="page-title">Products</h1>
        <span class="product-count">${list.length} products</span></div>
      <button class="filter-button" id="filterBtn" aria-label="Filter">${icon('filter', { size: 24 })}</button>
    </div></header>`;

  screen.innerHTML = `
    <div class="products-content">
      <div class="product-type-filter">
        ${[['all', 'All Products'], ['physical', 'Physical'], ['digital', 'Digital']].map(([id, label]) =>
          `<button class="type-button${state.type === id ? ' active' : ''}" data-type="${id}">${label}</button>`).join('')}
      </div>

      <div class="category-filter"><div class="category-scroll">
        <button class="category-chip${state.category === 'all' ? ' active' : ''}" data-cat="all">All</button>
        ${categories.map((c) => `<button class="category-chip${state.category === c.id ? ' active' : ''}" data-cat="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('')}
      </div></div>

      ${subcatBar()}

      <div class="sort-section">
        <span class="results-count">Showing ${list.length} products</span>
        <select class="sort-select" id="sortSelect">
          ${[['newest', 'Newest First'], ['price-low', 'Price: Low to High'], ['price-high', 'Price: High to Low'], ['rating', 'Highest Rated'], ['popular', 'Most Popular']]
            .map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>

      ${list.length ? `<div class="products-grid">${list.map(productCard).join('')}</div>`
        : `<div class="empty-products"><div class="empty-icon">📦</div>
            <h3 class="empty-title">No products found</h3>
            <p>Try adjusting your filters.</p></div>`}
    </div>`;

  document.getElementById('tabbar').innerHTML = tabBar('catalog');
  bindThemeToggle();
  wire();
}

function wire() {
  screen.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => { state.type = b.dataset.type; render(); }));
  screen.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { state.category = b.dataset.cat; state.subcategory = 'all'; render(); }));
  screen.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => { state.subcategory = b.dataset.sub; render(); }));
  screen.querySelectorAll('[data-id]').forEach((c) => c.addEventListener('click', () => { location.href = `product.html?id=${encodeURIComponent(c.dataset.id)}`; }));
  document.getElementById('sortSelect')?.addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  document.getElementById('filterBtn')?.addEventListener('click', openFilters);
}

function openFilters() {
  const f = state.filters;
  const form = `
    <div class="field"><label class="field__label">Max price: <span id="pv">${formatPrice(f.maxPrice)}</span></label>
      <input type="range" id="pmax" min="0" max="1000" step="10" value="${f.maxPrice}" style="width:100%;accent-color:var(--accent)"></div>
    <div class="field"><label class="field__label">Minimum rating</label>
      <div class="segmented" id="rseg">
        ${[0, 3, 4].map((r) => `<button data-r="${r}" class="${f.rating === r ? 'is-active' : ''}">${r === 0 ? 'All' : r + '★+'}</button>`).join('')}
      </div></div>
    <div class="list-row" style="border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:16px">
      <span class="list-row__text"><span class="list-row__title">Include out of stock</span></span>
      <label class="switch"><input type="checkbox" id="oos" ${f.outOfStock ? 'checked' : ''}><span class="switch__track"></span></label>
    </div>
    <button class="btn btn--block" id="applyF">Apply filters</button>`;
  const sheet = bottomSheet({ title: 'Filter products', content: form });
  const pmax = sheet.el.querySelector('#pmax');
  pmax.addEventListener('input', () => { sheet.el.querySelector('#pv').textContent = formatPrice(pmax.value); });
  sheet.el.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
    sheet.el.querySelectorAll('[data-r]').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); f.rating = +b.dataset.r;
  }));
  sheet.el.querySelector('#applyF').addEventListener('click', () => {
    f.maxPrice = +pmax.value; f.outOfStock = sheet.el.querySelector('#oos').checked;
    sheet.close(); toast('Filters applied'); render();
  });
}

(async function init() { categories = await dataService.getCategories(); render(); })();
