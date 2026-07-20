/**
 * Nova Kit — My Downloads / Digital Library
 * Every digital product the customer has purchased, with a download button and (where the
 * product is a key) a reveal-key action. Purchases are derived from delivered/paid orders;
 * a demo purchase is seeded once so the page is never empty.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const screen = document.getElementById('screen');

function seed() {
  if (localStorage.getItem(`${NS}:seeded-downloads`)) return;
  localStorage.setItem(`${NS}:seeded-downloads`, '1');
  const orders = dataService.getOrders();
  const hasDigital = orders.some((o) => (o.items || []).some((i) => i.type === 'digital'));
  if (!hasDigital) {
    dataService.placeOrder({
      number: 'NV-D100', items: [{ name: 'Photon Photo Suite', qty: 1, price: 59, type: 'digital', emoji: '🎨', productId: 'p-photon-suite' }],
      subtotal: 59, discount: 0, shipping: 0, tax: 4.72, total: 63.72, status: 'delivered',
      address: { name: 'You' }, paymentMethod: 'Credit / Debit Card', shippingMethod: 'Digital',
    });
  }
}

/**
 * Deliverables for one library item. A product's `digital.assets` (set in admin → product editor)
 * become one action each: links open in a new tab, uploaded files download via their data URL.
 * Products with no assets keep the plain demo Download button.
 */
function assetActions(d) {
  const list = d.digital?.assets || [];
  if (!list.length) return `<button class="btn btn--sm" data-dl="${esc(d.name)}">${icon('download', { size: 16 })} Download</button>`;
  return `<div class="row gap-2" style="flex-wrap:wrap">${list.map((a) => (a.kind === 'link'
    ? `<a class="btn btn--sm btn--outline" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.label)}</a>`
    : `<a class="btn btn--sm btn--outline" href="${esc(a.dataUrl)}" download="${esc(a.name)}">${esc(a.name)}</a>`)).join('')}</div>`;
}

async function render() {
  const orders = dataService.getOrders();
  const products = await dataService.getProducts();
  // Flatten digital line items across paid/delivered orders into a library.
  const lib = [];
  orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
    (o.items || []).filter((i) => i.type === 'digital').forEach((it) => {
      const p = products.find((x) => x.id === it.productId || x.name === it.name);
      lib.push({ name: it.name, emoji: it.emoji || '💾', date: o.createdAt, order: o.number,
        digital: p?.digital, key: `NOVA-${(it.name || 'X').replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()}-${(o.number || '').replace(/\D/g, '') || '0000'}-7F3K` });
    });
  });

  document.getElementById('appbar').innerHTML = pageHeader({ title: 'My Downloads', subtitle: `${lib.length} item${lib.length === 1 ? '' : 's'}`, back: 'profile.html' });
  bindThemeToggle();

  screen.innerHTML = lib.length ? `<div class="extra-content">
    ${lib.map((d) => `<div class="dl-item" style="flex-wrap:wrap">
      <div class="dl-item__icon">${d.emoji}</div>
      <div class="dl-item__info"><div class="dl-item__name">${esc(d.name)}</div>
        <div class="dl-item__meta">${d.digital?.format || 'Digital download'} · order ${esc(d.order)} · ${formatDate(d.date)}</div></div>
      ${assetActions(d)}
      ${d.digital?.format?.toLowerCase().includes('key') || /key/i.test(d.digital?.format || '') ? `
        <div class="dl-key" style="flex-basis:100%"><span data-key>${'•'.repeat(4)}-••••-••••</span>
          <button class="text-accent semibold text-sm" data-reveal="${esc(d.key)}">Reveal key</button></div>` : ''}
    </div>`).join('')}
  </div>`
    : `<div class="empty-state" style="padding-top:60px"><div class="empty-state__emoji">📥</div>
        <h3>No downloads yet</h3><p>Digital products you buy appear here instantly.</p>
        <a class="btn" href="catalog.html?type=digital">Browse digital</a></div>`;

  screen.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', () => { haptic('success'); toast('Download started (demo)', { kind: 'success' }); }));
  screen.querySelectorAll('[data-reveal]').forEach((b) => b.addEventListener('click', () => {
    const keyEl = b.closest('.dl-key').querySelector('[data-key]');
    keyEl.textContent = b.dataset.reveal; b.textContent = 'Copy';
    b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.reveal); } catch {} toast('Key copied', { kind: 'success' }); };
    haptic('success');
  }));
}

seed();
render();
