/**
 * Nova Kit — Onboarding
 * A short swipeable intro shown on first launch. "Skip"/"Get started" set a flag and go to
 * the storefront so it only appears once (clear the flag to preview again).
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { esc } from '../core/ui.js';
import { haptic } from '../core/telegram.js';

bootstrap();

const screen = document.getElementById('screen');
const key = `${config.data.persistNamespace}:onboarded`;

const slides = [
  { emoji: '🛍️', title: `Welcome to ${config.brand.name}`, text: config.brand.tagline },
  { emoji: '⚡', title: 'Shop in a tap', text: 'Browse, add to cart, and check out without ever leaving your chat.' },
  { emoji: '🔒', title: 'Fast & secure', text: 'Multiple payment options with instant delivery for digital goods.' },
];

let index = 0;

function render() {
  screen.innerHTML = `
    <div class="onb">
      <div class="onb__track" id="track">
        ${slides.map((s) => `<div class="onb__slide">
          <div class="onb__emoji">${s.emoji}</div>
          <h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></div>`).join('')}
      </div>
      <div class="onb__foot">
        <div class="onb__dots">${slides.map((_, i) => `<span class="onb__dot${i === 0 ? ' is-on' : ''}"></span>`).join('')}</div>
        <button class="btn btn--block" id="next">Next</button>
        <button class="btn btn--outline btn--block" id="skip">Skip</button>
      </div>
    </div>`;

  const track = document.getElementById('track');
  const dots = screen.querySelectorAll('.onb__dot');
  const nextBtn = document.getElementById('next');

  track.addEventListener('scroll', () => {
    index = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach((d, i) => d.classList.toggle('is-on', i === index));
    nextBtn.textContent = index === slides.length - 1 ? 'Get started' : 'Next';
  });

  nextBtn.addEventListener('click', () => {
    if (index < slides.length - 1) { index++; track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' }); haptic('selection'); }
    else finish();
  });
  document.getElementById('skip').addEventListener('click', finish);
}

function finish() {
  localStorage.setItem(key, '1');
  location.href = 'index.html';
}

render();
