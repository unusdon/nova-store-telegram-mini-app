/**
 * Nova Kit — Shared UI components
 * ===============================
 * Config-driven, reusable render helpers used by every page: app bar, bottom tab bar,
 * product card, section header, rating stars, price tag. All content is config/i18n-driven.
 */
import { config } from './config.js';
import { t } from './i18n/index.js';
import { icon } from './core/icons.js';
import { formatPrice } from './core/format.js';
import { placeholder, esc } from './core/ui.js';
import { dataService } from './core/store.js';
import { getColorScheme, toggleColorScheme } from './core/theme.js';
import { haptic } from './core/telegram.js';

/**
 * Top app bar. Renders an optional back button, a title, and action buttons.
 * Set `themeToggle: true` to include the Black/White switch (respects
 * `config.theme.allowUserToggle`). Remember to call `bindThemeToggle()` afterwards.
 */
export function appBar({ title = '', subtitle = '', back = null, actions = [], themeToggle = false, brand = false } = {}) {
  const toggle = themeToggle && config.theme.allowUserToggle ? themeToggleButton() : '';
  const acts = actions.map((a) =>
    `<a class="appbar__btn" href="${a.href}" aria-label="${esc(a.label)}">
       ${icon(a.icon, { size: 22 })}
       ${a.badge != null ? `<span class="appbar__badge${a.badge ? '' : ' hidden'}" data-badge="${a.badgeKey || ''}">${a.badge}</span>` : ''}
     </a>`).join('');

  // Brand mode: left-aligned logo mark + name + greeting (a neat, app-like header).
  if (brand) {
    const logo = config.brand.logoSvg || config.brand.logoEmoji;
    return `<header class="appbar appbar--brand">
      <div class="brand-mark">
        <span class="brand-mark__logo">${logo}</span>
        <span class="brand-mark__text">
          <span class="brand-mark__name">${esc(title || config.brand.name)}</span>
          ${subtitle ? `<span class="brand-mark__sub">${esc(subtitle)}</span>` : ''}
        </span>
      </div>
      <div class="appbar__actions">${toggle}${acts}</div>
    </header>`;
  }

  const backBtn = back
    ? `<a class="appbar__btn" href="${back}" aria-label="${t('action.back')}">${icon('back', { size: 22 })}</a>`
    : `<span class="appbar__btn appbar__btn--placeholder"></span>`;
  return `<header class="appbar">
    ${backBtn}
    <h1 class="appbar__title">${esc(title || config.brand.name)}</h1>
    <div class="appbar__actions">${toggle}${acts}
      ${!toggle && !acts ? '<span class="appbar__btn appbar__btn--placeholder"></span>' : ''}</div>
  </header>`;
}

/**
 * Black/White theme toggle button. Renders a sun/moon depending on the active scheme.
 * Include it in an app bar's `actions` via `themeToggleAction()`, then call
 * `bindThemeToggle()` after inserting the bar into the DOM.
 */
export function themeToggleButton() {
  const dark = getColorScheme() === 'dark';
  return `<button class="appbar__btn" data-theme-toggle aria-label="Toggle light and dark">
    ${icon(dark ? 'sun' : 'moon', { size: 22 })}
  </button>`;
}

/** Wire every theme-toggle button on the page (idempotent). */
export function bindThemeToggle(root = document, onToggle) {
  root.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const scheme = toggleColorScheme();
      haptic('selection');
      // Refresh every toggle icon on the page to reflect the new scheme.
      document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
        b.innerHTML = icon(scheme === 'dark' ? 'sun' : 'moon', { size: 22 });
      });
      onToggle?.(scheme);
    });
  });
}

/** Bottom tab bar, built entirely from `config.nav.tabs`. */
export function tabBar(activeId) {
  const items = config.nav.tabs.map((tab) => {
    const active = tab.id === activeId ? ' is-active' : '';
    const badge = tab.id === 'orders' || tab.id === 'wishlist'
      ? `<span class="tabbar__badge hidden" data-tab-badge="${tab.id}"></span>` : '';
    return `<a class="tabbar__item${active}" href="${tab.href}" aria-label="${esc(tab.label)}"
       ${active ? 'aria-current="page"' : ''}>
       <span class="tabbar__icon">${icon(tab.icon, { size: 24, filled: tab.id === activeId })}${badge}</span>
       <span class="tabbar__label">${esc(tab.label)}</span>
     </a>`;
  }).join('');
  return `<nav class="tabbar" role="navigation">${items}</nav>`;
}

/** Compact star rating. */
export function ratingStars(rating, count) {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span class="star${i < Math.round(rating) ? ' is-on' : ''}">${icon('star', { size: 13, filled: i < Math.round(rating) })}</span>`
  ).join('');
  return `<span class="rating">${stars}
    <span class="rating__value">${rating.toFixed(1)}</span>
    ${count != null ? `<span class="rating__count">(${count})</span>` : ''}</span>`;
}

/** Price with optional strike-through compare-at price. */
export function priceTag(price, compareAt) {
  return `<span class="price">
    <span class="price__now">${formatPrice(price)}</span>
    ${compareAt ? `<span class="price__was">${formatPrice(compareAt)}</span>` : ''}
  </span>`;
}

/**
 * Generic page header: back button + centred title/subtitle + optional right action.
 * `action` is raw HTML (e.g. an anchor/button) or omitted. `back` is an href.
 */
export function pageHeader({ title = '', subtitle = '', back = 'index.html', action = '' } = {}) {
  return `<header class="page-header"><div class="header-top">
    <a class="hbtn" href="${back}" aria-label="${t('action.back')}">${icon('back', { size: 24 })}</a>
    <div class="htitle"><h1>${esc(title)}</h1>${subtitle ? `<span>${esc(subtitle)}</span>` : ''}</div>
    ${action || '<span class="hbtn" style="visibility:hidden"></span>'}
  </div></header>`;
}

/** Section header with an optional "see all" link. */
export function sectionHeader(title, href) {
  return `<div class="section-head">
    <h2>${esc(title)}</h2>
    ${href ? `<a class="section-head__link" href="${href}">${t('action.see_all')}</a>` : ''}
  </div>`;
}

/** Product card for grids. */
export function productCard(p) {
  const img = placeholder(p.emoji, p.color);
  const badge = p.badges?.[0]
    ? `<span class="pcard__badge">${esc(p.badges[0])}</span>` : '';
  const wished = dataService.isWished(p.id) ? ' is-wished' : '';
  const oos = !p.inStock ? '<span class="pcard__oos">' + t('product.out_of_stock') + '</span>' : '';
  return `<a class="pcard" href="product.html?id=${encodeURIComponent(p.id)}" data-product="${p.id}">
    <div class="pcard__media">
      <img src="${img}" alt="${esc(p.name)}" loading="lazy" width="600" height="600">
      ${badge}${oos}
      <button class="pcard__wish${wished}" data-wish="${p.id}" aria-label="Wishlist">
        ${icon('heart', { size: 18, filled: Boolean(wished) })}
      </button>
    </div>
    <div class="pcard__body">
      <div class="pcard__name">${esc(p.name)}</div>
      ${config.features.ratings ? ratingStars(p.rating, p.reviewCount) : ''}
      ${priceTag(p.price, p.compareAtPrice)}
    </div>
  </a>`;
}

/** Wire wishlist heart buttons within a container (idempotent). */
export function bindWishButtons(root = document, onToggle) {
  root.querySelectorAll('[data-wish]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-wish');
      const nowWished = dataService.toggleWishlist(id);
      btn.classList.toggle('is-wished', nowWished);
      btn.innerHTML = icon('heart', { size: 18, filled: nowWished });
      onToggle?.(id, nowWished);
    });
  });
}

export default {
  appBar, tabBar, ratingStars, priceTag, sectionHeader, productCard, bindWishButtons,
  themeToggleButton, bindThemeToggle, pageHeader,
};
