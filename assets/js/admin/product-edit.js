/**
 * Nova Kit — Admin product editor (add / edit) with image CRUD
 * A complete product form: images (emoji + colour, add / remove / set-primary), title, type,
 * category, pricing, inventory, description, and digital-delivery fields. This demo validates
 * and previews the payload; wire `save()` to your API (and swap the emoji-image manager for a
 * real uploader) to persist.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, placeholder, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { dataService } from '../core/store.js';

adminBootstrap();

const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
let product = null;
let type = 'physical';
// Gallery entries are either an uploaded image { kind:'image', src } or a generated icon
// { kind:'emoji', emoji, color }. The first entry is the primary image.
let gallery = [];
// Digital deliverables: either an uploaded file { kind:'file', name, size, dataUrl } or an
// external { kind:'link', label, url }. Persisted onto `product.digital.assets`.
let assets = [];
const MAX_UPLOAD = 2 * 1024 * 1024; // 2 MB
const MAX_ASSET = 5 * 1024 * 1024;  // 5 MB per digital file
const MAX_ASSETS = 5;

function thumbSrc(g) {
  return g.kind === 'image' ? g.src : placeholder(g.emoji, g.color, 160, 160);
}

const EMOJIS = ['📦', '🎧', '⌚', '📱', '💻', '👕', '🧥', '👜', '👟', '🫖', '🎨', '🎮',
  '📘', '📚', '💾', '🔑', '☕', '🍿', '🥬', '💊', '🚗', '🏠', '🎁', '🔧', '🎸', '⚽', '💡', '🕶️'];
const COLORS = ['#00FF88', '#64D2FF', '#FF9500', '#FF4757', '#A855F7', '#EC4899', '#3AA0FF', '#FFD700'];

function field(label, id_, value = '', inputType = 'text', attrs = '') {
  return `<div class="field"><label class="field__label" for="${id_}">${label}</label>
    <input class="input" id="${id_}" type="${inputType}" value="${esc(value)}" ${attrs}></div>`;
}

function galleryHtml() {
  const thumbs = gallery.map((g, i) => `
    <div class="img-thumb ${i === 0 ? 'is-primary' : ''}" data-i="${i}">
      <img src="${thumbSrc(g)}" alt="">
      ${i === 0 ? '<span class="img-thumb__primary">PRIMARY</span>' : ''}
      <button class="img-thumb__remove" data-remove="${i}" aria-label="Remove">×</button>
    </div>`).join('');
  return `<div class="admin-section-title" style="padding-inline:0">Images</div>
    <p class="muted text-sm" style="margin-bottom:12px">Upload photos or pick an icon. Tap an image to make it the primary. Add up to 5.</p>
    <div class="img-gallery" id="gallery">
      ${thumbs}
      ${gallery.length < 5 ? `<button class="img-add" id="addImg" aria-label="Add image">${icon('plus', { size: 24 })}</button>` : ''}
    </div>
    <input type="file" id="fileInput" accept="image/*" multiple hidden>`;
}

/** Read selected files as data URLs and add them to the gallery. */
function handleFiles(fileList) {
  const files = Array.from(fileList || []);
  let added = 0;
  for (const file of files) {
    if (gallery.length >= 5) { toast('Maximum 5 images', { kind: 'danger' }); break; }
    if (!file.type.startsWith('image/')) { toast('Only image files are allowed', { kind: 'danger' }); continue; }
    if (file.size > MAX_UPLOAD) { toast(`${file.name} is over 2 MB`, { kind: 'danger' }); continue; }
    const reader = new FileReader();
    reader.onload = () => { gallery.push({ kind: 'image', src: reader.result, name: file.name }); renderGallery(); };
    reader.readAsDataURL(file);
    added++;
  }
  if (added) haptic('success');
}

function renderGallery() {
  const host = document.getElementById('galleryHost');
  if (host) host.innerHTML = galleryHtml();
  wireGallery();
}

function wireGallery() {
  document.getElementById('addImg')?.addEventListener('click', openAddChooser);
  document.getElementById('fileInput')?.addEventListener('change', (e) => { handleFiles(e.target.files); e.target.value = ''; });
  document.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const i = +b.dataset.remove;
    if (gallery.length <= 1) { toast('At least one image is required', { kind: 'danger' }); return; }
    gallery.splice(i, 1); haptic('light'); renderGallery();
  }));
  document.querySelectorAll('.img-thumb').forEach((el) => el.addEventListener('click', () => {
    const i = +el.dataset.i;
    if (i > 0) { const [g] = gallery.splice(i, 1); gallery.unshift(g); haptic('selection'); renderGallery(); }
  }));
}

/** First step of adding an image: upload a real photo, or generate an icon. */
function openAddChooser() {
  const node = document.createElement('div');
  node.innerHTML = `<div class="stack gap-3">
    <button class="btn btn--block" id="chUpload">${icon('upload', { size: 18 })} Upload photo</button>
    <button class="btn btn--outline btn--block" id="chIcon">${icon('image', { size: 18 })} Choose an icon</button>
    <p class="muted text-sm" style="text-align:center">JPG or PNG, up to 2&nbsp;MB each.</p>
  </div>`;
  const sheet = bottomSheet({ title: 'Add image', content: node });
  node.querySelector('#chUpload').addEventListener('click', () => { sheet.close(); document.getElementById('fileInput')?.click(); });
  node.querySelector('#chIcon').addEventListener('click', () => { sheet.close(); pickEmoji(); });
}

function pickEmoji() {
  let emoji = EMOJIS[0], color = COLORS[0];
  const node = document.createElement('div');
  node.innerHTML = `
    <div id="imgPreview" style="display:flex;justify-content:center;margin-bottom:16px">
      <img src="${placeholder(emoji, color, 160, 160)}" width="72" height="72" style="border-radius:12px" alt=""></div>
    <div class="field__label">Icon</div>
    <div class="emoji-picker" id="ep">${EMOJIS.map((e) => `<button data-e="${e}" class="${e === emoji ? 'on' : ''}">${e}</button>`).join('')}</div>
    <div class="field__label">Background</div>
    <div class="swatches" id="sw">${COLORS.map((c) => `<span class="swatch ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div>
    <button class="btn btn--block" id="addThis">Add image</button>`;
  const sheet = bottomSheet({ title: 'Add image', content: node });
  const preview = () => { node.querySelector('#imgPreview img').src = placeholder(emoji, color, 160, 160); };
  node.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => {
    emoji = b.dataset.e; node.querySelectorAll('[data-e]').forEach((x) => x.classList.toggle('on', x === b)); preview();
  }));
  node.querySelectorAll('[data-c]').forEach((s) => s.addEventListener('click', () => {
    color = s.dataset.c; node.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === s)); preview();
  }));
  node.querySelector('#addThis').addEventListener('click', () => {
    gallery.push({ kind: 'emoji', emoji, color }); haptic('success'); sheet.close(); toast('Icon added'); renderGallery();
  });
}

/* ---- Digital delivery: files & links ---------------------------------------------------- */

function formatSize(bytes = 0) {
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function assetsHtml() {
  const rows = assets.map((a, i) => {
    const isFile = a.kind === 'file';
    const name = isFile ? (a.name || 'File') : (a.label || 'Link');
    const meta = isFile ? formatSize(a.size) : (a.url || '');
    return `<div class="asset-row">
      <span class="asset-row__icon">${icon(isFile ? 'box' : 'globe', { size: 18 })}</span>
      <div class="asset-row__info">
        <div class="asset-row__name">${esc(name)}</div>
        <div class="asset-row__meta">${esc(meta)}</div>
      </div>
      <button type="button" class="asset-row__remove" data-asset-remove="${i}" aria-label="Remove">×</button>
    </div>`;
  }).join('');
  return `<div class="field__label">Files &amp; links</div>
    ${assets.length
      ? `<div class="asset-list">${rows}</div>`
      : '<div class="asset-empty">No files or links yet. Buyers will only get the licence key.</div>'}
    <div class="row gap-2">
      <button type="button" class="btn btn--sm btn--outline" id="assetUpload">${icon('upload', { size: 16 })} Upload file</button>
      <button type="button" class="btn btn--sm btn--outline" id="assetLink">${icon('plug', { size: 16 })} Add link</button>
    </div>
    <p class="muted text-sm" style="margin-top:8px">Files are stored in the browser for the demo. In production, upload to your own storage and store the URL.</p>
    <input type="file" id="assetFileInput" multiple hidden>`;
}

function renderAssets() {
  const host = document.getElementById('assetsHost');
  if (host) host.innerHTML = assetsHtml();
  wireAssets();
}

function wireAssets() {
  document.getElementById('assetUpload')?.addEventListener('click', () => document.getElementById('assetFileInput')?.click());
  document.getElementById('assetLink')?.addEventListener('click', openAddLink);
  document.getElementById('assetFileInput')?.addEventListener('change', (e) => { handleAssetFiles(e.target.files); e.target.value = ''; });
  document.querySelectorAll('[data-asset-remove]').forEach((b) => b.addEventListener('click', () => {
    assets.splice(+b.dataset.assetRemove, 1); haptic('light'); renderAssets();
  }));
}

/** Read selected deliverables as data URLs (demo storage) and attach them. */
function handleAssetFiles(fileList) {
  const files = Array.from(fileList || []);
  let queued = 0;
  for (const file of files) {
    if (assets.length + queued >= MAX_ASSETS) { toast('Maximum 5 files or links', { kind: 'danger' }); break; }
    if (file.size > MAX_ASSET) { toast(`${file.name} is over 5 MB`, { kind: 'danger' }); continue; }
    const reader = new FileReader();
    reader.onload = () => {
      assets.push({ kind: 'file', name: file.name, size: file.size, dataUrl: reader.result });
      haptic('success');
      toast('File attached', { kind: 'success' });
      renderAssets();
    };
    reader.readAsDataURL(file);
    queued++;
  }
}

function openAddLink() {
  if (assets.length >= MAX_ASSETS) { toast('Maximum 5 files or links', { kind: 'danger' }); return; }
  const node = document.createElement('div');
  node.innerHTML = `
    ${field('Label', 'a_label', '', 'text', 'placeholder="Download installer"')}
    ${field('URL', 'a_url', '', 'url', 'placeholder="https://example.com/file.zip"')}
    <button class="btn btn--block" id="a_save">Add link</button>`;
  const sheet = bottomSheet({ title: 'Add link', content: node });
  node.querySelector('#a_save').addEventListener('click', () => {
    const label = node.querySelector('#a_label').value.trim();
    const url = node.querySelector('#a_url').value.trim();
    if (!label || !url) { toast('Add a label and a URL', { kind: 'danger' }); haptic('error'); return; }
    assets.push({ kind: 'link', label, url });
    haptic('success'); sheet.close(); toast('Link added', { kind: 'success' }); renderAssets();
  });
}

async function render() {
  product = id ? await dataService.getProduct(id) : null;
  const p = product || { type: 'physical' };
  type = p.type || 'physical';
  gallery = product?.gallery?.length ? product.gallery.map((g) => ({ ...g }))
    : [{ kind: 'emoji', emoji: p.emoji || '📦', color: p.color || '#00FF88' }];
  assets = (p.digital?.assets || []).map((a) => ({ ...a }));
  const isEdit = Boolean(product);
  const categories = await dataService.getCategories();

  document.getElementById('appbar').innerHTML = adminHeader({
    title: isEdit ? 'Edit product' : 'New product', back: 'products.html', menu: false,
  });

  screen.innerHTML = `
    <div class="container" style="padding-top:16px">
      <div id="galleryHost">${galleryHtml()}</div>

      ${field('Product name', 'f_name', p.name || '')}
      <div class="field"><label class="field__label">Type</label>
        <div class="segmented" id="typeSeg">
          <button type="button" data-type="physical" class="${type !== 'digital' ? 'is-active' : ''}">Physical</button>
          <button type="button" data-type="digital" class="${type === 'digital' ? 'is-active' : ''}">Digital</button>
        </div></div>
      <div class="field"><label class="field__label" for="f_cat">Category</label>
        <select class="select" id="f_cat">
          ${categories.map((c) => `<option value="${c.id}" ${p.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select></div>

      <div class="form-grid">
        ${field('Price', 'f_price', p.price ?? '', 'number', 'min="0" step="0.01"')}
        ${field('Compare-at', 'f_compare', p.compareAtPrice ?? '', 'number', 'min="0" step="0.01"')}
      </div>
      ${field('Stock', 'f_stock', p.stock ?? '', 'number', 'min="0" step="1"')}

      <div class="field"><label class="field__label" for="f_desc">Description</label>
        <textarea class="textarea" id="f_desc">${esc(p.description || '')}</textarea></div>

      <div id="digitalFields" class="${type === 'digital' ? '' : 'hidden'}">
        <div class="admin-section-title" style="padding-inline:0">Digital delivery</div>
        ${field('Platform', 'f_platform', p.digital?.platform || '')}
        ${field('Format', 'f_format', p.digital?.format || '')}
        ${field('License', 'f_license', p.digital?.license || '')}
        <div id="assetsHost">${assetsHtml()}</div>
      </div>
    </div>`;

  document.getElementById('bottombar').innerHTML = `<div class="bottom-bar">
    ${isEdit ? `<button class="btn btn--outline" id="delBtn">${icon('trash', { size: 18 })}</button>` : ''}
    <button class="btn grow" id="saveBtn">${isEdit ? 'Save changes' : 'Create product'}</button>
  </div>`;

  wireGallery();
  wireAssets();
  screen.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
    screen.querySelectorAll('[data-type]').forEach((x) => x.classList.remove('is-active'));
    b.classList.add('is-active'); type = b.dataset.type;
    document.getElementById('digitalFields').classList.toggle('hidden', type !== 'digital');
  }));
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('delBtn')?.addEventListener('click', async () => {
    const { confirm } = await import('../core/telegram.js');
    if (await confirm('Delete this product?')) { toast('Product deleted (demo)', { kind: 'danger' }); location.href = 'products.html'; }
  });
  bindAdminChrome();
}

function save() {
  const v = (id_) => document.getElementById(id_)?.value.trim() || '';
  if (!v('f_name') || !v('f_price')) { toast('Name and price are required', { kind: 'danger' }); haptic('error'); return; }
  const primary = gallery[0];
  const iconEntry = gallery.find((g) => g.kind === 'emoji');
  const payload = {
    id: product?.id, name: v('f_name'), type, categoryId: v('f_cat'),
    price: parseFloat(v('f_price')), compareAtPrice: v('f_compare') ? parseFloat(v('f_compare')) : null,
    stock: parseInt(v('f_stock') || '0', 10), description: v('f_desc'),
    gallery,
    image: primary.kind === 'image' ? primary.src : null,   // uploaded primary photo, if any
    emoji: iconEntry?.emoji || '📦', color: iconEntry?.color || '#00FF88',
    digital: type === 'digital'
      ? { platform: v('f_platform'), format: v('f_format'), license: v('f_license'), assets: assets.map((a) => ({ ...a })) }
      : null,
  };
  // Demo build: `payload` is the validated product (with its image gallery). In production,
  // persist it here (e.g. `await dataService.saveProduct(payload)`), uploading real images.
  void payload;
  haptic('success');
  toast(product ? 'Changes saved (demo)' : 'Product created (demo)', { kind: 'success' });
  setTimeout(() => { location.href = 'products.html'; }, 700);
}

render();
