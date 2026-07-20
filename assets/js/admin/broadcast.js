/**
 * Nova Kit — Admin broadcast
 * Compose and send a push/message broadcast to a customer segment, with a live message
 * preview and a history of past broadcasts. Demo previews the send; wire `send()` to your
 * Telegram Bot API (sendMessage to each user) or notification service to deliver.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');

const SEGMENTS = [
  { id: 'all', label: 'All users', count: 2890 },
  { id: 'active', label: 'Active (30d)', count: 1740 },
  { id: 'buyers', label: 'With orders', count: 1234 },
  { id: 'wishlist', label: 'Has wishlist', count: 612 },
];
const draft = { segment: 'all', title: '', body: '', btnLabel: '', btnUrl: '' };
const history = [
  { title: 'Summer sale is live 🌞', segment: 'All users', reach: 2890, date: '2024-06-28', status: 'sent' },
  { title: 'Your cart misses you 🛒', segment: 'Has wishlist', reach: 590, date: '2024-06-20', status: 'sent' },
];

function audience() {
  return SEGMENTS.find((s) => s.id === draft.segment) || SEGMENTS[0];
}

function preview() {
  return `<div class="bc-preview">
    <div class="bc-preview__app">${config.brand.logoEmoji} ${esc(config.brand.name)}</div>
    <div class="bc-preview__title">${esc(draft.title || 'Message title')}</div>
    <div class="bc-preview__body">${esc(draft.body || 'Your message text will appear here.')}</div>
    ${draft.btnLabel ? `<div class="bc-preview__btn">${esc(draft.btnLabel)}</div>` : ''}
  </div>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Broadcast', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="container" style="padding-top:16px">
      <div class="field__label">Audience</div>
      <div class="chip-row" id="segs" style="padding-inline:0">
        ${SEGMENTS.map((s) => `<button class="chip${draft.segment === s.id ? ' is-active' : ''}" data-seg="${s.id}">${s.label} · ${s.count.toLocaleString()}</button>`).join('')}
      </div>

      <div class="field" style="margin-top:8px"><label class="field__label">Title</label>
        <input class="input" id="b_title" maxlength="80" value="${esc(draft.title)}" placeholder="e.g. Weekend flash sale"></div>
      <div class="field"><label class="field__label">Message</label>
        <textarea class="textarea" id="b_body" maxlength="1000" placeholder="Write your announcement…">${esc(draft.body)}</textarea></div>

      <div class="admin-section-title" style="padding-inline:0">Call-to-action (optional)</div>
      <div class="form-grid">
        <div class="field"><label class="field__label">Button label</label><input class="input" id="b_btn" value="${esc(draft.btnLabel)}" placeholder="Shop now"></div>
        <div class="field"><label class="field__label">Button link</label><input class="input" id="b_url" value="${esc(draft.btnUrl)}" placeholder="catalog.html"></div>
      </div>

      <div class="admin-section-title" style="padding-inline:0">Preview</div>
      <div id="previewHost">${preview()}</div>

      <div class="admin-section-title" style="padding-inline:0">Recent broadcasts</div>
      <div class="list" style="margin:0">
        ${history.map((h) => `<div class="data-row">
          <span class="data-row__avatar">${icon('send', { size: 18 })}</span>
          <span class="data-row__main"><span class="data-row__title">${esc(h.title)}</span>
            <span class="data-row__sub">${esc(h.segment)} · ${formatDate(h.date)}</span></span>
          <span class="data-row__end"><span class="semibold">${h.reach.toLocaleString()}</span>
            <span class="status status--delivered">${h.status}</span></span>
        </div>`).join('')}
      </div>
    </div>`;

  document.getElementById('bottombar').innerHTML =
    `<div class="bottom-bar"><button class="btn btn--block" id="sendBtn">${icon('send', { size: 18 })} Send to ${audience().count.toLocaleString()} users</button></div>`;

  wire();
  bindAdminChrome();
}

function wire() {
  screen.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => {
    draft.segment = b.dataset.seg;
    screen.querySelectorAll('[data-seg]').forEach((x) => x.classList.toggle('is-active', x === b));
    document.getElementById('sendBtn').innerHTML = `${icon('send', { size: 18 })} Send to ${audience().count.toLocaleString()} users`;
    haptic('selection');
  }));
  const sync = () => {
    draft.title = document.getElementById('b_title').value;
    draft.body = document.getElementById('b_body').value;
    draft.btnLabel = document.getElementById('b_btn').value;
    draft.btnUrl = document.getElementById('b_url').value;
    document.getElementById('previewHost').innerHTML = preview();
  };
  ['b_title', 'b_body', 'b_btn', 'b_url'].forEach((id) => document.getElementById(id)?.addEventListener('input', sync));
  document.getElementById('sendBtn').addEventListener('click', send);
}

async function send() {
  if (!draft.title.trim() || !draft.body.trim()) { toast('Add a title and message', { kind: 'danger' }); haptic('error'); return; }
  const seg = audience();
  if (!(await confirm(`Send this broadcast to ${seg.count.toLocaleString()} ${seg.label} users?`))) return;
  history.unshift({ title: draft.title, segment: seg.label, reach: seg.count, date: new Date().toISOString().slice(0, 10), status: 'sent' });
  draft.title = ''; draft.body = ''; draft.btnLabel = ''; draft.btnUrl = '';
  haptic('success'); toast('Broadcast sent (demo)', { kind: 'success' }); render();
}

render();
