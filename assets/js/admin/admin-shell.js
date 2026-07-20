/**
 * Nova Kit — Admin shell
 * ======================
 * Shared chrome for every admin page: bootstrap, top header (menu + back + theme toggle),
 * a bottom tab bar of primary sections, and a slide-up drawer listing ALL admin sections.
 * Admin pages live in `admin/`; hrefs here are relative to that folder.
 */
import { config } from '../config.js';
import { initTelegram } from '../core/telegram.js';
import { applyTheme } from '../core/theme.js';
import { applyDocumentDirection } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { esc, bottomSheet } from '../core/ui.js';
import { bindThemeToggle, themeToggleButton } from '../components.js';

/** Every admin section (used by the drawer and dashboard grid). */
export const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home',  href: 'index.html' },
  { id: 'orders',    label: 'Orders',    icon: 'bag',   href: 'orders.html' },
  { id: 'returns',   label: 'Returns',   icon: 'box',   href: 'returns.html' },
  { id: 'abandoned', label: 'Abandoned', icon: 'cart',  href: 'abandoned.html' },
  { id: 'products',  label: 'Products',  icon: 'box',   href: 'products.html' },
  { id: 'collections', label: 'Collections', icon: 'grid', href: 'collections.html' },
  { id: 'keys',      label: 'Digital Keys', icon: 'key', href: 'keys.html' },
  { id: 'categories',label: 'Categories',icon: 'grid',  href: 'categories.html' },
  { id: 'inventory', label: 'Inventory', icon: 'box',   href: 'inventory.html' },
  { id: 'questions', label: 'Q&A',       icon: 'help',  href: 'questions.html' },
  { id: 'customers', label: 'Customers', icon: 'users', href: 'customers.html' },
  { id: 'support',   label: 'Support',   icon: 'help',  href: 'support.html' },
  { id: 'content',   label: 'Content',   icon: 'image', href: 'content.html' },
  { id: 'wallet',    label: 'Wallets',   icon: 'card',  href: 'wallet.html' },
  { id: 'transactions', label: 'Transactions', icon: 'card', href: 'transactions.html' },
  { id: 'payouts',   label: 'Payouts',   icon: 'download', href: 'payouts.html' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', href: 'analytics.html' },
  { id: 'reports',   label: 'Reports',   icon: 'chart', href: 'reports.html' },
  { id: 'marketing', label: 'Marketing', icon: 'tag',   href: 'marketing.html' },
  { id: 'discounts', label: 'Discounts', icon: 'tag',   href: 'discounts.html' },
  { id: 'giftcards', label: 'Gift Cards', icon: 'gift', href: 'gift-cards.html' },
  { id: 'loyalty',   label: 'Loyalty',   icon: 'star',  href: 'loyalty.html' },
  { id: 'referrals', label: 'Referrals', icon: 'gift',  href: 'referrals.html' },
  { id: 'broadcast', label: 'Broadcast', icon: 'send',  href: 'broadcast.html' },
  { id: 'templates', label: 'Templates', icon: 'image', href: 'templates.html' },
  { id: 'reviews',   label: 'Reviews',   icon: 'star',  href: 'reviews.html' },
  { id: 'shipping',  label: 'Shipping',  icon: 'truck', href: 'shipping.html' },
  { id: 'payments',  label: 'Payments',  icon: 'card',  href: 'payments.html' },
  { id: 'integrations', label: 'Integrations', icon: 'plug', href: 'integrations.html' },
  { id: 'activity',  label: 'Activity Log', icon: 'clock', href: 'activity.html' },
  { id: 'staff',     label: 'Staff',     icon: 'users', href: 'staff.html' },
  { id: 'settings',  label: 'Settings',  icon: 'gear',  href: 'settings.html' },
];

/** Primary sections shown in the bottom tab bar (last item opens the full drawer). */
const PRIMARY = ['dashboard', 'orders', 'products', 'analytics'];

export function adminBootstrap() {
  initTelegram();
  applyTheme();
  applyDocumentDirection();
  document.body.classList.add('admin');
  return { config };
}

/** Admin top header. `menu:true` shows the drawer button; `back` is an href. */
export function adminHeader({ title, back = null, menu = true, actions = '' } = {}) {
  const left = back
    ? `<a class="appbar__btn" href="${back}" aria-label="Back">${icon('back', { size: 22 })}</a>`
    : menu
      ? `<button class="appbar__btn" id="adminMenuBtn" aria-label="Menu">${icon('grid', { size: 22 })}</button>`
      : '<span class="appbar__btn appbar__btn--placeholder"></span>';
  return `<header class="appbar admin-appbar">
    ${left}
    <h1 class="appbar__title">${esc(title)}</h1>
    <div class="appbar__actions">
      ${config.theme.allowUserToggle ? themeToggleButton() : ''}
      ${actions}
    </div>
  </header>`;
}

export function adminTabBar(activeId) {
  const tabs = PRIMARY.map((id) => ADMIN_NAV.find((n) => n.id === id));
  const items = tabs.map((tab) => `
    <a class="tabbar__item${tab.id === activeId ? ' is-active' : ''}" href="${tab.href}" aria-label="${esc(tab.label)}">
      <span class="tabbar__icon">${icon(tab.icon, { size: 24, filled: tab.id === activeId })}</span>
      <span class="tabbar__label">${esc(tab.label)}</span>
    </a>`).join('');
  const more = `<button class="tabbar__item" id="adminMoreBtn" aria-label="More">
      <span class="tabbar__icon">${icon('filter', { size: 24 })}</span>
      <span class="tabbar__label">More</span>
    </button>`;
  return `<nav class="tabbar" role="navigation">${items}${more}</nav>`;
}

/** Wire the menu/more buttons and the theme toggle after inserting the chrome. */
export function bindAdminChrome() {
  bindThemeToggle();
  document.getElementById('adminMenuBtn')?.addEventListener('click', openDrawer);
  document.getElementById('adminMoreBtn')?.addEventListener('click', openDrawer);
}

export function openDrawer() {
  const grid = ADMIN_NAV.map((n) => `
    <a class="drawer-item" href="${n.href}">
      <span class="drawer-item__icon">${icon(n.icon, { size: 22 })}</span>
      <span>${esc(n.label)}</span>
    </a>`).join('');
  const storefront = `<a class="drawer-item drawer-item--exit" href="../index.html">
      <span class="drawer-item__icon">${icon('logout', { size: 22 })}</span><span>View storefront</span></a>`;
  bottomSheet({ title: `${config.brand.name} · Admin`, content: `<div class="drawer-grid">${grid}${storefront}</div>` });
}

export default { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome, openDrawer, ADMIN_NAV };
