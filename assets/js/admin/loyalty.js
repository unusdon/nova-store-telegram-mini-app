/**
 * Nova Kit — Admin loyalty program
 * Configure the points program (earn rate, redemption value, welcome bonus, tiers) and see
 * enrolled members + top earners. Tap a tier to edit its perk / minimum points.
 * Settings persist under `nova:loyaltyConfig`; tier edits are in-memory demo state.
 */
import { adminBootstrap, adminHeader, adminTabBar, bindAdminChrome } from './admin-shell.js';
import { config } from '../config.js';
import { icon } from '../core/icons.js';
import { formatPrice } from '../core/format.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { loyaltyTiers, tierFor, getTopMembers } from './admin-data.js';

adminBootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:loyaltyConfig`;
const screen = document.getElementById('screen');

const DEFAULTS = { enabled: true, earnRate: 1, redeemValue: 5, welcomeBonus: 100 };
let cfg = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
/* Tiers + top members are shared with the customers screen — see admin-data.js. */
const TIERS = loyaltyTiers;

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function tierRow(t) {
  return `<button class="data-row" data-tier="${esc(t.name)}">
    <span class="data-row__avatar ${t.color}">⭐</span>
    <span class="data-row__main"><span class="data-row__title">${esc(t.name)}</span>
      <span class="data-row__sub">${esc(t.perk)}</span></span>
    <span class="data-row__end"><span class="semibold">${t.min.toLocaleString()}+</span><span class="muted text-sm">points</span></span>
  </button>`;
}

/** Pull the settings form back into `cfg` so a re-render never drops in-progress edits. */
function readForm() {
  if (!document.getElementById('l_enabled')) return;
  cfg = {
    enabled: document.getElementById('l_enabled').checked,
    earnRate: +document.getElementById('l_earn').value || 0,
    redeemValue: +document.getElementById('l_redeem').value || 0,
    welcomeBonus: +document.getElementById('l_welcome').value || 0,
  };
}

/** Tier edit sheet — change a tier's perk copy and the points needed to qualify. */
function editTier(name) {
  const t = TIERS.find((x) => x.name === name);
  if (!t) return;
  const form = `
    <div class="field"><label class="field__label">Perk</label>
      <input class="input" id="t_perk" value="${esc(t.perk)}" placeholder="e.g. 1.5× points + free shipping"></div>
    <div class="field"><label class="field__label">Minimum points to qualify</label>
      <input class="input" id="t_min" type="number" min="0" value="${t.min}"></div>
    <button class="btn btn--block" id="t_save">Save tier</button>`;
  const sheet = bottomSheet({ title: `Edit ${t.name} tier`, content: form });

  sheet.el.querySelector('#t_save').addEventListener('click', () => {
    const perk = sheet.el.querySelector('#t_perk').value.trim();
    if (!perk) { toast('Enter a perk description', { kind: 'danger' }); haptic('error'); return; }
    t.perk = perk;
    t.min = Math.max(0, +sheet.el.querySelector('#t_min').value || 0);
    haptic('success'); toast(`${t.name} tier updated`, { kind: 'success' });
    sheet.close();
    readForm();
    render();
  });
}

/* Top member — links through to that customer's detail sheet on the customers screen. */
function memberRow(c) {
  const tier = tierFor(c.points, TIERS);
  return `<a class="data-row" href="customers.html?id=${encodeURIComponent(c.id)}">
    <span class="data-row__avatar">${esc(initials(c.name))}</span>
    <span class="data-row__main"><span class="data-row__title">${esc(c.name)}</span>
      <span class="data-row__sub">${esc(tier.name)} member</span></span>
    <span class="data-row__end"><span class="semibold text-accent">${c.points.toLocaleString()}</span><span class="muted text-sm">points</span></span>
  </a>`;
}

function render() {
  document.getElementById('appbar').innerHTML = adminHeader({ title: 'Loyalty program', back: 'index.html', menu: false });
  screen.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('users', { size: 18 })}</span>Members</span><span class="kpi__value">1,284</span></div>
      <div class="kpi"><span class="kpi__label"><span class="kpi__icon">${icon('star', { size: 18 })}</span>Points outstanding</span><span class="kpi__value">86.4k</span></div>
    </div>

    <div class="container" style="padding-bottom:0">
      <label class="card card--pad row-between" style="margin-bottom:12px"><span class="semibold">Loyalty program</span>
        <label class="switch"><input type="checkbox" id="l_enabled" ${cfg.enabled ? 'checked' : ''}><span class="switch__track"></span></label></label>
    </div>

    <div class="admin-section-title">Earning & redemption</div>
    <div class="container" style="padding-top:0">
      <div class="card card--pad">
        <div class="field"><label class="field__label">Points earned per ${formatPrice(1)} spent</label><input class="input" id="l_earn" type="number" min="0" step="0.5" value="${cfg.earnRate}"></div>
        <div class="field"><label class="field__label">Value of 100 points (store credit)</label><input class="input" id="l_redeem" type="number" min="0" step="0.5" value="${cfg.redeemValue}"></div>
        <div class="field" style="margin-bottom:0"><label class="field__label">Sign-up welcome bonus (points)</label><input class="input" id="l_welcome" type="number" min="0" value="${cfg.welcomeBonus}"></div>
      </div>
    </div>

    <div class="admin-section-title">Tiers</div>
    <div class="list" style="margin-top:0;padding:0 var(--space-4)">${TIERS.map(tierRow).join('')}</div>

    <div class="admin-section-title">Top members</div>
    <div class="list" style="margin-top:0;padding:0 var(--space-4)">${getTopMembers().map(memberRow).join('')}</div>

    <div class="container"><button class="btn btn--block" id="saveBtn">${icon('check', { size: 18 })} Save changes</button></div>
    <div style="height:8px"></div>`;
  document.getElementById('tabbar').innerHTML = adminTabBar('dashboard');
  bindAdminChrome();

  document.getElementById('saveBtn').addEventListener('click', () => {
    readForm();
    localStorage.setItem(KEY, JSON.stringify(cfg));
    haptic('success'); toast('Loyalty settings saved', { kind: 'success' });
  });

  screen.querySelectorAll('[data-tier]').forEach((b) => b.addEventListener('click', () => {
    haptic('selection'); editTier(b.dataset.tier);
  }));
}

render();
