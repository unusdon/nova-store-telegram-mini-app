/**
 * Nova Kit — Help & Support (faithful replica of the original help page)
 * Quick actions, help categories, an FAQ accordion, and contact cards.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { alert } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const QUICK = [
  { icon: 'bag', title: 'Track Order', sub: 'Where is my order?', href: 'track-order.html' },
  { icon: 'box', title: 'Returns', sub: 'Start a return', href: '#return' },
  { icon: 'card', title: 'Payments', sub: 'Billing & refunds', href: '#pay' },
  { icon: 'send', title: 'Contact', sub: 'Message support', href: '#contact' },
];
const TOPICS = [
  { icon: '📦', tint: 'tint-green', title: 'Orders & Delivery', sub: 'Tracking, delays, changes' },
  { icon: '💳', tint: 'tint-purple', title: 'Payments & Refunds', sub: 'Methods, invoices, refunds' },
  { icon: '↩️', tint: 'tint-orange', title: 'Returns & Exchanges', sub: 'Policy and process' },
  { icon: '🔒', tint: 'tint-blue', title: 'Account & Security', sub: 'Login, privacy, data' },
];
const FAQS = [
  ['How do I track my order?', 'Open Profile → Orders, choose an order, and follow the live tracking timeline.'],
  ['What payment methods are supported?', 'Card, crypto, and cash on delivery — whichever your store enables in settings.'],
  ['How do refunds work?', 'Contact support with your order number; approved refunds return to your original payment method.'],
  ['Can I change my delivery address?', 'Yes — before an order ships, update it from Profile → Addresses.'],
  ['Are digital products delivered instantly?', 'Yes. Keys and downloads are available immediately after checkout.'],
];

document.getElementById('appbar').innerHTML = `<header class="help-header"><div class="header-top">
  <a class="back-button" href="profile.html" aria-label="Back">${icon('back', { size: 24 })}</a>
  <div class="header-center"><h1 class="page-title">${t('profile.help')}</h1>
    <span class="help-subtitle">We're here to help</span></div>
  <span style="width:40px"></span>
</div></header>`;
bindThemeToggle();

screen.innerHTML = `<div class="help-content">
  <div class="quick-actions-section"><h3 class="section-title">Quick actions</h3>
    <div class="quick-actions-grid">
      ${QUICK.map((q) => `<a class="quick-action-item" href="${q.href}">
        <span class="action-icon">${icon(q.icon, { size: 20 })}</span>
        <span><span class="action-title">${esc(q.title)}</span><br><span class="action-subtitle">${esc(q.sub)}</span></span>
      </a>`).join('')}
    </div>
  </div>

  <div class="help-categories-section"><h3 class="section-title">Browse topics</h3>
    <div class="categories-grid">
      ${TOPICS.map((c) => `<button class="help-category-item">
        <span class="category-icon ${c.tint}">${c.icon}</span>
        <span><span class="category-title">${esc(c.title)}</span><br><span class="category-subtitle">${esc(c.sub)}</span></span>
        <span class="faq-arrow">${icon('chevron', { size: 18 })}</span></button>`).join('')}
    </div>
  </div>

  <div class="faq-section"><h3 class="section-title">Frequently asked</h3>
    <div class="faq-list">
      ${FAQS.map(([q, a]) => `<div class="faq-item">
        <button class="faq-question">${icon('help', { size: 18 })} <span class="faq-text">${esc(q)}</span>
          <span class="faq-arrow">${icon('chevron', { size: 18 })}</span></button>
        <div class="faq-answer"><p>${esc(a)}</p></div></div>`).join('')}
    </div>
  </div>

  <div class="contact-info-section"><h3 class="section-title">Contact us</h3>
    <div class="contact-card">
      <button class="contact-item" id="chat"><span class="contact-icon">${icon('send', { size: 20 })}</span>
        <span><span class="contact-label">Live chat</span><br><span class="contact-value">Message our team</span></span></button>
      <div class="contact-item"><span class="contact-icon">✉️</span>
        <span><span class="contact-label">Email</span><br><span class="contact-value">support@novastore.app</span></span></div>
    </div>
  </div>
</div>`;

screen.querySelectorAll('.faq-question').forEach((btn) => btn.addEventListener('click', () => btn.closest('.faq-item').classList.toggle('open')));
screen.querySelectorAll('.help-category-item').forEach((b) => b.addEventListener('click', () => toast('Opening help articles…')));
document.getElementById('chat').addEventListener('click', () => {
  if (config.brand.supportUrl) window.open(config.brand.supportUrl, '_blank');
  else alert('Live chat opens your support channel in production. Set config.brand.supportUrl.');
});
