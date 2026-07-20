/**
 * Nova Kit — Product detail (faithful replica of the original product-detail page)
 * Gallery + thumbnails, info, quantity selector, description, specs, reviews summary,
 * related products, and a fixed favourite + Add to Cart bar.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, placeholder, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { productCard, bindWishButtons, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
let product = null;
let qty = 1;
let variant = null;
let activeImg = 0;
let shades = [];

function starRow(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => `<span class="star${i < full ? ' filled' : ''}">★</span>`).join('');
}

function gallery() {
  return `<div class="product-images-section">
    <div class="main-image-container">
      <img id="mainImage" class="main-image" src="${shades[0]}" alt="${esc(product.name)}">
      <div class="image-indicators">${shades.map((_, i) => `<span class="indicator${i === 0 ? ' active' : ''}" data-ind="${i}"></span>`).join('')}</div>
    </div>
    <div class="thumbnail-images">
      ${shades.map((s, i) => `<img class="thumbnail${i === 0 ? ' active' : ''}" data-thumb="${i}" src="${s}" alt="thumb ${i + 1}">`).join('')}
    </div>
  </div>`;
}

function variantsSection() {
  if (!product.variants?.length) return '';
  return `<div class="product-options-section">
    <h4 class="option-title">Options</h4>
    <div class="variant-chips" id="variants">
      ${product.variants.map((v, i) => `<button class="variant-chip${i === 0 ? ' active' : ''}" data-variant="${v.id}">${esc(v.label)}</button>`).join('')}
    </div>
  </div>`;
}

function specs() {
  const cat = product.categoryId ? product.categoryId.charAt(0).toUpperCase() + product.categoryId.slice(1) : '—';
  const rows = [
    ['Type', product.type === 'digital' ? 'Digital' : 'Physical'],
    ['Category', cat],
    ['Rating', `${product.rating} / 5`],
    ['Availability', product.inStock ? `${product.stock} in stock` : 'Out of stock'],
  ];
  if (product.digital) rows.push(['Platform', product.digital.platform], ['Format', product.digital.format], ['License', product.digital.license]);
  return `<div class="product-specs-section"><h3 class="section-title">Specifications</h3>
    <div class="specs-list">
      ${rows.map(([l, v]) => `<div class="spec-item"><span class="spec-label">${esc(l)}</span><span class="spec-value">${esc(String(v))}</span></div>`).join('')}
    </div></div>`;
}

function reviewsSummary(reviews) {
  if (!config.features.reviews) return '';
  return `<div class="reviews-section">
    <div class="reviews-header"><h3 class="section-title" style="margin:0">Customer Reviews</h3>
      <a class="see-all" href="product-reviews.html?id=${encodeURIComponent(product.id)}">See all ›</a></div>
    <div class="rev-summary">
      <div style="text-align:center"><div class="rev-summary__num">${product.rating.toFixed(1)}</div>
        <div class="rev-summary__stars">${starRow(product.rating)}</div></div>
      <div class="rev-summary__count">${t('product.reviews', { count: product.reviewCount })}<br>
        <a class="see-all" href="product-reviews.html?id=${encodeURIComponent(product.id)}">Write a review</a></div>
    </div>
    ${reviews.slice(0, 1).map((r) => `<div class="review-item">
      <div class="review-header"><div class="reviewer-info"><span class="reviewer-name">${esc(r.author)}</span>
        <div class="review-rating">${starRow(r.rating)}</div></div></div>
      <div class="review-comment">${esc(r.body)}</div></div>`).join('')}
  </div>`;
}

function updateTotals() {
  const unit = product.price;
  document.getElementById('unitPriceDisplay') && (document.getElementById('unitPriceDisplay').textContent = formatPrice(unit).replace(config.currency.symbol, ''));
  const totalEl = document.getElementById('totalPriceDisplay');
  if (totalEl) totalEl.textContent = formatPrice(unit * qty).replace(config.currency.symbol, '');
  const cq = document.getElementById('cartQuantity'); if (cq) cq.textContent = `Qty: ${qty}`;
  const ct = document.getElementById('cartTotal'); if (ct) ct.textContent = formatPrice(unit * qty);
}

function render(reviews, related) {
  document.getElementById('appbar').innerHTML = `<header class="product-header"><div class="header-top">
    <a class="back-button" href="catalog.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Product Details</h1></div>
    <button class="share-button" id="shareBtn" aria-label="Share">${icon('send', { size: 22 })}</button>
  </div></header>`;
  bindThemeToggle();

  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  screen.innerHTML = `<div class="product-content">
    ${gallery()}
    <div class="product-info-section">
      <div class="product-type-badge ${product.type}">${product.type === 'digital' ? 'Digital Product' : 'Physical Product'}</div>
      <h1 class="product-name">${esc(product.name)}</h1>
      <div class="product-rating"><div class="rating-stars">${starRow(product.rating)}</div>
        <span class="rating-text">${product.rating} (${product.reviewCount} reviews)</span></div>
      <div class="product-price"><span class="current-price">${formatPrice(product.price)}</span>
        ${product.compareAtPrice ? `<span class="original-price">${formatPrice(product.compareAtPrice)}</span><span class="discount-badge">${discount}% OFF</span>` : ''}</div>
      <div class="product-availability">
        ${product.inStock ? '<span class="availability-status in-stock">✓ In Stock</span>' : '<span class="availability-status out-of-stock">✗ Out of Stock</span>'}
        ${product.inStock ? `<span class="stock-count">${product.stock} items left</span>` : ''}</div>
      <div class="product-inline-actions">
        <a class="chip" href="product-qa.html?id=${encodeURIComponent(product.id)}">❓ Q&amp;A</a>
        <button class="chip" id="compareBtn">⚖️ Compare</button>
        <button class="chip" id="shareChip">${icon('send', { size: 14 })} Share</button>
      </div>
    </div>

    <div class="purchase-options-section">
      ${variantsSection()}
      <div class="custom-quantity-section">
        <h4 class="option-title">Quantity</h4>
        <div class="quantity-input-container">
          <button class="quantity-btn-large" id="qDec">−</button>
          <input type="number" class="quantity-input" id="qInput" value="1" min="1">
          <button class="quantity-btn-large" id="qInc">+</button>
        </div>
        <div class="quantity-price-display">
          <span class="unit-price">Unit price: ${config.currency.symbol}<span id="unitPriceDisplay"></span></span>
          <span class="total-price">Total: ${config.currency.symbol}<span id="totalPriceDisplay"></span></span>
        </div>
      </div>
    </div>

    <div class="product-description-section"><h3 class="section-title">${t('product.description')}</h3>
      <div class="description-content"><p>${esc(product.description)}</p></div></div>

    ${specs()}
    ${bundleSection(related)}
    ${reviewsSummary(reviews)}

    ${related.length ? `<div class="related-products-section"><h3 class="section-title">${t('product.related')}</h3>
      <div class="related-products-grid">${related.map(productCard).join('')}</div></div>` : ''}
  </div>`;

  const wished = dataService.isWished(product.id);
  document.getElementById('bottombar').innerHTML = `<div class="bottom-action-bar">
    <button class="favorite-btn${wished ? ' is-wished' : ''}" id="favBtn" aria-label="Wishlist">${icon('heart', { size: 24, filled: wished })}</button>
    <div class="cart-summary"><div class="cart-quantity" id="cartQuantity">Qty: 1</div><div class="cart-total" id="cartTotal">${formatPrice(product.price)}</div></div>
    ${product.inStock
      ? `<button class="add-to-cart-btn" id="addBtn">${icon('cart', { size: 20 })} Add to Cart</button>`
      : `<button class="add-to-cart-btn" id="notifyBtn">${icon('bell', { size: 20 })} Notify me</button>`}
  </div>`;

  updateTotals();
  wire(related);
}

function wire(related) {
  screen.querySelectorAll('[data-thumb]').forEach((im) => im.addEventListener('click', () => setImage(+im.dataset.thumb)));
  screen.querySelectorAll('[data-ind]').forEach((d) => d.addEventListener('click', () => setImage(+d.dataset.ind)));
  screen.querySelectorAll('[data-variant]').forEach((b) => b.addEventListener('click', () => {
    screen.querySelectorAll('[data-variant]').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); variant = b.dataset.variant; haptic('selection');
  }));
  const input = document.getElementById('qInput');
  document.getElementById('qDec').addEventListener('click', () => setQty(qty - 1));
  document.getElementById('qInc').addEventListener('click', () => setQty(qty + 1));
  input.addEventListener('change', () => setQty(parseInt(input.value, 10) || 1));
  document.getElementById('addBtn')?.addEventListener('click', addToCart);
  document.getElementById('notifyBtn')?.addEventListener('click', notifyStock);
  document.getElementById('favBtn').addEventListener('click', toggleFav);
  const share = () => {
    if (navigator.share) navigator.share({ title: product.name, text: product.name }).catch(() => {});
    else toast('Link copied');
  };
  document.getElementById('shareBtn')?.addEventListener('click', share);
  document.getElementById('shareChip')?.addEventListener('click', share);
  document.getElementById('compareBtn')?.addEventListener('click', addToCompare);
  document.getElementById('bundleBtn')?.addEventListener('click', addBundle);
  bindWishButtons(screen); // related product cards
}

const NS = config.data.persistNamespace;
function recordRecentlyViewed(pid) {
  const k = `${NS}:recentlyViewed`;
  const list = JSON.parse(localStorage.getItem(k) || '[]').filter((x) => x !== pid);
  list.unshift(pid);
  localStorage.setItem(k, JSON.stringify(list.slice(0, 12)));
}
function addToCompare() {
  const k = `${NS}:compare`;
  const list = JSON.parse(localStorage.getItem(k) || '[]');
  if (list.includes(product.id)) { toast('Already in compare'); return; }
  if (list.length >= 4) { toast('Compare is full (max 4)', { kind: 'danger' }); return; }
  list.push(product.id); localStorage.setItem(k, JSON.stringify(list));
  haptic('success'); toast('Added to compare — open it from any product', { kind: 'success' });
}
function notifyStock() {
  const k = `${NS}:stockAlerts`;
  const list = JSON.parse(localStorage.getItem(k) || '[]');
  if (!list.includes(product.id)) list.push(product.id);
  localStorage.setItem(k, JSON.stringify(list));
  haptic('success'); toast("We'll notify you when it's back in stock", { kind: 'success' });
}
let bundleExtra = null;
function bundleSection(related) {
  bundleExtra = related.find((p) => p.inStock) || null;
  if (!bundleExtra) return '';
  const total = product.price + bundleExtra.price;
  return `<div class="product-specs-section"><h3 class="section-title">Frequently bought together</h3>
    <div class="bundle">
      <a class="bundle__item" href="product.html?id=${encodeURIComponent(product.id)}">
        <img src="${placeholder(product.emoji, product.color)}" alt=""><span class="bundle__name">${esc(product.name)}</span>
        <span class="semibold">${formatPrice(product.price)}</span></a>
      <span class="bundle__plus">+</span>
      <a class="bundle__item" href="product.html?id=${encodeURIComponent(bundleExtra.id)}">
        <img src="${placeholder(bundleExtra.emoji, bundleExtra.color)}" alt=""><span class="bundle__name">${esc(bundleExtra.name)}</span>
        <span class="semibold">${formatPrice(bundleExtra.price)}</span></a>
    </div>
    <button class="btn btn--block" id="bundleBtn" style="margin-top:12px">Add both to cart · ${formatPrice(total)}</button>
  </div>`;
}
function addBundle() {
  [product, bundleExtra].filter(Boolean).forEach((p) => dataService.addToCart({
    productId: p.id, variantId: null, name: p.name, price: p.price, type: p.type,
    image: placeholder(p.emoji, p.color, 150, 150),
  }));
  haptic('success'); toast('Bundle added to cart', { kind: 'success' });
}

function setImage(i) {
  activeImg = i;
  document.getElementById('mainImage').src = shades[i];
  screen.querySelectorAll('.thumbnail').forEach((im, j) => im.classList.toggle('active', j === i));
  screen.querySelectorAll('.indicator').forEach((d, j) => d.classList.toggle('active', j === i));
}
function setQty(n) {
  qty = Math.max(1, Math.min(config.commerce.maxQtyPerItem, n));
  document.getElementById('qInput').value = qty;
  updateTotals();
  haptic('light');
}
function addToCart() {
  dataService.addToCart({
    productId: product.id, variantId: variant, name: product.name, price: product.price,
    type: product.type, qty, image: placeholder(product.emoji, product.color, 150, 150),
    meta: variant ? { variant } : {},
  });
  haptic('success'); toast('Added to cart', { kind: 'success' });
}
function toggleFav() {
  const nowWished = dataService.toggleWishlist(product.id);
  const btn = document.getElementById('favBtn');
  btn.classList.toggle('is-wished', nowWished);
  btn.innerHTML = icon('heart', { size: 24, filled: nowWished });
  haptic(nowWished ? 'success' : 'light');
  toast(nowWished ? '❤️ Added to wishlist' : 'Removed from wishlist');
}

(async function init() {
  product = await dataService.getProduct(id);
  if (!product) {
    document.getElementById('appbar').innerHTML = `<header class="product-header"><div class="header-top">
      <a class="back-button" href="catalog.html">${icon('back', { size: 24 })}</a>
      <div class="header-center"><h1 class="page-title">Product</h1></div><span style="width:40px"></span></div></header>`;
    screen.innerHTML = `<div class="empty-state"><div class="empty-state__emoji">🧐</div><h3>Product not found</h3>
      <a class="btn" href="catalog.html">${t('nav.catalog')}</a></div>`;
    return;
  }
  recordRecentlyViewed(product.id);
  variant = product.variants?.[0]?.id || null;
  shades = [product.color, '#2E90FA', '#F59E0B'].map((c) => placeholder(product.emoji, c));
  const [reviews, all] = await Promise.all([
    dataService.getReviews(product.id),
    dataService.getProducts({ category: product.categoryId }),
  ]);
  render(reviews, all.filter((p) => p.id !== product.id).slice(0, 4));
})();
