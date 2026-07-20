/**
 * Nova Kit — Notifications
 * A demo notification feed with unread highlighting and a "mark all read" action.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { esc } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { appBar, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const key = `${config.data.persistNamespace}:notif-read`;
let read = JSON.parse(localStorage.getItem(key) || '[]');

const feed = [
  { id: 'n1', icon: '📦', title: 'Order delivered', body: 'Your order NV-1001 has been delivered.', time: '2h ago' },
  { id: 'n2', icon: '🎁', title: 'You earned a coupon', body: 'Use WELCOME10 for 10% off your next order.', time: '1d ago' },
  { id: 'n3', icon: '🚚', title: 'Order shipped', body: 'NV-0913 is on its way.', time: '2d ago' },
  { id: 'n4', icon: '⭐', title: 'Rate your purchase', body: 'Tell us what you think of the Pulse Smart Watch.', time: '3d ago' },
];

function render() {
  const unread = feed.filter((n) => !read.includes(n.id)).length;
  document.getElementById('appbar').innerHTML = appBar({
    title: 'Notifications', back: 'profile.html', themeToggle: true,
    actions: unread ? [{ icon: 'check', href: 'javascript:void(0)', label: 'Mark all read' }] : [],
  });
  bindThemeToggle();
  document.querySelector('[aria-label="Mark all read"]')?.addEventListener('click', () => {
    read = feed.map((n) => n.id); localStorage.setItem(key, JSON.stringify(read)); haptic('success'); render();
  });

  screen.innerHTML = `<div style="padding-top:8px">${feed.map((n) => `
    <div class="notif ${read.includes(n.id) ? '' : 'is-unread'}" data-id="${n.id}">
      <span class="notif__icon">${n.icon}</span>
      <div class="grow"><div class="semibold">${esc(n.title)}</div>
        <div class="muted text-sm">${esc(n.body)}</div>
        <div class="notif__time">${esc(n.time)}</div></div>
    </div>`).join('')}</div>`;

  screen.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => {
    if (!read.includes(el.dataset.id)) { read.push(el.dataset.id); localStorage.setItem(key, JSON.stringify(read)); render(); }
  }));
}

render();
