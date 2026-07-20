/**
 * Nova Kit — Admin message templates
 * Email / push notification templates the store sends (order confirmation, shipping, etc.).
 * Edit subject + body with {{merge}} tags and toggle each on/off; create a new template from the
 * header "+", or delete an existing one from the edit sheet. Demo persists in memory.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const CHANNELS = { email: '✉️', push: '🔔' };
const MERGE_HINT = 'Merge tags: {{name}} {{store}} {{orderId}} {{total}}';
let filter = 'all';
const templates = [
  { id: 't1', name: 'Order confirmation', channel: 'email', subject: 'Your {{store}} order {{orderId}} is confirmed', body: 'Hi {{name}},\n\nThanks for your order! We’ve received {{orderId}} for {{total}} and are getting it ready.\n\n— {{store}}', active: true },
  { id: 't2', name: 'Shipping update', channel: 'email', subject: 'Your order {{orderId}} has shipped', body: 'Good news {{name}} — {{orderId}} is on its way. Track it any time from your orders page.', active: true },
  { id: 't3', name: 'Delivery confirmation', channel: 'push', subject: 'Delivered', body: 'Your {{store}} order {{orderId}} was delivered. Enjoy!', active: true },
  { id: 't4', name: 'Abandoned cart', channel: 'email', subject: 'You left something behind', body: 'Hi {{name}}, your cart is still waiting. Complete your order and it’s yours.', active: false },
  { id: 't5', name: 'Refund processed', channel: 'email', subject: 'Your refund for {{orderId}} is on the way', body: 'We’ve processed a refund of {{total}} for {{orderId}}. It may take a few business days to appear.', active: true },
  { id: 't6', name: 'Digital delivery', channel: 'email', subject: 'Your download is ready', body: 'Hi {{name}}, your digital item from {{orderId}} is ready to download from your account.', active: true },
];

function card(t) {
  return `<div class="data-row" data-edit="${t.id}">
    <span class="data-row__avatar">${CHANNELS[t.channel]}</span>
    <span class="data-row__main"><span class="data-row__title">${esc(t.name)}</span>
      <span class="data-row__sub">${t.channel === 'email' ? 'Email' : 'Push'} · ${esc(t.subject)}</span></span>
    <span class="data-row__end"><span class="status status--${t.active ? 'delivered' : 'cancelled'}">${t.active ? 'On' : 'Off'}</span></span>
  </div>`;
}

function render() {
  const list = templates.filter((t) => filter === 'all' || t.channel === filter);
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Templates', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="newTpl" aria-label="New template">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('image', { size: 18 })}</span>Templates</span><span class="kpi__value">${templates.length}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('bell', { size: 18 })}</span>Active</span><span class="kpi__value">${templates.filter((t) => t.active).length}</span></div>
    </div>
    <div class="tabs-pill">${[['all', 'All'], ['email', 'Email'], ['push', 'Push']].map(([k, l]) => `<button class="chip${k === filter ? ' is-active' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="list" style="margin-top:0;padding:0 var(--space-4)">${list.map(card).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  screen.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
  screen.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(b.dataset.edit)));
  document.getElementById('newTpl').addEventListener('click', create);
}

function edit(id) {
  const t = templates.find((x) => x.id === id);
  const form = `
    <label class="row-between" style="padding:0 0 12px"><span class="semibold">${esc(t.name)} active</span>
      <label class="switch"><input type="checkbox" id="t_active" ${t.active ? 'checked' : ''}><span class="switch__track"></span></label></label>
    <div class="field"><label class="field__label">Subject</label><input class="input" id="t_subject" value="${esc(t.subject)}"></div>
    <div class="field"><label class="field__label">Body</label><textarea class="textarea" id="t_body" rows="6" style="min-height:140px">${esc(t.body)}</textarea></div>
    <p class="muted text-sm" style="margin:-4px 0 12px">${MERGE_HINT}</p>
    <button class="btn btn--block" id="t_save">Save template</button>
    <button class="btn btn--outline btn--block" id="t_delete" style="margin-top:var(--space-2);color:var(--danger);border-color:var(--danger)">${icon('trash', { size: 18 })} Delete template</button>`;
  const sheet = bottomSheet({ title: 'Edit template', content: form });
  sheet.el.querySelector('#t_save').addEventListener('click', () => {
    t.active = sheet.el.querySelector('#t_active').checked;
    t.subject = sheet.el.querySelector('#t_subject').value.trim() || t.subject;
    t.body = sheet.el.querySelector('#t_body').value;
    haptic('success'); sheet.close(); toast('Template saved', { kind: 'success' }); render();
  });
  sheet.el.querySelector('#t_delete').addEventListener('click', async () => {
    if (!(await confirm(`Delete "${t.name}"?`))) return;
    const i = templates.indexOf(t);
    if (i > -1) templates.splice(i, 1);
    haptic('success'); sheet.close(); toast('Template deleted', { kind: 'danger' }); render();
  });
}

/* New template — name + channel + active + subject/body, validated before it joins the list. */
function create() {
  const form = `
    <div class="field"><label class="field__label">Name</label>
      <input class="input" id="n_name" placeholder="Order confirmation"></div>
    <div class="field"><label class="field__label">Channel</label>
      <select class="select" id="n_channel">
        <option value="email">Email</option>
        <option value="push">Push</option>
      </select></div>
    <label class="row-between" style="padding:0 0 12px"><span class="semibold">Active</span>
      <label class="switch"><input type="checkbox" id="n_active" checked><span class="switch__track"></span></label></label>
    <div class="field"><label class="field__label">Subject</label><input class="input" id="n_subject"></div>
    <div class="field"><label class="field__label">Body</label><textarea class="textarea" id="n_body" rows="6" style="min-height:140px"></textarea></div>
    <p class="muted text-sm" style="margin:-4px 0 12px">${MERGE_HINT}</p>
    <button class="btn btn--block" id="n_save">Create template</button>`;
  const sheet = bottomSheet({ title: 'New template', content: form });
  sheet.el.querySelector('#n_save').addEventListener('click', () => {
    const name = sheet.el.querySelector('#n_name').value.trim();
    if (!name) { haptic('error'); toast('Name is required', { kind: 'danger' }); return; }
    const subject = sheet.el.querySelector('#n_subject').value.trim();
    if (!subject) { haptic('error'); toast('Subject is required', { kind: 'danger' }); return; }
    templates.push({
      id: 't' + Date.now().toString(36),
      name,
      channel: sheet.el.querySelector('#n_channel').value,
      subject,
      body: sheet.el.querySelector('#n_body').value,
      active: sheet.el.querySelector('#n_active').checked,
    });
    haptic('success'); sheet.close(); toast('Template created', { kind: 'success' }); render();
  });
}

render();
