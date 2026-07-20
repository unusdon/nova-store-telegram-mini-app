/**
 * Nova Kit — Checkout (faithful replica of the original checkout page)
 * Single-form flow: order summary, shipping form, delivery options, payment methods
 * (incl. crypto + manual), order notes, terms gate, and processing / success modals.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService, cartTotals } from '../core/store.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pay, enabledMethods, methodById, toStars, toTon } from '../core/payments.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const screen = document.getElementById('screen');
const cart = dataService.getCart();
const promo = JSON.parse(localStorage.getItem(`${NS}:promo`) || 'null');
const defaultAddr = dataService.getAddresses().find((a) => a.default) || {};

if (!cart.length) location.href = 'cart.html';

const DELIVERY = { standard: 9.99, express: 19.99, overnight: 39.99 };
const state = {
  delivery: 'standard',
  country: defaultAddr.country || '',
  payment: (enabledMethods({ country: defaultAddr.country })[0] || {}).id || 'cod',
  agree: false,
};

const COUNTRIES = [['', 'Select country'], ['US', 'United States'], ['CA', 'Canada'], ['UK', 'United Kingdom'],
  ['DE', 'Germany'], ['FR', 'France'], ['AU', 'Australia'], ['JP', 'Japan'], ['NG', 'Nigeria'], ['OTHER', 'Other']];

function total() {
  return cartTotals(cart, promo, DELIVERY[state.delivery]).total;
}

/* Small conversion hint shown under a method (e.g. how many Stars / TON the total is). */
function payHint(m, amount) {
  if (m.provider === 'telegramStars') return `≈ ${toStars(amount).toLocaleString()} ⭐`;
  if (m.provider === 'tonConnect') return `≈ ${toTon(amount)} TON`;
  return esc(m.note || '');
}

/* Payment methods, config-driven — filtered by the chosen country (Stripe "where supported"). */
function paymentSectionHTML() {
  const amount = total();
  const methods = enabledMethods({ country: state.country });
  if (!methods.some((m) => m.id === state.payment)) state.payment = (methods[0] || {}).id || '';
  const rows = methods.map((m) => `<label class="payment-option">
    <input type="radio" name="payment" value="${m.id}" ${state.payment === m.id ? 'checked' : ''}>
    <div class="option-content"><div class="payment-icon">${m.icon}</div>
      <div class="option-info"><div class="option-name">${esc(m.label)}</div>
        <div class="option-description">${payHint(m, amount)}</div></div></div>
  </label>`).join('');
  return `<div class="payment-section" id="paymentSection"><h3 class="section-title">Payment Method</h3>
    <div class="payment-options">${rows || '<p class="muted text-sm">No payment methods available for this destination.</p>'}</div></div>`;
}

function deliveryOption(id, name, desc, price) {
  return `<label class="delivery-option">
    <input type="radio" name="delivery" value="${id}" ${state.delivery === id ? 'checked' : ''}>
    <div class="option-content"><div class="option-info"><div class="option-name">${name}</div>
      <div class="option-description">${desc}</div></div><div class="option-price">${formatPrice(price)}</div></div>
  </label>`;
}
function render() {
  document.getElementById('appbar').innerHTML = `<header class="checkout-header"><div class="header-top">
    <a class="back-button" href="cart.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Checkout</h1><span class="step-indicator">Step 1 of 2</span></div>
    <div class="header-spacer"></div></div></header>`;
  bindThemeToggle();

  const tot = cartTotals(cart, promo, DELIVERY[state.delivery]);

  screen.innerHTML = `<div class="checkout-content">
    <div class="order-summary-section"><h3 class="section-title">Order Summary</h3>
      <div class="order-items">
        ${cart.map((it) => `<div class="co-item"><span class="co-item__name">${esc(it.name)}</span>
          <span class="co-item__qty">×${it.qty}</span><span class="co-item__price">${formatPrice(it.price * it.qty)}</span></div>`).join('')}
      </div>
      <div class="order-total"><div class="total-row"><span class="total-label">Total</span>
        <span class="total-amount" id="coTotal">${formatPrice(tot.total)}</span></div></div>
    </div>

    <div class="shipping-section"><h3 class="section-title">Shipping Information</h3>
      <div class="form-group"><label class="form-label">Full Name</label>
        <input type="text" class="form-input" id="fullName" value="${esc(defaultAddr.name || '')}" placeholder="Enter your full name"></div>
      <div class="form-group"><label class="form-label">Phone Number</label>
        <input type="tel" class="form-input" id="phone" value="${esc(defaultAddr.phone || '')}" placeholder="Enter your phone number"></div>
      <div class="form-group"><label class="form-label">Address</label>
        <input type="text" class="form-input" id="address" value="${esc(defaultAddr.line1 || '')}" placeholder="Street address"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">City</label>
          <input type="text" class="form-input" id="city" value="${esc(defaultAddr.city || '')}" placeholder="City"></div>
        <div class="form-group"><label class="form-label">Postal Code</label>
          <input type="text" class="form-input" id="postal" value="${esc(defaultAddr.postal || '')}" placeholder="Postal code"></div>
      </div>
      <div class="form-group"><label class="form-label">Country</label>
        <select class="form-select" id="country">${COUNTRIES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
    </div>

    <div class="delivery-section"><h3 class="section-title">Delivery Options</h3>
      <div class="delivery-options">
        ${deliveryOption('standard', 'Standard Delivery', '5–7 business days', DELIVERY.standard)}
        ${deliveryOption('express', 'Express Delivery', '2–3 business days', DELIVERY.express)}
        ${deliveryOption('overnight', 'Overnight Delivery', 'Next business day', DELIVERY.overnight)}
      </div>
    </div>

    ${paymentSectionHTML()}

    <div class="notes-section"><h3 class="section-title">Order Notes (Optional)</h3>
      <textarea class="form-textarea" id="notes" placeholder="Any special instructions for your order…"></textarea></div>

    <div class="terms-section"><label class="checkbox-container">
      <input type="checkbox" id="agree" ${state.agree ? 'checked' : ''}><span class="checkmark"></span>
      <span class="checkbox-text">I agree to the <a href="legal.html?doc=terms" class="terms-link">Terms and Conditions</a> and <a href="legal.html?doc=privacy" class="terms-link">Privacy Policy</a></span>
    </label></div>
  </div>`;

  if (defaultAddr.country) { const sel = document.getElementById('country'); if (sel) sel.value = defaultAddr.country; }

  document.getElementById('bottombar').innerHTML = `<div class="bottom-actions">
    <div class="total-display"><div class="total-label">Total Amount</div><div class="total-amount" id="bottomTotal">${formatPrice(tot.total)}</div></div>
    <button class="place-order-btn" id="placeOrderBtn" ${state.agree ? '' : 'disabled'}>Place Order</button>
  </div>`;

  wire();
}

function bindPaymentInputs() {
  screen.querySelectorAll('input[name="payment"]').forEach((r) => r.addEventListener('change', () => { state.payment = r.value; haptic('selection'); }));
}

/* Rebuild the payment section (hints + Stripe country gating depend on total/country). */
function refreshPayments() {
  const host = document.getElementById('paymentSection');
  if (!host) return;
  host.outerHTML = paymentSectionHTML();
  bindPaymentInputs();
}

function wire() {
  screen.querySelectorAll('input[name="delivery"]').forEach((r) => r.addEventListener('change', () => {
    state.delivery = r.value; const tot = total();
    document.getElementById('coTotal').textContent = formatPrice(tot);
    document.getElementById('bottomTotal').textContent = formatPrice(tot);
    refreshPayments(); // Stars/TON hints track the new total
    haptic('selection');
  }));
  document.getElementById('country')?.addEventListener('change', (e) => { state.country = e.target.value; refreshPayments(); });
  bindPaymentInputs();
  document.getElementById('agree').addEventListener('change', (e) => {
    state.agree = e.target.checked;
    document.getElementById('placeOrderBtn').disabled = !state.agree;
  });
  document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

async function placeOrder() {
  const v = (id) => document.getElementById(id)?.value.trim() || '';
  if (!v('fullName') || !v('phone') || !v('address') || !v('city')) {
    toast('Please complete your shipping details', { kind: 'danger' }); haptic('error'); return;
  }
  const method = methodById(state.payment);
  if (!method) { toast('Please choose a payment method', { kind: 'danger' }); haptic('error'); return; }

  const address = dataService.saveAddress({
    id: defaultAddr.id, label: defaultAddr.label || 'Home', name: v('fullName'), phone: v('phone'),
    line1: v('address'), city: v('city'), postal: v('postal'), country: v('country'), default: true,
  });
  const tot = cartTotals(cart, promo, DELIVERY[state.delivery]);
  const draft = {
    items: cart, ...tot, address, paymentMethod: method.label, paymentProvider: method.provider, promo,
    shippingMethod: state.delivery[0].toUpperCase() + state.delivery.slice(1), notes: v('notes'),
  };

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  showProcessing();
  try {
    const result = await pay({ method, amount: tot.total, description: `Order at ${config.brand.name}`, order: draft });
    if (result.status === 'redirect') return; // navigated to the gateway (e.g. Stripe); return page finalises
    if (result.status === 'failed') {
      document.getElementById('coProcessing')?.remove();
      btn.disabled = false;
      toast(result.error ? `Payment failed: ${result.error}` : 'Payment failed. Please try again.', { kind: 'danger' });
      haptic('error');
      return;
    }
    finaliseOrder(draft, result);
  } catch (err) {
    document.getElementById('coProcessing')?.remove();
    btn.disabled = false;
    toast(`Payment error: ${err.message}`, { kind: 'danger' }); haptic('error');
  }
}

/* Record the order once a rail reports paid/pending, then show the success modal. */
function finaliseOrder(draft, result) {
  const order = dataService.placeOrder({
    ...draft,
    paymentStatus: result.status, // 'paid' | 'pending'
    paymentReference: result.reference || null,
  });
  dataService.clearCart();
  localStorage.removeItem(`${NS}:promo`);
  localStorage.removeItem(`${NS}:pendingOrder`);
  haptic('success');
  document.getElementById('coProcessing')?.remove();
  showSuccess(order, result);
}

function showProcessing() {
  const el = document.createElement('div');
  el.id = 'coProcessing'; el.className = 'co-modal';
  el.innerHTML = `<div class="modal-content"><div class="co-spinner"></div>
    <h3 class="processing-title">Processing Payment</h3>
    <p class="processing-description">Please wait while we process your payment…</p></div>`;
  document.body.appendChild(el);
}
function showSuccess(order, result = {}) {
  const pending = result.status === 'pending';
  const el = document.createElement('div');
  el.className = 'co-modal';
  el.innerHTML = `<div class="modal-content"><div class="success-icon">${pending ? '⏳' : '✅'}</div>
    <h3 class="success-title">${pending ? 'Order Placed — Awaiting Payment' : 'Order Placed Successfully!'}</h3>
    <p class="success-description">Your order ${esc(order.number)} has been ${pending ? 'received. We’ll confirm once your payment settles.' : 'confirmed.'}</p>
    ${result.simulated ? '<p class="processing-description" style="margin-top:4px">Demo payment — configure a provider in config.js to charge for real.</p>' : ''}
    <div class="success-actions">
      <button class="track-order-btn" id="trackBtn">Track Order</button>
      <button class="continue-shopping-btn" onclick="location.href='index.html'">Continue Shopping</button>
    </div></div>`;
  document.body.appendChild(el);
  el.querySelector('#trackBtn').addEventListener('click', () => { location.href = `order.html?id=${encodeURIComponent(order.id)}`; });
}

render();
