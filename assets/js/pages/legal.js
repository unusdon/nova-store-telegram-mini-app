/**
 * Nova Kit — Legal (Terms, Privacy, Shipping & Returns)
 * One page with a segmented switcher. Content is placeholder copy — replace with your own.
 * Deep-link with ?doc=terms | privacy | shipping (checkout's terms links point here).
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { esc } from '../core/ui.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const brand = config.brand.name;
const DOCS = {
  terms: { label: 'Terms', title: 'Terms & Conditions', body: [
    ['1. Overview', `These terms govern your use of ${brand} and any purchase made through it. By placing an order you agree to them.`],
    ['2. Orders & Pricing', 'All prices are shown in your selected currency and include applicable taxes where required. We may correct pricing errors and cancel affected orders.'],
    ['3. Digital Products', 'Licence keys and downloadable files are delivered instantly and are non-refundable once revealed or downloaded, except where required by law.'],
    ['4. Liability', `${brand} is not liable for indirect or consequential losses arising from use of the store, to the extent permitted by law.`],
  ] },
  privacy: { label: 'Privacy', title: 'Privacy Policy', body: [
    ['1. Data we collect', 'We collect the details you provide at checkout (name, contact, address) and basic usage data to operate the store.'],
    ['2. How we use it', 'Your data is used to fulfil orders, provide support, and — with your consent — send marketing you can opt out of at any time.'],
    ['3. Sharing', 'We share data only with processors needed to deliver your order (payment, shipping) and never sell it.'],
    ['4. Your rights', 'You may request access, correction, or deletion of your data from the Personal Information screen or by contacting support.'],
  ] },
  shipping: { label: 'Shipping & Returns', title: 'Shipping & Returns', body: [
    ['1. Delivery times', 'Physical orders ship within 1–2 business days. Standard delivery takes 5–7 days; express 2–3 days; overnight the next business day.'],
    ['2. Returns', 'Unused physical items may be returned within 30 days of delivery. Start a request from Profile → Returns.'],
    ['3. Refunds', 'Approved refunds are issued to your original payment method within 5–10 business days.'],
    ['4. Digital items', 'Digital purchases are non-returnable once the key is revealed or the file downloaded.'],
  ] },
};

let active = new URLSearchParams(location.search).get('doc');
if (!DOCS[active]) active = 'terms';

function render() {
  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Legal', back: 'profile.html' });
  bindThemeToggle();
  const d = DOCS[active];
  screen.innerHTML = `<div class="extra-content">
    <div class="legal-tabs">
      ${Object.entries(DOCS).map(([k, v]) => `<button data-doc="${k}" class="${k === active ? 'active' : ''}">${v.label}</button>`).join('')}
    </div>
    <h1 style="font-size:var(--fs-xl);font-weight:var(--fw-bold);margin-bottom:6px">${esc(d.title)}</h1>
    <div class="legal-updated">Last updated: 11 July 2026</div>
    <div class="legal-body">
      ${d.body.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}
    </div>
  </div>`;
  screen.querySelectorAll('[data-doc]').forEach((b) => b.addEventListener('click', () => { active = b.dataset.doc; render(); }));
}

render();
