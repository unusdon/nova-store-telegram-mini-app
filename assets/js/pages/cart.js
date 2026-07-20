/**
 * Nova Kit — Cart (faithful replica of the original cart page)
 * Item cards with quantity pill + remove, promo code, order summary, recommended products,
 * and a fixed total + checkout bar.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService, cartTotals } from '../core/store.js';
import { esc, placeholder, toast } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const screen = document.getElementById('screen');
let promo = JSON.parse(localStorage.getItem(`${NS}:promo`) || 'null');
let recommended = [];

function header(count) {
  return `<header class="cart-header"><div class="header-top">
    <a class="back-button" href="index.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Shopping Cart</h1>
      <span class="cart-count">${count} ${count === 1 ? 'item' : 'items'}</span></div>
    ${count ? '<button class="clear-button" id="clearBtn">Clear</button>' : '<span style="width:44px"></span>'}
  </div></header>`;
}

function itemCard(item, i) {
  const details = item.meta?.variant ? esc(item.meta.variant)
    : item.type === 'digital' ? 'Instant delivery' : 'Ships in 3–5 days';
  return `<div class="cart-item" data-index="${i}">
    <img class="item-image" src="${item.image || placeholder(item.emoji || '📦', '#00FF88')}" alt="${esc(item.name)}">
    <div class="item-info">
      <div class="item-name">${esc(item.name)}</div>
      <span class="item-type-badge ${item.type}">${item.type === 'digital' ? 'Digital Product' : 'Physical Product'}</span>
      <div class="item-details">${details}</div>
      <div class="item-price">${formatPrice(item.price * item.qty)}</div>
    </div>
    <div class="item-controls">
      <div class="quantity-controls">
        <button class="quantity-btn" data-dec="${i}" aria-label="Decrease">−</button>
        <span class="quantity-value">${item.qty}</span>
        <button class="quantity-btn" data-inc="${i}" aria-label="Increase">+</button>
      </div>
      <button class="remove-btn" data-remove="${i}">Remove</button>
    </div>
  </div>`;
}

function promoBlock() {
  if (!config.features.promo) return '';
  const discount = cartTotals(dataService.getCart(), promo).discount;
  return `<div class="promo-section">
    ${promo ? `<div class="applied-promo">
        <div class="promo-info"><span class="promo-code">${esc(promo.code)}</span>
          <span class="promo-discount">-${formatPrice(discount)}</span></div>
        <button class="remove-promo-btn" id="removePromoBtn">×</button>
      </div>`
      : `<div class="promo-input-container">
          <input type="text" class="promo-input" id="promoInput" placeholder="Enter promo code" autocomplete="off">
          <button class="apply-promo-btn" id="applyPromoBtn">Apply</button>
        </div>`}
  </div>`;
}

function summary(tot) {
  return `<div class="order-summary">
    <h3 class="summary-title">Order Summary</h3>
    <div class="summary-row"><span class="summary-label">Subtotal</span><span class="summary-value">${formatPrice(tot.subtotal)}</span></div>
    <div class="summary-row"><span class="summary-label">Shipping</span><span class="summary-value">${tot.shipping ? formatPrice(tot.shipping) : 'Free'}</span></div>
    ${tot.discount ? `<div class="summary-row"><span class="summary-label">Promo Discount</span><span class="summary-value discount">-${formatPrice(tot.discount)}</span></div>` : ''}
    <div class="summary-row"><span class="summary-label">Tax</span><span class="summary-value">${formatPrice(tot.tax)}</span></div>
    <div class="summary-divider"></div>
    <div class="summary-row total-row"><span class="summary-label">Total</span><span class="summary-value">${formatPrice(tot.total)}</span></div>
  </div>`;
}

function recommendedBlock() {
  if (!recommended.length) return '';
  return `<div class="recommended-section">
    <h3 class="section-title">You might also like</h3>
    <div class="recommended-grid">
      ${recommended.map((p) => `<div class="recommended-item" data-rec="${p.id}">
        <img class="recommended-image" src="${placeholder(p.emoji, p.color)}" alt="${esc(p.name)}">
        <div class="recommended-name">${esc(p.name)}</div>
        <div class="recommended-price">${formatPrice(p.price)}</div>
        <button class="quick-add-btn" data-add="${p.id}" aria-label="Add">+</button>
      </div>`).join('')}
    </div>
  </div>`;
}

function render() {
  const cart = dataService.getCart();
  const count = cart.reduce((n, i) => n + i.qty, 0);
  document.getElementById('appbar').innerHTML = header(count);
  bindThemeToggle();

  if (!cart.length) {
    screen.innerHTML = `<div class="cart-content"><div class="empty-cart">
      <div class="empty-icon">🛒</div><h3 class="empty-title">${t('cart.empty')}</h3>
      <p class="empty-description">${t('cart.empty_hint')}</p>
      <button class="continue-shopping-btn" onclick="location.href='catalog.html'">Continue Shopping</button>
    </div></div>`;
    document.getElementById('bottombar').innerHTML = '';
    return;
  }

  const tot = cartTotals(cart, promo);
  screen.innerHTML = `<div class="cart-content">
    <div class="cart-items">${cart.map(itemCard).join('')}</div>
    ${promoBlock()}
    ${summary(tot)}
    ${recommendedBlock()}
  </div>`;

  document.getElementById('bottombar').innerHTML = `<div class="bottom-actions">
    <div class="total-display"><div class="total-label">Total:</div><div class="total-amount">${formatPrice(tot.total)}</div></div>
    <button class="checkout-btn" id="checkoutBtn">Proceed to Checkout</button>
  </div>`;

  wire();
}

function wire() {
  document.getElementById('clearBtn')?.addEventListener('click', clearCart);
  screen.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => step(+b.dataset.inc, 1)));
  screen.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => step(+b.dataset.dec, -1)));
  screen.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => { dataService.updateQty(+b.dataset.remove, 0); haptic('medium'); render(); }));
  document.getElementById('applyPromoBtn')?.addEventListener('click', applyPromo);
  document.getElementById('promoInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyPromo(); });
  document.getElementById('removePromoBtn')?.addEventListener('click', () => { promo = null; persistPromo(); render(); });
  document.getElementById('checkoutBtn')?.addEventListener('click', () => { location.href = 'checkout.html'; });
  screen.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const p = recommended.find((x) => x.id === b.dataset.add);
    dataService.addToCart({ productId: p.id, variantId: null, name: p.name, price: p.price, type: p.type, image: placeholder(p.emoji, p.color, 150, 150) });
    haptic('success'); toast(`${p.name} added`, { kind: 'success' }); render();
  }));
}

function step(index, delta) {
  const cart = dataService.getCart();
  dataService.updateQty(index, cart[index].qty + delta);
  haptic('light'); render();
}
function applyPromo() {
  const code = document.getElementById('promoInput')?.value || '';
  const res = dataService.applyPromo(code);
  if (!res) { toast(t('cart.promo_invalid'), { kind: 'danger' }); haptic('error'); return; }
  promo = res; persistPromo(); haptic('success'); toast(`${res.label} applied`, { kind: 'success' }); render();
}
function persistPromo() {
  if (promo) localStorage.setItem(`${NS}:promo`, JSON.stringify(promo));
  else localStorage.removeItem(`${NS}:promo`);
}
async function clearCart() {
  if (await confirm('Clear your cart?')) { dataService.clearCart(); promo = null; persistPromo(); render(); }
}

(async function init() {
  const all = await dataService.getProducts();
  const inCart = new Set(dataService.getCart().map((i) => i.productId));
  recommended = all.filter((p) => p.inStock && !inCart.has(p.id)).slice(0, 3);
  render();
})();
