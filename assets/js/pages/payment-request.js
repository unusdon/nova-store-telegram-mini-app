/**
 * Nova Kit — Payment Request
 * Enter an amount + note, then generate a shareable payment link and QR code for someone
 * to pay you. Demo generates a link string; wire to your payment provider in production.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, qr, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const bottombar = document.getElementById('bottombar');
const sym = config.currency.symbol;
let amount = '';
let note = '';

function entryView() {
  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Request Payment', back: 'wallet.html' });
  bindThemeToggle();
  screen.innerHTML = `
    <div class="amount-entry">
      <div class="amount-entry__label">Amount to request</div>
      <div class="amount-input"><span class="amount-input__sym">${sym}</span>
        <input id="amt" inputmode="decimal" placeholder="0" value="${esc(amount)}"></div>
    </div>
    <div class="container">
      <div class="field"><label class="field__label">Note (optional)</label>
        <input class="input" id="note" value="${esc(note)}" placeholder="What's it for?"></div>
      <div class="quick-amounts">${[10, 25, 50, 100].map((a) => `<button class="chip" data-amt="${a}">${formatPrice(a)}</button>`).join('')}</div>
    </div>`;
  bottombar.innerHTML = `<div class="bottom-bar"><button class="btn btn--block" id="genBtn">Generate request</button></div>`;

  const amtEl = document.getElementById('amt');
  amtEl.addEventListener('input', () => { amount = amtEl.value; });
  document.getElementById('note').addEventListener('input', (e) => { note = e.target.value; });
  screen.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => { amount = b.dataset.amt; amtEl.value = amount; haptic('selection'); }));
  document.getElementById('genBtn').addEventListener('click', () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast('Enter an amount', { kind: 'danger' }); haptic('error'); return; }
    haptic('success'); resultView(val);
  });
}

function resultView(val) {
  const ref = 'PR' + String(1000 + Math.floor(val)).slice(0, 6);
  const link = `https://pay.novastore.app/r/${ref}`;
  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Payment Request', back: 'wallet.html' });
  bindThemeToggle();
  screen.innerHTML = `
    <div class="qr-card">
      <img src="${qr(link)}" alt="Payment QR code">
      <div class="qr-amount">${formatPrice(val)}</div>
      ${note ? `<div class="muted text-sm">${esc(note)}</div>` : ''}
      <div class="muted text-sm" style="margin-top:8px">Scan to pay, or share the link below.</div>
    </div>
    <div class="pay-link"><span>${esc(link)}</span>
      <button class="text-accent semibold text-sm" id="copyLink">Copy</button></div>`;
  bottombar.innerHTML = `<div class="bottom-bar">
    <button class="btn btn--outline" id="againBtn">New</button>
    <button class="btn grow" id="shareBtn">${icon('send', { size: 18 })} Share request</button></div>`;

  document.getElementById('copyLink').addEventListener('click', async () => { try { await navigator.clipboard.writeText(link); } catch {} toast('Link copied', { kind: 'success' }); });
  document.getElementById('againBtn').addEventListener('click', () => { amount = ''; note = ''; entryView(); });
  document.getElementById('shareBtn').addEventListener('click', () => {
    const text = `Please pay me ${formatPrice(val)} on ${config.brand.name}: ${link}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else { navigator.clipboard?.writeText(text); toast('Request copied to share', { kind: 'success' }); }
  });
}

entryView();
