/**
 * Nova Kit — App bootstrap
 * ========================
 * Import and call `bootstrap()` at the top of every page's script. It initialises the
 * Telegram adapter, applies the theme and language direction, and keeps the cart/wishlist
 * badges in sync. Returns nothing — pages then render their own content.
 */
import { config } from './config.js';
import { initTelegram, setBackButton } from './core/telegram.js';
import { applyTheme } from './core/theme.js';
import { applyDocumentDirection } from './i18n/index.js';
import { dataService, onStoreChange } from './core/store.js';

export function bootstrap({ back = null } = {}) {
  initTelegram();
  applyTheme();
  applyDocumentDirection();
  if (back) setBackButton(() => { window.location.href = back; });
  syncBadges();
  onStoreChange(syncBadges);
  return { config, dataService };
}

/** Update cart / wishlist / orders badges wherever they appear. */
export function syncBadges() {
  const cartCount = dataService.cartCount();
  document.querySelectorAll('[data-badge="cart"]').forEach((el) => {
    el.textContent = cartCount;
    el.classList.toggle('hidden', cartCount === 0);
  });
  setTabBadge('wishlist', dataService.getWishlist().length);
  setTabBadge('orders', dataService.getOrders().filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length);
}

function setTabBadge(tab, n) {
  document.querySelectorAll(`[data-tab-badge="${tab}"]`).forEach((el) => {
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  });
}

export default bootstrap;
