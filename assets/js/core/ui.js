/**
 * Nova Kit — UI helpers
 * =====================
 * Small, framework-free building blocks used across pages: DOM helper, resale-safe SVG
 * image placeholders (no external/hotlinked images), toasts, and bottom sheets.
 */
import { haptic } from './telegram.js';
import { icon } from './icons.js';

/** Tiny query helpers. */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape user/content strings before inserting as HTML. */
export function esc(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Generate an original SVG image placeholder as a data URI. Every product/category image in
 * the kit is produced this way, so the package ships zero third-party or hotlinked images.
 */
export function placeholder(emoji = '📦', color = '#5B6CFF', w = 600, h = 600) {
  const c2 = shade(color, -18);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${c2}"/>` +
    `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<text x="50%" y="50%" font-size="${Math.round(h * 0.42)}" text-anchor="middle" ` +
    `dominant-baseline="central">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function shade(hex, pct) {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + Math.round(255 * (pct / 100)));
  const g = clamp(((n >> 8) & 0xff) + Math.round(255 * (pct / 100)));
  const b = clamp((n & 0xff) + Math.round(255 * (pct / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Generate a decorative QR-style SVG (data URI) from any string. This is a visual
 * placeholder (deterministic pattern + finder squares) — swap in a real QR library if you
 * need scannable codes. Ships no dependencies and no external requests.
 */
export function qr(text, modules = 25) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const finder = (x, y, bx, by) => {
    const rx = x - bx, ry = y - by;
    if (rx < 0 || ry < 0 || rx > 6 || ry > 6) return null;
    return (rx === 0 || ry === 0 || rx === 6 || ry === 6 || (rx >= 2 && rx <= 4 && ry >= 2 && ry <= 4)) ? 1 : 0;
  };
  const m = 6; let rects = '';
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      let on = finder(x, y, 0, 0);
      if (on === null) on = finder(x, y, modules - 7, 0);
      if (on === null) on = finder(x, y, 0, modules - 7);
      if (on === null) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; on = (h >>> 17) & 1; }
      if (on) rects += `<rect x="${x * m}" y="${y * m}" width="${m}" height="${m}"/>`;
    }
  }
  const px = modules * m;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">` +
    `<rect width="${px}" height="${px}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Transient toast notification. */
export function toast(message, { kind = 'default', duration = 2600 } = {}) {
  let host = $('#nova-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'nova-toast-host';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 220);
  }, duration);
}

/**
 * Bottom sheet. `content` may be an HTML string or a DOM node.
 * Returns an object with a `close()` method.
 */
export function bottomSheet({ title = '', content = '', onClose } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet__grabber"></div>
      ${title ? `<div class="sheet__head"><h3>${esc(title)}</h3>
        <button class="sheet__close" aria-label="Close">${icon('close', { size: 20 })}</button></div>` : ''}
      <div class="sheet__body"></div>
    </div>`;
  const body = $('.sheet__body', overlay);
  if (typeof content === 'string') body.innerHTML = content;
  else body.appendChild(content);

  const close = () => {
    overlay.classList.remove('is-in');
    setTimeout(() => { overlay.remove(); onClose?.(); }, 240);
  };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  $('.sheet__close', overlay)?.addEventListener('click', close);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-in'));
  haptic('light');
  return { el: overlay, close };
}

export default { $, $$, esc, placeholder, toast, bottomSheet };
