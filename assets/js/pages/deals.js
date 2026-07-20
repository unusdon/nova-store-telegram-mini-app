/**
 * Nova Kit — Deals / Flash Sale
 * A promotional hub: a countdown hero + a grid of discounted products (those with a
 * compare-at price), sorted by biggest saving.
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { dataService } from '../core/store.js';
import { toast } from '../core/ui.js';
import { pageHeader, productCard, bindWishButtons, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
let timer = null;

function pad(n) { return String(n).padStart(2, '0'); }

function startCountdown() {
  // Flash sale ends at the next midnight.
  const end = new Date(); end.setHours(24, 0, 0, 0);
  const tick = () => {
    const el = document.getElementById('cd'); if (!el) { clearInterval(timer); return; }
    let s = Math.max(0, Math.floor((end - new Date()) / 1000));
    const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
    el.innerHTML = `<span>${pad(h)}</span><span>${pad(m)}</span><span>${pad(s)}</span>`;
  };
  tick(); timer = setInterval(tick, 1000);
}

async function render() {
  const all = await dataService.getProducts();
  const deals = all.filter((p) => p.compareAtPrice)
    .sort((a, b) => (1 - a.price / a.compareAtPrice) < (1 - b.price / b.compareAtPrice) ? 1 : -1);

  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Deals', subtitle: 'Limited-time offers', back: 'index.html' });
  bindThemeToggle();

  // Math.max(...[]) is -Infinity, which would render "Up to NaN% off" when there are no deals.
  const topOff = deals.length ? Math.max(...deals.map((p) => 1 - p.price / p.compareAtPrice)) : 0;

  screen.innerHTML = `
    <div class="deals-hero"><h2>⚡ Flash Sale</h2>
      <p>Up to ${Math.round(topOff * 100)}% off — ends in</p>
      <div class="deals-countdown" id="cd"></div>
    </div>
    ${deals.length ? `<div class="pcard-grid" style="padding-top:8px">${deals.map(productCard).join('')}</div>`
      : `<div class="empty-state"><div class="empty-state__emoji">🏷️</div><h3>No active deals</h3>
          <a class="btn" href="catalog.html">${t('nav.catalog')}</a></div>`}
    <div style="height:24px"></div>`;

  bindWishButtons(screen, (_, w) => toast(w ? '❤️ Added to wishlist' : 'Removed from wishlist'));
  startCountdown();
}

render();
