/**
 * Nova Kit — Invite friends / referral
 * A shareable referral code, a share action, and a list of invited friends.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { esc, toast } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { appBar, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const code = 'NOVA-7F3K';
const invited = [
  { name: 'Amara O.', status: 'Joined' },
  { name: 'Liam B.', status: 'Pending' },
];

document.getElementById('appbar').innerHTML = appBar({ title: 'Invite friends', back: 'profile.html', themeToggle: true });
bindThemeToggle();

screen.innerHTML = `
  <div class="about" style="padding-bottom:8px">
    <div class="about__logo">🎁</div>
    <h1 style="margin-top:8px">Give $10, get $10</h1>
    <p class="muted">Share your code — you both get store credit on their first order.</p>
  </div>
  <div class="referral-code"><span>${esc(code)}</span>
    <button class="btn btn--sm" id="copy">Copy</button></div>
  <div class="container"><button class="btn btn--block" id="share">${icon('gift', { size: 18 })} Share invite</button></div>
  <div class="settings-group__label" style="padding-inline:var(--space-5);margin-top:var(--space-2)">Invited friends</div>
  <div class="list">
    ${invited.map((f) => `<div class="list-row">
      <span class="invitee-avatar">${esc(f.name.trim()[0] || '?')}</span>
      <span class="list-row__text"><span class="list-row__title">${esc(f.name)}</span>
        <span class="list-row__sub">${f.status === 'Joined' ? 'Reward credited' : 'Awaiting first order'}</span></span>
      <span class="status status--${f.status === 'Joined' ? 'delivered' : 'pending'}">${esc(f.status)}</span>
    </div>`).join('')}
  </div>`;

async function copyCode() {
  try { await navigator.clipboard.writeText(code); } catch { /* clipboard may be blocked */ }
  haptic('success'); toast('Code copied', { kind: 'success' });
}
document.getElementById('copy').addEventListener('click', copyCode);
document.getElementById('share').addEventListener('click', () => {
  const text = `Join ${config.brand.name} with my code ${code}!`;
  if (navigator.share) navigator.share({ text }).catch(() => {});
  else copyCode();
});
