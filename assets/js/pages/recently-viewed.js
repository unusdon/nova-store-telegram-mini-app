/**
 * Nova Kit — Recently Viewed
 * Products the shopper recently opened (recorded on the product page under
 * `nova:recentlyViewed`), newest first, in the standard product grid.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { dataService } from '../core/store.js';
import { toast } from '../core/ui.js';
import { pageHeader, productCard, bindWishButtons, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:recentlyViewed`;
const screen = document.getElementById('screen');

async function render() {
  const ids = JSON.parse(localStorage.getItem(KEY) || '[]');
  const all = await dataService.getProducts();
  const items = ids.map((id) => all.find((p) => p.id === id)).filter(Boolean);

  document.getElementById('appbar').innerHTML = pageHeader({
    title: 'Recently Viewed', subtitle: `${items.length} item${items.length === 1 ? '' : 's'}`, back: 'profile.html',
    action: items.length ? `<button class="hbtn" id="clearBtn" aria-label="Clear">${icon('trash', { size: 22 })}</button>` : '',
  });
  bindThemeToggle();

  screen.innerHTML = items.length
    ? `<div class="pcard-grid" style="padding-top:16px">${items.map(productCard).join('')}</div>`
    : `<div class="empty-state" style="padding-top:60px"><div class="empty-state__emoji">👀</div>
        <h3>Nothing viewed yet</h3><p>Products you open will show up here.</p>
        <a class="btn" href="catalog.html">${t('nav.catalog')}</a></div>`;

  bindWishButtons(screen, (_, w) => toast(w ? '❤️ Added to wishlist' : 'Removed from wishlist'));
  document.getElementById('clearBtn')?.addEventListener('click', () => { localStorage.removeItem(KEY); toast('History cleared'); render(); });
}

render();
