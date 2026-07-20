/**
 * Nova Kit — Personal Information (faithful replica of the original personal-info page)
 * Photo, grouped form sections, preference toggles, and a danger zone. Saved locally.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const screen = document.getElementById('screen');
const key = `${NS}:profile`;
const AVATAR_KEY = `${NS}:avatar`;        // shared with the Profile page
const MAX_AVATAR = 2 * 1024 * 1024;       // 2 MB
const saved = JSON.parse(localStorage.getItem(key) || '{}');
let avatar = JSON.parse(localStorage.getItem(AVATAR_KEY) || 'null'); // { type:'image'|'emoji', value }

function avatarInner() {
  if (avatar?.type === 'image') return `<img src="${avatar.value}" alt="Profile photo" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  return avatar?.value || config.brand.logoEmoji;
}
const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
const v = {
  first: saved.firstName ?? tgUser?.first_name ?? '',
  last: saved.lastName ?? tgUser?.last_name ?? '',
  email: saved.email ?? '',
  code: saved.code ?? '+1',
  phone: saved.phone ?? '',
  prefs: saved.prefs ?? { email: true, sms: false, marketing: false },
};

function field(label, id, value, type = 'text', extra = '') {
  return `<div class="field"><label class="field__label" for="${id}">${label}</label>
    <input class="input" id="${id}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}
function pref(id, title, desc, on) {
  return `<div class="preference-item"><div class="preference-info">
    <div class="preference-title">${title}</div><div class="preference-description">${desc}</div></div>
    <label class="switch"><input type="checkbox" data-pref="${id}" ${on ? 'checked' : ''}><span class="switch__track"></span></label></div>`;
}

document.getElementById('appbar').innerHTML = `<header class="personal-info-header"><div class="header-top">
  <a class="back-button" href="profile.html" aria-label="Back">${icon('back', { size: 24 })}</a>
  <div class="header-center"><h1 class="page-title">Personal Information</h1>
    <span class="info-subtitle">Update your details</span></div>
  <button class="save-button" id="saveTop">Save</button>
</div></header>`;
bindThemeToggle();

screen.innerHTML = `<div class="personal-info-content">
  <div class="profile-photo-section">
    <div class="profile-photo"><div class="photo-placeholder" id="photoPreview">${avatarInner()}</div></div>
    <button class="change-photo-btn" id="changePhoto">Change photo</button>
    <input type="file" id="photoFile" accept="image/*" hidden>
  </div>

  <div class="form-section"><div class="form-section__title">Basic Information</div>
    <div class="form-grid">${field('First Name', 'p_first', v.first)}${field('Last Name', 'p_last', v.last)}</div>
    ${field('Email', 'p_email', v.email, 'email')}
    <div class="field"><label class="field__label">Phone Number</label>
      <div class="phone-input-container">
        <input class="input country-code" id="p_code" value="${esc(v.code)}">
        <input class="input" id="p_phone" type="tel" value="${esc(v.phone)}" placeholder="Phone number">
      </div></div>
  </div>

  <div class="form-section"><div class="form-section__title">Notification Preferences</div>
    <div class="preferences-list">
      ${pref('email', 'Email notifications', 'Order updates and receipts', v.prefs.email)}
      ${pref('sms', 'SMS notifications', 'Delivery alerts by text', v.prefs.sms)}
      ${pref('marketing', 'Marketing', 'Promotions and offers', v.prefs.marketing)}
    </div>
  </div>

  <div class="danger-zone">
    <div class="danger-zone__title">Danger Zone</div>
    <div class="danger-zone__text">Deleting your account is permanent and cannot be undone.</div>
    <button class="danger-btn" id="deleteAccount">Delete Account</button>
  </div>
</div>`;

document.getElementById('bottombar').innerHTML =
  `<div class="bottom-bar"><button class="btn btn--block" id="saveBottom">Save changes</button></div>`;

function saveAll() {
  const g = (id) => document.getElementById(id).value.trim();
  const prefs = {};
  screen.querySelectorAll('[data-pref]').forEach((c) => { prefs[c.dataset.pref] = c.checked; });
  localStorage.setItem(key, JSON.stringify({
    firstName: g('p_first'), lastName: g('p_last'), email: g('p_email'),
    code: g('p_code'), phone: g('p_phone'), prefs,
  }));
  haptic('success'); toast('Profile saved', { kind: 'success' });
}
document.getElementById('saveTop').addEventListener('click', saveAll);
document.getElementById('saveBottom').addEventListener('click', saveAll);
document.getElementById('changePhoto').addEventListener('click', () => document.getElementById('photoFile').click());
document.getElementById('photoFile').addEventListener('change', (e) => { handlePhoto(e.target.files?.[0]); e.target.value = ''; });

function handlePhoto(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Please choose an image file', { kind: 'danger' }); return; }
  if (file.size > MAX_AVATAR) { toast('Image must be under 2 MB', { kind: 'danger' }); return; }
  const reader = new FileReader();
  reader.onload = () => {
    avatar = { type: 'image', value: reader.result };
    localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
    document.getElementById('photoPreview').innerHTML = avatarInner();
    haptic('success'); toast('Photo updated', { kind: 'success' });
  };
  reader.readAsDataURL(file);
}
document.getElementById('deleteAccount').addEventListener('click', async () => {
  if (await confirm('Delete your account? This cannot be undone.')) { haptic('error'); toast('Account deletion is disabled in the demo', { kind: 'danger' }); }
});
