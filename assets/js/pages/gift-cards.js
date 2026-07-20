/**
 * Nova Kit — Gift Cards (buy & redeem)
 * Buy a gift card (amount, design, recipient) → get a shareable code + QR; or redeem a code
 * into your wallet. Issued cards persist under `nova:giftcards` (shared with the admin page).
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, qr, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';
import { addTransaction } from '../data/transactions.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:giftcards`;
const screen = document.getElementById('screen');
const bottombar = document.getElementById('bottombar');
const DESIGNS = [
  ['linear-gradient(135deg,#00C853,#009e42)', '#00C853'],
  ['linear-gradient(135deg,#5B6CFF,#3B4BE0)', '#5B6CFF'],
  ['linear-gradient(135deg,#F0416C,#c62f3c)', '#F0416C'],
  ['linear-gradient(135deg,#F59E0B,#d97706)', '#F59E0B'],
];
const AMOUNTS = [25, 50, 100, 200];
const cards = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const save = (c) => localStorage.setItem(KEY, JSON.stringify(c));

let tab = 'buy';
let amount = 50;
let design = 0;

function preview() {
  return `<div class="giftcard" style="background:${DESIGNS[design][0]}">
    <div class="giftcard__brand">${config.brand.logoEmoji} ${esc(config.brand.name)} Gift Card</div>
    <div><div class="giftcard__amount">${formatPrice(amount)}</div></div>
    <div class="giftcard__foot"><span>Digital gift card</span><span>🎁</span></div>
  </div>`;
}

function buyView() {
  screen.innerHTML = `<div class="feat-content">
    <div class="seg-tabs" id="tabs"><button class="active" data-t="buy">Buy</button><button data-t="redeem">Redeem</button></div>
    ${preview()}
    <div class="gc-designs">${DESIGNS.map((d, i) => `<span class="gc-design${i === design ? ' on' : ''}" data-d="${i}" style="background:${d[0]}"></span>`).join('')}</div>
    <div class="field"><label class="field__label">Amount</label>
      <div class="chip-row" style="padding-inline:0">${AMOUNTS.map((a) => `<button class="chip${a === amount ? ' is-active' : ''}" data-amt="${a}">${formatPrice(a)}</button>`).join('')}</div></div>
    <div class="field"><label class="field__label">Recipient (optional)</label><input class="input" id="gc_to" placeholder="@username or email"></div>
    <div class="field"><label class="field__label">Message (optional)</label><input class="input" id="gc_msg" placeholder="Happy birthday!"></div>`;
  bottombar.innerHTML = `<div class="bottom-bar"><button class="btn btn--block" id="buyBtn">Buy gift card · ${formatPrice(amount)}</button></div>`;
  wireBuy();
}

function wireBuy() {
  document.getElementById('tabs').querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.t; render(); }));
  screen.querySelectorAll('[data-d]').forEach((s) => s.addEventListener('click', () => { design = +s.dataset.d; buyView(); }));
  screen.querySelectorAll('[data-amt]').forEach((b) => b.addEventListener('click', () => { amount = +b.dataset.amt; buyView(); }));
  document.getElementById('buyBtn').addEventListener('click', () => {
    const code = 'GIFT-' + Math.abs([...String(amount) + Date.now()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36).toUpperCase().slice(0, 8).replace(/(.{4})/, '$1-');
    const list = cards();
    list.unshift({ code, amount, status: 'active', design: DESIGNS[design][1], to: (document.getElementById('gc_to').value || '').trim(), msg: (document.getElementById('gc_msg').value || '').trim(), date: new Date().toISOString() });
    save(list); haptic('success'); resultView(code, amount);
  });
}

function resultView(code, amt) {
  const link = `https://gift.novastore.app/${code}`;
  screen.innerHTML = `<div class="feat-content" style="text-align:center;padding-top:24px">
    ${preview()}
    <div class="qr-card" style="margin:16px 0"><img src="${qr(code)}" alt="Gift QR" style="width:160px;height:160px;background:#fff;border-radius:12px;padding:8px"></div>
    <div class="pay-link" style="margin:0 0 16px"><span>${esc(code)}</span><button class="text-accent semibold text-sm" id="copy">Copy</button></div>
    <p class="muted text-sm">Send this code or QR to the lucky recipient.</p>`;
  bottombar.innerHTML = `<div class="bottom-bar"><button class="btn btn--outline" id="again">New</button>
    <button class="btn grow" id="share">${icon('send', { size: 18 })} Share</button></div>`;
  document.getElementById('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(code); } catch {} toast('Code copied', { kind: 'success' }); });
  document.getElementById('again').addEventListener('click', buyView);
  document.getElementById('share').addEventListener('click', () => {
    const text = `You got a ${formatPrice(amt)} ${config.brand.name} gift card! Redeem code: ${code} — ${link}`;
    if (navigator.share) navigator.share({ text }).catch(() => {}); else { navigator.clipboard?.writeText(text); toast('Copied to share', { kind: 'success' }); }
  });
}

function redeemView() {
  bottombar.innerHTML = '';
  screen.innerHTML = `<div class="feat-content">
    <div class="seg-tabs" id="tabs"><button data-t="buy">Buy</button><button class="active" data-t="redeem">Redeem</button></div>
    <div style="text-align:center;padding:24px 0"><div style="font-size:48px">🎁</div>
      <h2 style="font-size:var(--fs-xl);font-weight:var(--fw-bold);margin-top:8px">Redeem a gift card</h2>
      <p class="muted">Add its balance straight to your wallet.</p></div>
    <div class="field"><label class="field__label">Gift card code</label><input class="input" id="code" placeholder="GIFT-XXXX-XXXX" autocomplete="off"></div>
    <button class="btn btn--block" id="redeemBtn">Redeem to wallet</button>`;
  document.getElementById('tabs').querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.t; render(); }));
  document.getElementById('redeemBtn').addEventListener('click', () => {
    const code = document.getElementById('code').value.trim().toUpperCase();
    const list = cards();
    const card = list.find((c) => c.code === code && c.status === 'active');
    if (!code) { toast('Enter a code', { kind: 'danger' }); return; }
    if (!card) { toast('Invalid or already redeemed code', { kind: 'danger' }); haptic('error'); return; }
    card.status = 'redeemed'; save(list);
    addTransaction({ type: 'receive', title: `Gift card ${card.code}`, amount: card.amount, method: 'Gift card' });
    haptic('success'); toast(`${formatPrice(card.amount)} added to your wallet`, { kind: 'success' });
    setTimeout(() => { location.href = 'wallet.html'; }, 800);
  });
}

function render() {
  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Gift Cards', back: 'profile.html' });
  bindThemeToggle();
  if (tab === 'buy') buyView(); else redeemView();
}

render();
