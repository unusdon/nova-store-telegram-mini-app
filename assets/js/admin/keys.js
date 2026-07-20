/**
 * Nova Kit — Admin digital delivery / license keys
 * Per digital product: available/sold counts, add keys in bulk, and view the key pool.
 * Demo stock lives in memory (seeded from admin-data) + any keys you add this session.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { demoKeys } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const stock = JSON.parse(JSON.stringify(demoKeys)); // working copy

function productCard(id, p) {
  const low = p.available > 0 && p.available <= 10;
  return `<div class="card card--pad" style="margin-bottom:12px">
    <div class="row-between">
      <div><div class="semibold">${esc(p.name)}</div>
        <div class="muted text-sm">${p.sold} delivered</div></div>
      <span class="status status--${p.available === 0 ? 'cancelled' : low ? 'pending' : 'delivered'}">
        ${p.available === 0 ? 'Out of keys' : p.available + ' available'}</span>
    </div>
    <div class="row gap-2" style="margin-top:12px">
      <button class="btn btn--sm" data-add="${id}">${icon('plus', { size: 16 })} Add keys</button>
      ${p.keys.length ? `<button class="btn btn--sm btn--outline" data-view="${id}">View ${p.keys.length}</button>` : ''}
    </div>
  </div>`;
}

function render() {
  const total = Object.values(stock).reduce((s, p) => s + p.available, 0);
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Digital Keys', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('key', { size: 18 })}</span>Keys available</span><span class="kpi__value">${total}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('download', { size: 18 })}</span>Delivered</span><span class="kpi__value">${Object.values(stock).reduce((s, p) => s + p.sold, 0)}</span></div>
    </div>
    <div class="admin-section-title">Digital products</div>
    <div class="container" style="padding-top:0">${Object.entries(stock).map(([id, p]) => productCard(id, p)).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('products');
  bindAdminChrome();

  screen.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => addKeys(b.dataset.add)));
  screen.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => viewKeys(b.dataset.view)));
}

/** Append keys read from a .txt file into the textarea so the admin can review before saving. */
function loadKeyFiles(fileList, textarea) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    const isText = file.type === 'text/plain' || /\.txt$/i.test(file.name);
    if (!isText) { toast('Only .txt files are supported', { kind: 'danger' }); continue; }
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) { toast(`${file.name} has no keys`, { kind: 'danger' }); return; }
      const current = textarea.value.trim();
      textarea.value = (current ? `${current}\n` : '') + lines.join('\n');
      haptic('success');
      toast(`${lines.length} key(s) loaded from file`, { kind: 'success' });
    };
    reader.readAsText(file);
  }
}

function addKeys(id) {
  const p = stock[id];
  const form = `<p class="muted text-sm" style="margin-bottom:12px">Paste one key per line, or upload a .txt file.</p>
    <div class="field"><textarea class="textarea" id="keys" style="min-height:140px;font-family:ui-monospace,monospace" placeholder="XXXX-XXXX-XXXX
YYYY-YYYY-YYYY"></textarea></div>
    <div class="row gap-2" style="margin-bottom:12px">
      <button type="button" class="btn btn--sm btn--outline" id="k_upload">${icon('upload', { size: 16 })} Upload .txt</button>
    </div>
    <input type="file" id="k_file" accept=".txt,text/plain" multiple hidden>
    <button class="btn btn--block" id="k_save">Add keys</button>`;
  const sheet = bottomSheet({ title: 'Add keys', content: form });
  const textarea = sheet.el.querySelector('#keys');
  sheet.el.querySelector('#k_upload').addEventListener('click', () => sheet.el.querySelector('#k_file').click());
  sheet.el.querySelector('#k_file').addEventListener('change', (e) => { loadKeyFiles(e.target.files, textarea); e.target.value = ''; });
  sheet.el.querySelector('#k_save').addEventListener('click', () => {
    const lines = sheet.el.querySelector('#keys').value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast('Paste at least one key', { kind: 'danger' }); return; }
    p.keys.push(...lines); p.available += lines.length;
    haptic('success'); sheet.close(); toast(`${lines.length} key(s) added`, { kind: 'success' }); render();
  });
}

function viewKeys(id) {
  const p = stock[id];
  const body = p.keys.length
    ? `<div class="stack gap-2">${p.keys.map((k) => `<div class="dl-key" style="border-color:var(--border)"><span>${esc(k)}</span>
        <button class="text-accent semibold text-sm" data-copy="${esc(k)}">Copy</button></div>`).join('')}</div>`
    : '<p class="muted">No keys in the pool.</p>';
  const sheet = bottomSheet({ title: `${p.name} · keys`, content: body });
  sheet.el.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch {} toast('Key copied', { kind: 'success' });
  }));
}

render();
