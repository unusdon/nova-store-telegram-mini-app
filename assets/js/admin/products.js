/**
 * Nova Kit — Admin products list
 * Search the catalogue, see stock/price/status, tap to edit, or add a new product.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, placeholder, toast, bottomSheet } from '../core/ui.js';
import { dataService } from '../core/store.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const COLUMNS = ['id', 'name', 'type', 'categoryId', 'price', 'stock', 'inStock'];
const SORTS = [
  ['name', 'Name'],
  ['price-desc', 'Price ↓'],
  ['price-asc', 'Price ↑'],
  ['stock', 'Stock'],
];
let all = [];
let query = '';
let sort = 'name';

/** Current search + sort applied to the catalogue. */
function visible() {
  return all
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'stock') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
}

function row(p) {
  const stockClass = !p.inStock ? 'cancelled' : p.stock <= 15 ? 'pending' : 'delivered';
  const stockLabel = !p.inStock ? 'Out' : `${p.stock} in stock`;
  return `<a class="data-row" href="product-edit.html?id=${encodeURIComponent(p.id)}">
    <img class="data-row__avatar" src="${placeholder(p.emoji, p.color, 80, 80)}" alt="" width="40" height="40">
    <span class="data-row__main">
      <span class="data-row__title">${esc(p.name)}</span>
      <span class="data-row__sub">${p.type} · ${esc(p.categoryId)}</span>
    </span>
    <span class="data-row__end">
      <span class="semibold">${formatPrice(p.price)}</span>
      <span class="status status--${stockClass}">${stockLabel}</span>
    </span>
  </a>`;
}

function render() {
  const list = visible();
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Products', back: 'index.html', menu: false,
    actions: `<a class="appbar__btn" href="product-edit.html" aria-label="Add product">${icon('plus', { size: 22 })}</a>`,
  });
  screen.innerHTML = `
    <div class="searchbar">
      <div class="searchbar__field">${icon('search', { size: 20 })}
        <input id="q" placeholder="Search products" value="${esc(query)}" autocomplete="off"></div>
    </div>
    <div class="tabs-pill" style="padding-top:0">
      <button class="chip" id="exportBtn">${icon('download', { size: 16 })} Export CSV</button>
      <button class="chip" id="importBtn">${icon('upload', { size: 16 })} Import CSV</button>
      ${SORTS.map(([key, label]) => `<button class="chip${key === sort ? ' is-active' : ''}" data-sort="${key}">${label}</button>`).join('')}
    </div>
    <div class="admin-section-title">${list.length} products</div>
    <div class="list" style="margin-top:0">${list.map(row).join('') || '<div class="empty-state"><h3>No matches</h3></div>'}</div>
  `;
  document.getElementById('tabbar').innerHTML = adminTabBar('products');
  bindAdminChrome();

  const q = document.getElementById('q');
  q.addEventListener('input', () => { query = q.value; const list2 = visible();
    document.querySelector('.list').innerHTML = list2.map(row).join('') || '<div class="empty-state"><h3>No matches</h3></div>';
    document.querySelector('.admin-section-title').textContent = `${list2.length} products`; });
  screen.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
    sort = b.dataset.sort; haptic('selection'); render();
  }));
  document.getElementById('exportBtn').addEventListener('click', exportCsv);
  document.getElementById('importBtn').addEventListener('click', importCsv);
}

/* ---- CSV import / export ------------------------------------------------- */
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv() {
  const rows = [COLUMNS.join(',')].concat(all.map((p) => COLUMNS.map((c) => csvCell(p[c])).join(',')));
  const blob = new Blob([rows.join('\r\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'products.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  haptic('success'); toast(`Exported ${all.length} products`, { kind: 'success' });
}

/* Minimal CSV row parser (handles quoted fields + escaped quotes). */
function parseRow(line) {
  const out = []; let cur = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function ingest(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) { toast('No rows found in file', { kind: 'danger' }); return; }
  const header = parseRow(lines[0]).map((h) => h.trim());
  let added = 0; let updated = 0;
  for (const line of lines.slice(1)) {
    const cells = parseRow(line);
    const rec = {}; header.forEach((h, i) => { rec[h] = (cells[i] ?? '').trim(); });
    if (!rec.name && !rec.id) continue;
    const norm = {
      id: rec.id || 'imp-' + (all.length + added + 1),
      name: rec.name || 'Untitled',
      type: rec.type === 'digital' ? 'digital' : 'physical',
      categoryId: rec.categoryId || 'other',
      price: parseFloat(rec.price) || 0,
      stock: parseInt(rec.stock, 10) || 0,
      inStock: /^(true|1|yes)$/i.test(rec.inStock || '') || (parseInt(rec.stock, 10) || 0) > 0,
      emoji: '📦', color: '#00C853',
    };
    const existing = all.find((p) => p.id === norm.id);
    if (existing) { Object.assign(existing, norm); updated++; } else { all.unshift(norm); added++; }
  }
  haptic('success');
  toast(`Imported: ${added} added, ${updated} updated`, { kind: 'success' });
  render();
}

function importCsv() {
  const node = document.createElement('div');
  node.innerHTML = `<div class="stack gap-3">
    <p class="muted text-sm">Upload a CSV with columns: <strong>${COLUMNS.join(', ')}</strong>. Rows matching an existing id are updated; others are added.</p>
    <input type="file" id="csvFile" accept=".csv,text/csv" hidden>
    <button class="btn btn--block" id="csvPick">${icon('upload', { size: 18 })} Choose CSV file</button>
    <button class="btn btn--outline btn--block" id="csvTemplate">${icon('download', { size: 18 })} Download template</button>
  </div>`;
  const sheet = bottomSheet({ title: 'Import products', content: node });
  const file = node.querySelector('#csvFile');
  node.querySelector('#csvPick').addEventListener('click', () => file.click());
  file.addEventListener('change', (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { sheet.close(); ingest(String(reader.result)); };
    reader.readAsText(f);
  });
  node.querySelector('#csvTemplate').addEventListener('click', () => {
    const sample = [COLUMNS.join(','), 'p-new-1,Sample Product,physical,electronics,49.99,25,true'].join('\r\n');
    const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'products-template.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
}

(async function init() {
  all = await dataService.getProducts();
  render();
})();
