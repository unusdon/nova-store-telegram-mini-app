/**
 * Nova Kit — Admin staff & roles
 * Team member list with roles; invite a teammate via a bottom sheet, or tap a member to manage
 * their role / active state / remove them. Demo persists in memory.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { demoStaff } from './admin-data.js';

adminBootstrap();

const screen = document.getElementById('screen');
const ROLES = ['Owner', 'Manager', 'Support', 'Fulfilment'];
// Seeded from the shared roster so this page and the customer detail sheet can't disagree.
const staff = demoStaff.map((m) => ({ ...m }));
let nextId = staff.length; // ids stay unique even after members are removed

const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const rolePill = (role) => `status status--${role === 'Owner' ? 'paid' : 'delivered'}`;

function row(m) {
  return `<button class="data-row" data-manage="${esc(m.id)}">
    <span class="data-row__avatar">${initials(m.name)}</span>
    <span class="data-row__main"><span class="data-row__title">${esc(m.name)}</span>
      <span class="data-row__sub">${esc(m.handle)}</span></span>
    <span class="${rolePill(m.role)}">${esc(m.role)}</span>
  </button>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({
    title: 'Staff', back: 'index.html', menu: false,
    actions: `<button class="appbar__btn" id="invite" aria-label="Invite">${icon('plus', { size: 22 })}</button>`,
  });
  screen.innerHTML = `
    <div class="admin-section-title">${staff.length} team members</div>
    <div class="list" style="margin-top:0">${staff.map(row).join('')}</div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();
  document.getElementById('invite').addEventListener('click', openInvite);
  screen.querySelectorAll('[data-manage]').forEach((b) => b.addEventListener('click', () => {
    haptic('selection');
    manage(b.dataset.manage);
  }));
}

function openInvite() {
  const form = `
    <div class="field"><label class="field__label">Name</label><input class="input" id="m_name" placeholder="Jane Doe"></div>
    <div class="field"><label class="field__label">Telegram handle</label><input class="input" id="m_handle" placeholder="@jane"></div>
    <div class="field"><label class="field__label">Role</label>
      <select class="select" id="m_role">${ROLES.map((r) => `<option>${r}</option>`).join('')}</select></div>
    <button class="btn btn--block" id="m_save">Send invite</button>`;
  const sheet = bottomSheet({ title: 'Invite teammate', content: form });
  haptic('selection');
  sheet.el.querySelector('#m_save').addEventListener('click', () => {
    const name = sheet.el.querySelector('#m_name').value.trim();
    if (!name) { haptic('error'); toast('Name is required', { kind: 'danger' }); return; }
    staff.push({
      id: 's' + (nextId += 1),
      name,
      handle: sheet.el.querySelector('#m_handle').value.trim() || '@new',
      role: sheet.el.querySelector('#m_role').value,
      active: true,
    });
    haptic('success'); sheet.close(); toast('Invite sent (demo)', { kind: 'success' }); render();
  });
}

/* Manage member — change role, toggle active, or remove them from the team. */
function manage(id) {
  const m = staff.find((s) => s.id === id);
  if (!m) return;
  const form = `
    <div class="row-between" style="margin-bottom:var(--space-4)">
      <div><div class="semibold">${esc(m.name)}</div><div class="muted text-sm">${esc(m.handle)}</div></div>
      <span class="${rolePill(m.role)}" id="m_pill">${esc(m.role)}</span>
    </div>
    <div class="field"><label class="field__label">Role</label>
      <select class="select" id="m_role">
        ${ROLES.map((r) => `<option${r === m.role ? ' selected' : ''}>${r}</option>`).join('')}
      </select></div>
    <div class="row-between" style="padding:12px 0">
      <span class="field__label" style="margin:0">Active</span>
      <label class="switch"><input type="checkbox" id="m_active" ${m.active ? 'checked' : ''}><span class="switch__track"></span></label>
    </div>
    <button class="btn btn--outline btn--block" id="m_remove" style="color:var(--danger);border-color:var(--danger)">Remove member</button>`;
  const sheet = bottomSheet({ title: 'Manage member', content: form });

  const pill = sheet.el.querySelector('#m_pill');
  sheet.el.querySelector('#m_role').addEventListener('change', (e) => {
    m.role = e.target.value;
    pill.className = rolePill(m.role);
    pill.textContent = m.role;
    haptic('selection');
    render();
  });
  sheet.el.querySelector('#m_active').addEventListener('change', (e) => {
    m.active = e.target.checked;
    haptic('selection');
    render();
  });
  sheet.el.querySelector('#m_remove').addEventListener('click', async () => {
    if (!(await confirm(`Remove ${m.name} from the team?`))) return;
    const i = staff.indexOf(m);
    if (i > -1) staff.splice(i, 1);
    haptic('success'); sheet.close(); toast('Member removed (demo)', { kind: 'success' }); render();
  });
}

render();
