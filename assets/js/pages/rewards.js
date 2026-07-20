/**
 * Nova Kit — Rewards / Loyalty
 * Points balance + tier progress, ways to earn, and a redeem catalogue. Points persist under
 * `nova:points`; redeeming deducts points and issues a reward.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { formatPrice } from '../core/format.js';
import { esc, toast } from '../core/ui.js';
import { haptic, confirm } from '../core/telegram.js';
import { pageHeader, bindThemeToggle } from '../components.js';

bootstrap();

const NS = config.data.persistNamespace;
const KEY = `${NS}:points`;
const screen = document.getElementById('screen');
let points = JSON.parse(localStorage.getItem(KEY) || 'null') ?? 1250;
const save = () => localStorage.setItem(KEY, JSON.stringify(points));

const TIERS = [['Bronze', 0], ['Silver', 1000], ['Gold', 2500], ['Platinum', 5000]];
const EARN = [
  { icon: '🛍️', title: 'Place an order', sub: 'Earn 1 point per $1 spent' },
  { icon: '⭐', title: 'Write a review', sub: '+50 points each' },
  { icon: '🎁', title: 'Refer a friend', sub: '+200 points when they order' },
  { icon: '🧑', title: 'Complete your profile', sub: '+100 points' },
];
const REDEEM = [
  { icon: '🏷️', title: '$5 off coupon', cost: 500 },
  { icon: '🏷️', title: '$10 off coupon', cost: 900 },
  { icon: '🚚', title: 'Free shipping', cost: 300 },
  { icon: '💳', title: '$20 store credit', cost: 1800 },
];

function tierInfo() {
  let cur = TIERS[0], next = null;
  for (let i = 0; i < TIERS.length; i++) { if (points >= TIERS[i][1]) cur = TIERS[i]; else { next = TIERS[i]; break; } }
  const pct = next ? Math.round(((points - cur[1]) / (next[1] - cur[1])) * 100) : 100;
  return { cur, next, pct };
}

function render() {
  const { cur, next, pct } = tierInfo();
  document.getElementById('appbar').innerHTML = pageHeader({ title: 'Rewards', back: 'profile.html' });
  bindThemeToggle();

  screen.innerHTML = `
    <div class="rewards-hero">
      <div class="rewards-points">${points.toLocaleString()}</div>
      <div class="rewards-tier">points · ${cur[0]} member</div>
      <div class="tier-bar"><div class="tier-bar__fill" style="width:${pct}%"></div></div>
      <div class="muted text-sm">${next ? `${(next[1] - points).toLocaleString()} pts to ${next[0]}` : 'Top tier reached 🎉'}</div>
    </div>
    <div class="feat-content" style="padding-top:0">
      <h3 class="section-title">Redeem</h3>
      <div class="stack gap-2">
        ${REDEEM.map((r, i) => `<div class="reward-card">
          <span class="reward-card__icon">${r.icon}</span>
          <span class="grow"><span class="semibold">${esc(r.title)}</span><br><span class="muted text-sm">${r.cost.toLocaleString()} points</span></span>
          <button class="btn btn--sm ${points >= r.cost ? '' : 'btn--outline'}" data-redeem="${i}" ${points >= r.cost ? '' : 'disabled'}>Redeem</button>
        </div>`).join('')}
      </div>
      <h3 class="section-title">Ways to earn</h3>
      <div class="stack gap-2">
        ${EARN.map((e) => `<div class="reward-card">
          <span class="reward-card__icon">${e.icon}</span>
          <span class="grow"><span class="semibold">${esc(e.title)}</span><br><span class="muted text-sm">${esc(e.sub)}</span></span>
        </div>`).join('')}
      </div>
    </div>`;

  screen.querySelectorAll('[data-redeem]').forEach((b) => b.addEventListener('click', async () => {
    const r = REDEEM[+b.dataset.redeem];
    if (points < r.cost) return;
    if (await confirm(`Redeem ${r.cost.toLocaleString()} points for ${r.title}?`)) {
      points -= r.cost; save(); haptic('success'); toast(`Redeemed: ${r.title}`, { kind: 'success' }); render();
    }
  }));
}

render();
