/**
 * Nova Kit — Address Book (faithful replica of the original addresses page)
 * Default banner, address cards (type + default badge + edit/delete), add/edit form sheet.
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { dataService } from '../core/store.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const TYPE_ICON = { home: '🏠', work: '🏢', other: '📍' };

function card(a) {
  const type = a.label ? a.label.toLowerCase() : 'home';
  return `<div class="address-card${a.default ? ' default' : ''}" data-id="${a.id}">
    <div class="address-card__top">
      <div class="address-type">${TYPE_ICON[type] || '📍'} ${esc(a.label || 'Home')}
        ${a.default ? '<span class="default-badge">Default</span>' : ''}</div>
      <div class="address-actions">
        <button class="address-action-btn" data-edit="${a.id}" aria-label="Edit">${icon('edit', { size: 16 })}</button>
        <button class="address-action-btn delete" data-del="${a.id}" aria-label="Delete">${icon('trash', { size: 16 })}</button>
      </div>
    </div>
    <div class="address-details">
      <div class="address-name">${esc(a.name)}</div>
      <div class="address-text">${esc([a.line1, a.line2].filter(Boolean).join(', '))}<br>
        ${esc([a.city, a.region, a.postal].filter(Boolean).join(', '))}<br>
        ${esc(a.country || '')}${a.phone ? ' · ' + esc(a.phone) : ''}</div>
    </div>
    ${!a.default ? `<button class="address-set-default" data-default="${a.id}">Set as default</button>` : ''}
  </div>`;
}

function render() {
  const list = dataService.getAddresses();
  const hasDefault = list.some((a) => a.default);

  document.getElementById('appbar').innerHTML = `<header class="addresses-header"><div class="header-top">
    <a class="back-button" href="profile.html" aria-label="Back">${icon('back', { size: 24 })}</a>
    <div class="header-center"><h1 class="page-title">Address Book</h1>
      <span class="addresses-subtitle">Manage shipping addresses</span></div>
    <button class="add-button" id="addBtn" aria-label="Add">${icon('plus', { size: 24 })}</button>
  </div></header>`;
  bindThemeToggle();

  screen.innerHTML = `<div class="addresses-content">
    ${list.length && !hasDefault ? `<div class="default-address-banner"><div class="banner-icon">🏠</div>
      <div class="banner-text"><strong>Set a default address</strong> for faster checkout</div></div>` : ''}
    ${list.length
      ? `<div class="addresses-list">${list.map(card).join('')}</div>`
      : `<div class="empty-addresses"><div class="empty-icon">📍</div>
          <h3 class="empty-title">No addresses saved</h3><p>Add your first shipping address to get started.</p>
          <button class="add-address-btn" id="addFirst">Add Address</button></div>`}
  </div>`;

  wire(list);
}

function wire(list) {
  document.getElementById('addBtn').addEventListener('click', () => edit(null));
  document.getElementById('addFirst')?.addEventListener('click', () => edit(null));
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(list.find((a) => a.id === b.dataset.edit))));
  screen.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => del(b.dataset.del)));
  screen.querySelectorAll('[data-default]').forEach((b) => b.addEventListener('click', () => setDefault(b.dataset.default)));
}

function setDefault(id) {
  dataService.getAddresses().forEach((a) => dataService.saveAddress({ ...a, default: a.id === id }));
  haptic('selection'); render();
}
async function del(id) {
  if (await confirm('Delete this address? This action cannot be undone.')) { dataService.deleteAddress(id); haptic('medium'); toast('Address deleted'); render(); }
}

function edit(a) {
  const d = a || {};
  const type = (d.label || 'home').toLowerCase();
  const form = `
    <div class="field"><label class="field__label">Address Type</label>
      <select class="input" id="f_type">
        ${[['home', '🏠 Home'], ['work', '🏢 Work'], ['other', '📍 Other']].map(([v, l]) => `<option value="${v}" ${type === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></div>
    <div class="form-grid">
      <div class="field"><label class="field__label">First Name *</label><input class="input" id="f_first" value="${esc((d.name || '').split(' ')[0] || '')}"></div>
      <div class="field"><label class="field__label">Last Name *</label><input class="input" id="f_last" value="${esc((d.name || '').split(' ').slice(1).join(' '))}"></div>
    </div>
    <div class="field"><label class="field__label">Address Line 1 *</label><input class="input" id="f_line1" value="${esc(d.line1 || '')}" placeholder="Street address"></div>
    <div class="field"><label class="field__label">Address Line 2</label><input class="input" id="f_line2" value="${esc(d.line2 || '')}" placeholder="Apartment, suite, unit"></div>
    <div class="form-grid">
      <div class="field"><label class="field__label">City *</label><input class="input" id="f_city" value="${esc(d.city || '')}"></div>
      <div class="field"><label class="field__label">State/Province *</label><input class="input" id="f_state" value="${esc(d.region || '')}"></div>
    </div>
    <div class="form-grid">
      <div class="field"><label class="field__label">ZIP/Postal *</label><input class="input" id="f_zip" value="${esc(d.postal || '')}"></div>
      <div class="field"><label class="field__label">Country *</label><input class="input" id="f_country" value="${esc(d.country || '')}"></div>
    </div>
    <div class="field"><label class="field__label">Phone Number</label><input class="input" id="f_phone" value="${esc(d.phone || '')}" placeholder="+1 (555) 123-4567"></div>
    <label class="checkbox-container" style="margin-bottom:16px"><input type="checkbox" id="f_default" ${d.default ? 'checked' : ''}>
      <span class="checkmark"></span><span class="checkbox-text">Set as default address</span></label>
    <button class="btn btn--block" id="f_save">Save Address</button>`;
  const sheet = bottomSheet({ title: a ? 'Edit Address' : 'Add New Address', content: form });
  sheet.el.querySelector('#f_save').addEventListener('click', () => {
    const v = (id) => sheet.el.querySelector('#' + id).value.trim();
    if (!v('f_first') || !v('f_line1') || !v('f_city')) { toast('Please fill the required fields', { kind: 'danger' }); return; }
    dataService.saveAddress({
      id: d.id, label: v('f_type').charAt(0).toUpperCase() + v('f_type').slice(1),
      name: `${v('f_first')} ${v('f_last')}`.trim(), line1: v('f_line1'), line2: v('f_line2'),
      city: v('f_city'), region: v('f_state'), postal: v('f_zip'), country: v('f_country'),
      phone: v('f_phone'), default: sheet.el.querySelector('#f_default').checked || d.default,
    });
    haptic('success'); sheet.close(); toast('Address saved', { kind: 'success' }); render();
  });
}

render();
