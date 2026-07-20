/**
 * Nova Kit — Favorites / Wishlist (faithful replica of the original favorites page)
 * Filter tabs, sort, product grid, and a bulk-select edit mode (add-to-cart / remove).
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { dataService } from '../core/store.js';
import { placeholder, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { tabBar, productCard, bindWishButtons, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
let all = [];
let filter = 'all';
let sort = 'newest';
let editMode = false;
const selected = new Set();

function list() {
  const ids = dataService.getWishlist();
  let items = all.filter((p) => ids.includes(p.id));
  if (filter !== 'all') items = items.filter((p) => p.type === filter);
  if (sort === 'price-low') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') items.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') items.sort((a, b) => b.rating - a.rating);
  return items;
}

function render() {
  const items = list();

  document.getElementById('appbar').innerHTML = `<header class="favorites-header"><div class="header-top">
    <span style="width:44px"></span>
    <div class="header-center"><h1 class="page-title">${t('nav.wishlist')}</h1>
      <span class="favorites-subtitle">${items.length} saved item${items.length === 1 ? '' : 's'}</span></div>
    ${items.length ? `<button class="edit-button" id="editBtn">${editMode ? 'Done' : 'Edit'}</button>` : '<span style="width:44px"></span>'}
  </div></header>`;
  bindThemeToggle();

  if (!items.length) {
    screen.innerHTML = `<div class="empty-state" style="padding-top:60px">
      <div class="empty-state__emoji">🤍</div><h3>Your wishlist is empty</h3>
      <p>Tap the heart on any product to save it here.</p>
      <a class="btn" href="catalog.html">${t('nav.catalog')}</a></div>`;
    document.getElementById('tabbar').innerHTML = tabBar('wishlist');
    document.getElementById('bottombar') && (document.getElementById('bottombar').innerHTML = '');
    return;
  }

  screen.innerHTML = `<div class="favorites-content">
    <div class="filter-tabs">
      ${[['all', 'All'], ['physical', 'Physical'], ['digital', 'Digital']].map(([id, l]) =>
        `<button class="filter-tab${filter === id ? ' active' : ''}" data-filter="${id}">${l}</button>`).join('')}
    </div>
    <div class="sort-section"><span class="results-count">Showing ${items.length}</span>
      <select class="sort-select" id="sortSel">
        ${[['newest', 'Newest'], ['price-low', 'Price: Low'], ['price-high', 'Price: High'], ['rating', 'Top rated']]
          .map(([v, l]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></div>
    <div class="favorites-grid">
      ${items.map((p) => {
        const cardHtml = productCard(p);
        return editMode
          ? cardHtml.replace('<div class="pcard__media">', `<div class="pcard__media"><span class="fav-check">${selected.has(p.id) ? icon('check', { size: 14 }) : ''}</span>`)
              .replace('class="pcard"', `class="pcard${selected.has(p.id) ? ' is-selected' : ''}" data-sel="${p.id}"`)
          : cardHtml;
      }).join('')}
    </div>
  </div>`;

  document.getElementById('tabbar').innerHTML = tabBar('wishlist');
  document.getElementById('bottombar') && (document.getElementById('bottombar').innerHTML = editMode ? bulkBar() : '');
  wire();
}

function bulkBar() {
  return `<div class="bulk-actions">
    <span class="bulk-info">${selected.size} selected</span>
    <div class="bulk-buttons">
      <button class="btn btn--sm btn--ghost" id="bulkCart">${icon('cart', { size: 16 })} Add</button>
      <button class="btn btn--sm btn--outline" id="bulkRemove" style="color:var(--danger);border-color:var(--danger)">Remove</button>
    </div>
  </div>`;
}

function wire() {
  document.getElementById('editBtn')?.addEventListener('click', () => { editMode = !editMode; selected.clear(); render(); });
  document.getElementById('sortSel')?.addEventListener('change', (e) => { sort = e.target.value; render(); });
  screen.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));

  if (editMode) {
    screen.querySelectorAll('[data-sel]').forEach((c) => c.addEventListener('click', (e) => {
      e.preventDefault();
      const id = c.dataset.sel;
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      render();
    }));
    document.getElementById('bulkRemove')?.addEventListener('click', () => {
      selected.forEach((id) => dataService.toggleWishlist(id));
      haptic('medium'); toast(`${selected.size} removed`); selected.clear(); editMode = false; render();
    });
    document.getElementById('bulkCart')?.addEventListener('click', () => {
      const items = all.filter((p) => selected.has(p.id));
      items.forEach((p) => dataService.addToCart({ productId: p.id, variantId: null, name: p.name, price: p.price, type: p.type, image: placeholder(p.emoji, p.color, 150, 150) }));
      haptic('success'); toast(`${items.length} added to cart`, { kind: 'success' }); selected.clear(); editMode = false; render();
    });
  } else {
    bindWishButtons(screen, (_, wished) => { if (!wished) { toast('Removed from wishlist'); render(); } });
  }
}

(async function init() { all = await dataService.getProducts(); render(); })();
