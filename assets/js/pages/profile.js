/**
 * Nova Kit — Profile (faithful replica of the original profile page)
 * Avatar + camera, name/email, 3 stats, sectioned option lists, notifications toggle, sign out.
 * Uses the Telegram user when available; option entries respect feature flags.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, isTelegram, confirm } from '../core/telegram.js';
import { tabBar, themeToggleButton, bindThemeToggle } from '../components.js';
import { walletBalance } from '../data/transactions.js';

bootstrap();

const screen = document.getElementById('screen');
const NS = config.data.persistNamespace;
const prefs = JSON.parse(localStorage.getItem(`${NS}:prefs`) || '{}');
const savedProfile = JSON.parse(localStorage.getItem(`${NS}:profile`) || '{}');
const AVATAR_KEY = `${NS}:avatar`;
const MAX_AVATAR = 2 * 1024 * 1024;
const EMOJIS = ['🛍️', '😀', '😎', '🧑', '👩', '👨', '🦊', '🐼', '🐨', '🚀', '⭐', '🔥', '🎧', '🎮', '📚', '☕'];
let avatar = JSON.parse(localStorage.getItem(AVATAR_KEY) || 'null'); // { type:'image'|'emoji', value }

function tgUser() { return window.Telegram?.WebApp?.initDataUnsafe?.user || null; }
function saveAvatar() { avatar ? localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar)) : localStorage.removeItem(AVATAR_KEY); }

function avatarInner() {
  if (avatar?.type === 'image') return `<img class="avatar-photo" src="${avatar.value}" alt="Profile photo">`;
  return `<div class="avatar-placeholder">${avatar?.value || config.brand.logoEmoji}</div>`;
}

const ICON_TINTS = ['tint-blue', 'tint-green', 'tint-orange', 'tint-pink', 'tint-purple', 'tint-red'];
let tintIdx = 0;

function optionItem({ icon: ic, title, subtitle, href, badge, toggle }) {
  const right = toggle
    ? `<label class="switch"><input type="checkbox" data-pref="notifications" ${prefs.notifications !== false ? 'checked' : ''}><span class="switch__track"></span></label>`
    : `${badge != null && badge !== 0 ? `<span class="option-badge">${badge}</span>` : ''}<span class="option-arrow">›</span>`;
  const tag = href ? 'a' : 'div';
  const attr = href ? ` href="${href}"` : '';
  return `<${tag} class="option-item"${attr}>
    <span class="option-icon ${ICON_TINTS[tintIdx++ % ICON_TINTS.length]}">${icon(ic, { size: 22 })}</span>
    <span class="option-details"><span class="option-title">${esc(title)}</span>
      <span class="option-subtitle">${esc(subtitle)}</span></span>
    ${right}
  </${tag}>`;
}

function section(title, items) {
  const list = items.filter(Boolean).map(optionItem).join('');
  if (!list) return '';
  return `<div class="option-section"><h3 class="section-title">${esc(title)}</h3>
    <div class="options-list">${list}</div></div>`;
}

function render() {
  const user = tgUser();
  const savedName = [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(' ');
  const name = savedName || (user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : 'Guest User');
  const verified = Boolean(user);
  const handle = user?.username ? '@' + user.username : '';
  const email = savedProfile.email || handle || '';
  const complete = Boolean(savedName || email); // has the shopper filled in details?
  const f = config.features;
  const orders = dataService.getOrders().length;
  const wish = dataService.getWishlist().length;
  const addr = dataService.getAddresses().length;
  const balance = walletBalance();

  document.getElementById('appbar').innerHTML = `<header class="profile-header"><div class="header-top">
    <span style="width:40px"></span>
    <div class="header-center"><h1 class="page-title">${t('profile.title')}</h1>
      <span class="profile-subtitle">Manage your account</span></div>
    ${config.theme.allowUserToggle ? themeToggleButton() : '<span style="width:40px"></span>'}
  </div></header>`;
  bindThemeToggle();
  tintIdx = 0; // stable colour cycle for the menu icons on each render

  screen.innerHTML = `<div class="profile-content">
    <div class="profile-info-section">
      <div class="profile-avatar">
        <div class="avatar-image${avatar?.type === 'image' ? ' has-photo' : ''}">${avatarInner()}</div>
        <button class="change-avatar-btn" id="avatarBtn" aria-label="Change photo">${icon('image', { size: 16 })}</button>
      </div>
      <div class="profile-name">${esc(name)}${verified ? ` <span class="profile-verified" title="Verified">${icon('check', { size: 16 })}</span>` : ''}</div>
      ${complete
        ? `<div class="profile-email">${esc(email || 'Nova member')}</div>`
        : `<a class="profile-email profile-email--action" href="personal-info.html">Complete your profile ›</a>`}
      <div class="profile-badges">
        <span class="profile-badge">✨ Nova Member</span>
        <a class="profile-badge profile-badge--link" href="wallet.html">💳 ${formatPrice(balance)}</a>
      </div>
      <div class="profile-stats">
        <a class="stat-item" href="orders.html"><div class="stat-value">${orders}</div><div class="stat-label">Orders</div></a>
        <a class="stat-item" href="wishlist.html"><div class="stat-value">${wish}</div><div class="stat-label">Favorites</div></a>
        <a class="stat-item" href="addresses.html"><div class="stat-value">${addr}</div><div class="stat-label">Addresses</div></a>
      </div>
    </div>
    <input type="file" id="avatarFile" accept="image/*" hidden>

    <div class="profile-options">
      ${section('My Account', [
        { icon: 'bag', title: 'Order History', subtitle: 'View all your past orders', href: 'orders.html', badge: orders },
        { icon: 'download', title: 'My Downloads', subtitle: 'Digital products & license keys', href: 'downloads.html' },
        { icon: 'heart', title: 'Favorites & Wishlist', subtitle: 'Your saved products', href: 'wishlist.html', badge: wish },
        { icon: 'box', title: 'Returns & Refunds', subtitle: 'Request or track a return', href: 'returns.html' },
        f.addresses && { icon: 'map', title: 'Address Book', subtitle: 'Manage shipping addresses', href: 'addresses.html', badge: addr },
        f.paymentMethods && { icon: 'card', title: 'Payment Methods', subtitle: 'Manage cards & payment options', href: 'payment-methods.html' },
        f.promo && { icon: 'tag', title: 'My Coupons', subtitle: 'Available discount codes', href: 'coupons.html' },
        { icon: 'star', title: 'Rewards & Points', subtitle: 'Earn and redeem points', href: 'rewards.html' },
        { icon: 'gift', title: 'Gift Cards', subtitle: 'Buy or redeem a gift card', href: 'gift-cards.html' },
        { icon: 'clock', title: 'Recently Viewed', subtitle: 'Products you looked at', href: 'recently-viewed.html' },
        { icon: 'gift', title: 'Invite Friends', subtitle: 'Give $10, get $10', href: 'referral.html' },
      ])}

      ${section('Account Settings', [
        { icon: 'user', title: 'Personal Information', subtitle: 'Update your name, email & phone', href: 'personal-info.html' },
        { icon: 'gear', title: 'Settings', subtitle: 'Appearance, currency & preferences', href: 'settings.html' },
        f.languageSwitcher && { icon: 'globe', title: t('profile.language'), subtitle: 'Choose your language', href: 'language.html' },
      ])}

      ${section('Preferences', [
        f.notifications && { icon: 'bell', title: 'Notifications', subtitle: 'Order updates & marketing', toggle: true },
        { icon: 'info', title: 'Privacy & Security', subtitle: 'Control your data & security', href: 'help.html' },
      ])}

      ${section('Support', [
        { icon: 'help', title: 'Help Center', subtitle: 'Get help and support', href: 'help.html' },
        { icon: 'send', title: 'Support Tickets', subtitle: 'Message our team', href: 'support.html' },
        { icon: 'info', title: 'Legal', subtitle: 'Terms, privacy & policies', href: 'legal.html' },
        { icon: 'info', title: t('profile.about'), subtitle: `About ${esc(config.brand.name)}`, href: 'about.html' },
        f.admin && { icon: 'box', title: 'Admin Panel', subtitle: 'Manage your store', href: 'admin/index.html' },
      ])}

      <div class="logout-section">
        <button class="logout-btn" id="logoutBtn">${icon('logout', { size: 22 })} Sign Out</button>
      </div>
    </div>
  </div>`;

  document.getElementById('tabbar').innerHTML = tabBar('profile');
  wire();
}

function wire() {
  document.getElementById('avatarBtn').addEventListener('click', openAvatarChooser);
  document.getElementById('avatarFile').addEventListener('change', (e) => { handleAvatarFile(e.target.files?.[0]); e.target.value = ''; });
  screen.querySelector('[data-pref="notifications"]')?.addEventListener('change', (e) => {
    prefs.notifications = e.target.checked;
    localStorage.setItem(`${NS}:prefs`, JSON.stringify(prefs));
    toast(`Notifications ${e.target.checked ? 'on' : 'off'}`);
  });
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (await confirm('Sign out of your account?')) {
      haptic('medium');
      if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
      else toast('Signed out (demo)');
    }
  });
}

/* Choose how to set the profile photo: upload a real image, pick an emoji, or remove. */
function openAvatarChooser() {
  const node = document.createElement('div');
  node.innerHTML = `<div class="stack gap-3">
    <button class="btn btn--block" id="chUpload">${icon('upload', { size: 18 })} Upload photo</button>
    <button class="btn btn--outline btn--block" id="chEmoji">${icon('image', { size: 18 })} Choose an emoji</button>
    ${avatar ? '<button class="btn btn--outline btn--block" id="chRemove" style="color:var(--danger);border-color:var(--danger)">Remove photo</button>' : ''}
    <p class="muted text-sm" style="text-align:center">JPG or PNG, up to 2&nbsp;MB.</p>
  </div>`;
  const sheet = bottomSheet({ title: 'Profile photo', content: node });
  node.querySelector('#chUpload').addEventListener('click', () => { sheet.close(); document.getElementById('avatarFile').click(); });
  node.querySelector('#chEmoji').addEventListener('click', () => { sheet.close(); pickAvatarEmoji(); });
  node.querySelector('#chRemove')?.addEventListener('click', () => { avatar = null; saveAvatar(); sheet.close(); haptic('medium'); toast('Photo removed'); render(); });
}

function handleAvatarFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Please choose an image file', { kind: 'danger' }); return; }
  if (file.size > MAX_AVATAR) { toast('Image must be under 2 MB', { kind: 'danger' }); return; }
  const reader = new FileReader();
  reader.onload = () => { avatar = { type: 'image', value: reader.result }; saveAvatar(); haptic('success'); toast('Photo updated', { kind: 'success' }); render(); };
  reader.readAsDataURL(file);
}

function pickAvatarEmoji() {
  const grid = `<div class="emoji-picker">${EMOJIS.map((e) => `<button data-e="${e}">${e}</button>`).join('')}</div>`;
  const sheet = bottomSheet({ title: 'Choose an emoji', content: grid });
  sheet.el.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => {
    avatar = { type: 'emoji', value: b.dataset.e }; saveAvatar(); haptic('success'); sheet.close(); toast('Avatar updated', { kind: 'success' }); render();
  }));
}

render();
