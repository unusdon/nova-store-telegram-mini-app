/**
 * Nova Kit — Admin referral management
 * Configure the referral program (reward amounts, on/off), see program KPIs, and the
 * top referrers — tap a referrer to open a detail sheet (copy invite link, pay reward).
 * Demo previews changes; wire to your backend to persist.
 */
import { adminBootstrap, adminHeader, bindAdminChrome } from './admin-shell.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

adminBootstrap();

const screen = document.getElementById('screen');
const program = { enabled: true, referrerReward: 10, refereeReward: 10, minSpend: 25 };
const referrers = [
  { id: 'r1', name: 'Noor Haddad', handle: '@noorh', invited: 14, joined: 11, earned: 140, paid: false },
  { id: 'r2', name: 'Amara Okafor', handle: '@amara', invited: 9, joined: 7, earned: 90, paid: true },
  { id: 'r3', name: 'Sofia Marín', handle: '@sofiam', invited: 6, joined: 4, earned: 60, paid: false },
  { id: 'r4', name: 'Liam Brooks', handle: '@liamb', invited: 3, joined: 1, earned: 30, paid: false },
];
const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** Pull the reward form back into `program` so a re-render never drops in-progress edits. */
function readForm() {
  if (!document.getElementById('r_ref')) return;
  program.referrerReward = +document.getElementById('r_ref').value || 0;
  program.refereeReward = +document.getElementById('r_new').value || 0;
  program.minSpend = +document.getElementById('r_min').value || 0;
}

/** Referrer detail sheet: invited/joined/reward status, copy invite link, pay the reward. */
function openReferrer(id) {
  const r = referrers.find((x) => x.id === id);
  if (!r) return;
  const node = document.createElement('div');
  node.innerHTML = `
    <div class="row-between" style="margin-bottom:16px">
      <div><div class="semibold">${esc(r.name)}</div><div class="muted text-sm">${esc(r.handle)}</div></div>
      <div style="text-align:right"><div class="muted text-sm">Earned</div>
        <div class="semibold" style="font-size:20px">${formatPrice(r.earned)}</div></div>
    </div>
    <div class="summary" style="padding:0;margin-bottom:16px">
      <div class="summary__row"><span>Friends invited</span><span>${r.invited}</span></div>
      <div class="summary__row"><span>Joined</span><span>${r.joined}</span></div>
      <div class="summary__row"><span>Reward status</span>
        <span style="color:${r.paid ? 'var(--success)' : 'var(--text-muted)'}">${r.paid ? 'Paid' : 'Pending'}</span></div>
    </div>
    <button class="btn btn--outline btn--block" id="refCopy" style="margin-bottom:10px">Copy referral link</button>
    <button class="btn btn--block" id="refPay" ${r.paid ? 'disabled' : ''}>${r.paid ? 'Reward paid' : `Pay ${formatPrice(r.earned)} reward`}</button>`;
  bottomSheet({ title: 'Referrer', content: node });

  node.querySelector('#refCopy').addEventListener('click', async () => {
    const link = `https://novastore.example/invite/${r.handle.replace(/^@/, '')}`;
    try { await navigator.clipboard.writeText(link); } catch {}
    haptic('success');
    toast('Referral link copied', { kind: 'success' });
  });
  node.querySelector('#refPay').addEventListener('click', (e) => {
    if (r.paid) return;
    r.paid = true;
    // Reflect the new state in the open sheet, then refresh the list behind it.
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Reward paid';
    const status = node.querySelector('.summary__row:last-child span:last-child');
    if (status) { status.textContent = 'Paid'; status.style.color = 'var(--success)'; }
    haptic('success');
    toast(`Paid ${formatPrice(r.earned)} to ${r.name}`, { kind: 'success' });
    readForm();
    render();
  });
}

function render() {
  const totalInvited = referrers.reduce((s, r) => s + r.invited, 0);
  const totalJoined = referrers.reduce((s, r) => s + r.joined, 0);
  const paid = referrers.reduce((s, r) => s + r.earned, 0);

  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Referrals', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('gift', { size: 18 })}</span>Invites sent</span><span class="kpi__value">${totalInvited}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('users', { size: 18 })}</span>Joined</span><span class="kpi__value">${totalJoined}</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('check', { size: 18 })}</span>Conversion</span><span class="kpi__value">${Math.round((totalJoined / totalInvited) * 100)}%</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('card', { size: 18 })}</span>Rewards paid</span><span class="kpi__value">${formatPrice(paid)}</span></div>
    </div>

    <div class="admin-section-title">Program</div>
    <div class="list">
      <div class="list-row"><span class="list-row__text"><span class="list-row__title">Referral program</span>
        <span class="list-row__sub">${program.enabled ? 'Active' : 'Paused'}</span></span>
        <label class="switch"><input type="checkbox" id="prog" ${program.enabled ? 'checked' : ''}><span class="switch__track"></span></label></div>
    </div>
    <div class="container">
      <div class="form-grid">
        <div class="field"><label class="field__label">Referrer reward</label><input class="input" id="r_ref" type="number" min="0" step="1" value="${program.referrerReward}"></div>
        <div class="field"><label class="field__label">Friend reward</label><input class="input" id="r_new" type="number" min="0" step="1" value="${program.refereeReward}"></div>
      </div>
      <div class="field"><label class="field__label">Minimum first-order spend</label><input class="input" id="r_min" type="number" min="0" step="1" value="${program.minSpend}"></div>
    </div>

    <div class="admin-section-title">Top referrers</div>
    <div class="list" style="margin-top:0">
      ${referrers.map((r) => `<button class="data-row" data-ref="${esc(r.id)}">
        <span class="data-row__avatar">${initials(r.name)}</span>
        <span class="data-row__main"><span class="data-row__title">${esc(r.name)}</span>
          <span class="data-row__sub">${r.invited} invited · ${r.joined} joined</span></span>
        <span class="data-row__end"><span class="semibold" style="color:var(--accent)">${formatPrice(r.earned)}</span>
          <span class="muted text-sm">${r.paid ? 'Paid' : 'Pending'}</span></span>
      </button>`).join('')}
    </div>`;

  document.getElementById('bottombar').innerHTML =
    `<div class="bottom-bar"><button class="btn btn--block" id="save">Save program</button></div>`;

  document.getElementById('prog')?.addEventListener('change', (e) => { program.enabled = e.target.checked; toast(`Program ${program.enabled ? 'activated' : 'paused'}`); });
  document.getElementById('save').addEventListener('click', () => {
    readForm();
    haptic('success'); toast('Referral program saved (demo)', { kind: 'success' });
  });
  screen.querySelectorAll('[data-ref]').forEach((b) => b.addEventListener('click', () => {
    haptic('selection'); openReferrer(b.dataset.ref);
  }));
  bindAdminChrome();
}

render();
