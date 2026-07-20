/**
 * Nova Kit — Home (storefront dashboard)
 * Recreates the original's arrangement: header + segmented pill, a large balance figure,
 * a quick-action grid, colour-accented "All Categories" cards, and trending sparkline cards.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc } from '../core/ui.js';
import { tabBar, themeToggleButton, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const TINTS = ['tint-blue', 'tint-green', 'tint-orange', 'tint-pink', 'tint-purple', 'tint-red'];
const SPARKS = [
  'M5,25 Q15,15 25,18 T45,8 T55,12', 'M5,20 Q15,10 25,15 T45,5 T55,8',
  'M5,22 Q15,12 25,16 T45,6 T55,10', 'M5,18 Q15,8 25,12 T45,4 T55,7',
];

function header() {
  const logo = config.brand.logoSvg || config.brand.logoEmoji;
  return `<div class="home-header">
    <div class="hh-top">
      <button class="hh-close" id="homeClose">Close</button>
      <div class="hh-center">
        <span class="hh-title">${esc(config.brand.shortName || config.brand.name)} ${config.brand.logoEmoji}</span>
        <span class="hh-sub">mini app</span>
      </div>
      <a class="appbar__btn" href="cart.html" aria-label="Cart">${icon('cart', { size: 22 })}
        <span class="appbar__badge hidden" data-badge="cart">0</span></a>
    </div>
    <div class="hh-content">
      <span class="hh-avatar">${logo}</span>
      <div class="pill">
        <a class="is-active" href="index.html">${t('nav.catalog')}</a>
        <a href="categories.html">${t('home.categories')}</a>
      </div>
      <span class="hh-slot">
        ${config.theme.allowUserToggle ? themeToggleButton() : `<a class="appbar__btn" href="search.html" aria-label="Search">${icon('search', { size: 22 })}</a>`}
      </span>
    </div>
  </div>`;
}

function actionGrid() {
  const actions = [
    { icon: 'bag', label: t('orders.title'), href: 'orders.html' },
    { icon: 'tag', label: 'Deals', href: 'deals.html' },
    { icon: 'heart', label: t('nav.wishlist'), href: 'wishlist.html' },
    { icon: 'card', label: 'Wallet', href: 'wallet.html' },
  ];
  return `<div class="action-grid">
    ${actions.map((a) => `<a class="action-item" href="${a.href}">
      <span class="action-item__icon">${icon(a.icon, { size: 24 })}</span>
      <span class="action-item__label">${esc(a.label)}</span>
    </a>`).join('')}
  </div>`;
}

function categoryCard(c, i) {
  const total = (c.subcategories || []).reduce((n, s) => n + (s.count || 0), 0);
  const subtitle = (c.subcategories || []).map((s) => s.name).slice(0, 3).join(', ');
  const isDigital = c.type === 'digital';
  const indClass = isDigital ? 'tint-blue' : 'tint-green';
  const indLabel = isDigital ? '💾 Digital' : '📦 Physical';
  return `<a class="cat-card" href="catalog.html?category=${c.id}">
    <span class="cat-card__icon ${TINTS[i % TINTS.length]}">${c.icon}</span>
    <span class="cat-card__body">
      <span class="cat-card__title">${esc(c.name)}
        <span class="indicator ${indClass}">${indLabel}</span></span>
      <span class="cat-card__sub">${esc(subtitle)}</span>
      <span class="cat-card__stats">
        <span>${total} products</span><span>${(c.subcategories || []).length} subcategories</span>
      </span>
    </span>
    <span class="cat-card__arrow">›</span>
  </a>`;
}

function trendCard(p, i) {
  const change = (6 + ((i * 37) % 12) + 0.6).toFixed(1);
  return `<a class="trend-card" href="product.html?id=${encodeURIComponent(p.id)}">
    <span class="trend-card__icon">${p.emoji}</span>
    <svg class="trend-card__spark" width="60" height="30" viewBox="0 0 60 30"><path d="${SPARKS[i % SPARKS.length]}"/></svg>
    <div class="trend-card__name">${esc(p.name.split(' ')[0])}</div>
    <div class="trend-card__change">↑ ${change}%</div>
    <div class="trend-card__price">${formatPrice(p.price)}</div>
  </a>`;
}

async function init() {
  const [categories, all] = await Promise.all([dataService.getCategories(), dataService.getProducts()]);
  const featured = all.filter((p) => p.badges?.includes('Bestseller'));
  // Lead with bestsellers, then top up from the rest of the catalogue to a full 2×2 grid.
  const trending = [...featured, ...all.filter((p) => !featured.includes(p))].slice(0, 4);

  document.getElementById('appbar').innerHTML = header();
  bindThemeToggle();
  document.getElementById('homeClose')?.addEventListener('click', () => {
    if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
  });

  screen.innerHTML = `
    <div class="store-balance">
      <div class="store-balance__label">Store Balance</div>
      <div class="store-balance__amount">${formatPrice(2456.78)}</div>
      <div class="store-balance__meta">↑ 2.4% ${t('home.balance_trend')}</div>
    </div>

    ${actionGrid()}

    ${config.features.categories ? `
      <div class="home-section">
        <div class="home-section__head">
          <span class="home-section__title">${t('home.categories')}</span>
          <a class="home-section__more" href="categories.html">${t('action.see_all')}</a>
        </div>
        <div class="cat-cards">${categories.map(categoryCard).join('')}</div>
      </div>` : ''}

    <div class="home-section">
      <div class="home-section__head">
        <span class="home-section__title">${t('home.trending')}</span>
        <a class="home-section__more" href="catalog.html">${t('action.see_all')}</a>
      </div>
      <div class="trend-grid">${trending.map(trendCard).join('')}</div>
    </div>
  `;

  document.getElementById('tabbar').innerHTML = tabBar('home');
}

init();
