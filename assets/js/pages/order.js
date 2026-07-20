/**
 * Nova Kit — Order detail / tracking (faithful replica of the original order-view page)
 * Status card, Details / Tracking / Receipt tabs, timeline, receipt, reorder + track actions.
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice, formatDate } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, placeholder, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
const order = dataService.getOrders().find((o) => o.id === id);

const FLOW = ['pending', 'paid', 'shipped', 'delivered'];
const STATUS_META = {
  pending:   { icon: '⏳', text: 'Order Pending', desc: 'Weʼre awaiting payment confirmation.' },
  paid:      { icon: '📦', text: 'Order Confirmed', desc: 'Your order has been confirmed and is being prepared.' },
  shipped:   { icon: '🚚', text: 'On the Way', desc: 'Your order has shipped and is on its way.' },
  delivered: { icon: '✅', text: 'Delivered', desc: 'Your order has been delivered. Enjoy!' },
  cancelled: { icon: '❌', text: 'Cancelled', desc: 'This order was cancelled.' },
};
const TIMELINE = [
  { status: 'pending', title: 'Order Placed', desc: 'We received your order.' },
  { status: 'paid', title: 'Confirmed', desc: 'Payment confirmed, preparing your items.' },
  { status: 'shipped', title: 'Shipped', desc: 'Your package left our warehouse.' },
  { status: 'delivered', title: 'Delivered', desc: 'Package delivered to your address.' },
];

let activeTab = 'details';

function itemImage(it) {
  return it.image || placeholder(it.emoji || (it.type === 'digital' ? '💾' : '📦'), '#00FF88', 120, 120);
}

function detailsTab() {
  const a = order.address || {};
  return `<div class="tab-panel ${activeTab === 'details' ? 'active' : ''}" id="detailsTab">
    <div class="section"><h3 class="section-title">Items Ordered</h3>
      <div class="order-items">
        ${(order.items || []).map((it) => `<div class="order-item">
          <img class="item-image" src="${itemImage(it)}" alt="${esc(it.name)}">
          <div class="item-details"><div class="item-name">${esc(it.name)}</div>
            <div class="item-quantity">Qty: ${it.qty}</div></div>
          <div class="item-price">${formatPrice(it.price * it.qty)}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="section"><h3 class="section-title">Shipping Information</h3>
      <div class="info-card">
        <div class="info-row"><span class="info-label">Name</span><span class="info-value">${esc(a.name || 'Guest')}</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${esc(a.phone || '—')}</span></div>
        <div class="info-row"><span class="info-label">Address</span><span class="info-value">${[a.line1, a.line2, [a.city, a.region].filter(Boolean).join(', '), a.postal, a.country].filter(Boolean).map(esc).join('<br>') || '—'}</span></div>
        <div class="info-row"><span class="info-label">Delivery</span><span class="info-value">${esc(order.shippingMethod || 'Standard')}</span></div>
      </div>
    </div>
    <div class="section"><h3 class="section-title">Payment Method</h3>
      <div class="payment-card"><div class="payment-icon">💳</div>
        <div class="payment-info"><div class="payment-method">${esc(order.paymentMethod || 'Card')}</div>
          <div class="payment-status">${order.status === 'cancelled' ? 'Refunded' : 'Paid'}</div></div>
      </div>
    </div>
  </div>`;
}

function trackingTab() {
  const reached = FLOW.indexOf(order.status);
  return `<div class="tab-panel ${activeTab === 'tracking' ? 'active' : ''}" id="trackingTab">
    <div class="tracking-timeline">
      ${TIMELINE.map((step) => {
        const idx = FLOW.indexOf(step.status);
        const cls = idx < reached ? 'completed' : idx === reached ? 'current' : '';
        return `<div class="timeline-item ${cls}">
          <div class="timeline-dot">${idx < reached ? '✓' : idx + 1}</div>
          <div class="timeline-content"><div class="timeline-title">${step.title}</div>
            <div class="timeline-description">${step.desc}</div>
            <div class="timeline-time">${idx <= reached ? formatDate(order.createdAt) : 'Pending'}</div></div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function receiptTab() {
  const rows = [
    ['Subtotal', order.subtotal ?? order.total],
    order.discount ? ['Discount', -order.discount] : null,
    ['Shipping', order.shipping || 0],
    ['Tax', order.tax || 0],
  ].filter(Boolean);
  return `<div class="tab-panel ${activeTab === 'receipt' ? 'active' : ''}" id="receiptTab">
    <div class="receipt-container">
      <div class="receipt-header"><div class="receipt-title">Order Receipt</div>
        <div class="receipt-date">${formatDate(order.createdAt)}</div></div>
      <div class="receipt-items">
        ${(order.items || []).map((it) => `<div class="receipt-item">
          <span class="receipt-item-name">${esc(it.name)}</span>
          <span class="receipt-item-qty">×${it.qty}</span>
          <span class="receipt-item-price">${formatPrice(it.price * it.qty)}</span>
        </div>`).join('')}
      </div>
      <div class="receipt-summary">
        ${rows.map(([label, val]) => `<div class="summary-row"><span class="summary-label">${label}</span>
          <span class="summary-value">${val < 0 ? '-' : ''}${formatPrice(Math.abs(val))}</span></div>`).join('')}
        <div class="summary-row total"><span class="summary-label">Total</span><span class="summary-value">${formatPrice(order.total)}</span></div>
      </div>
      <div class="receipt-footer">
        <button class="download-receipt-btn" id="downloadBtn">${icon('box', { size: 16 })} Download Receipt</button>
      </div>
    </div>
  </div>`;
}

function reorder() {
  (order.items || []).forEach((it) => dataService.addToCart({
    productId: it.productId || it.name, variantId: null, name: it.name, price: it.price,
    type: it.type || 'physical', qty: it.qty, image: itemImage(it),
  }));
  haptic('success'); toast('Items added to cart', { kind: 'success' });
  setTimeout(() => { location.href = 'cart.html'; }, 600);
}

function render() {
  if (!order) {
    document.getElementById('appbar').innerHTML = header('Order');
    screen.innerHTML = `<div class="order-content"><div class="empty-state"><div class="empty-state__emoji">❌</div>
      <h3>Order Not Found</h3><p>The order you're looking for doesn't exist.</p>
      <a class="btn" href="orders.html">${t('orders.title')}</a></div></div>`;
    return;
  }
  const meta = STATUS_META[order.status] || STATUS_META.paid;

  document.getElementById('appbar').innerHTML = header(order.number);
  bindThemeToggle();

  screen.innerHTML = `<div class="order-content">
    <div class="status-card">
      <div class="status-icon">${meta.icon}</div>
      <div class="status-info"><div class="status-text">${meta.text}</div>
        <div class="status-description">${meta.desc}</div>
        ${order.status === 'shipped' || order.status === 'paid'
          ? `<div class="estimated-delivery">Expected delivery: ${estDelivery()}</div>` : ''}
      </div>
    </div>
    <div class="tab-navigation">
      ${[['details', 'Details'], ['tracking', 'Tracking'], ['receipt', 'Receipt']].map(([k, l]) =>
        `<button class="tab-button ${activeTab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}
    </div>
    <div class="tab-content">${detailsTab()}${trackingTab()}${receiptTab()}</div>
  </div>`;

  document.getElementById('bottombar').innerHTML = `<div class="bottom-actions">
    <button class="action-btn secondary" id="reorderBtn">Reorder</button>
    <button class="action-btn primary" id="trackBtn">Track Package</button>
  </div>`;

  wire();
}

function estDelivery() {
  const d = new Date(order.createdAt); d.setDate(d.getDate() + 5);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function header(title) {
  return `<header class="order-view-header"><div class="header-top">
    <a class="back-button" href="orders.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Order Details</h1>
      <span class="order-id">${esc(title)}</span></div>
    <button class="share-button" id="shareBtn" aria-label="Share">${icon('send', { size: 22 })}</button>
  </div></header>`;
}

function wire() {
  screen.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    activeTab = b.dataset.tab;
    screen.querySelectorAll('.tab-button').forEach((x) => x.classList.toggle('active', x === b));
    screen.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === activeTab + 'Tab'));
    haptic('selection');
  }));
  document.getElementById('reorderBtn').addEventListener('click', reorder);
  document.getElementById('trackBtn').addEventListener('click', () => {
    activeTab = 'tracking';
    screen.querySelector('[data-tab="tracking"]').click();
    screen.scrollIntoView?.({ behavior: 'smooth' });
  });
  document.getElementById('downloadBtn')?.addEventListener('click', () => toast('Receipt downloaded (demo)', { kind: 'success' }));
  document.getElementById('shareBtn')?.addEventListener('click', () => {
    const text = `My order ${order.number} — ${formatPrice(order.total)}`;
    if (navigator.share) navigator.share({ text }).catch(() => {}); else toast('Sharing not available');
  });
}

render();
