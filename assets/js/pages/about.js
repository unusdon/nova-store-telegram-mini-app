/**
 * Nova Kit — About
 * Brand summary, version, and useful links. All content comes from config.
 */
import { config } from '../config.js';
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { icon } from '../core/icons.js';
import { esc } from '../core/ui.js';
import { appBar, bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');

document.getElementById('appbar').innerHTML = appBar({ title: t('profile.about'), back: 'profile.html', themeToggle: true });
bindThemeToggle();

screen.innerHTML = `
  <div class="about">
    <div class="about__logo">${config.brand.logoEmoji}</div>
    <h1 style="margin-top:8px">${esc(config.brand.name)}</h1>
    <p class="muted">${esc(config.brand.tagline)}</p>
    <p class="about__ver">Version 1.0.0</p>
  </div>
  <div class="list">
    <a class="list-row" href="help.html"><span class="list-row__icon">${icon('help', { size: 20 })}</span>
      <span class="list-row__text"><span class="list-row__title">Help &amp; support</span></span>${icon('chevron', { size: 18, cls: 'text-faint' })}</a>
    <a class="list-row" href="legal.html"><span class="list-row__icon">${icon('info', { size: 20 })}</span>
      <span class="list-row__text"><span class="list-row__title">Terms &amp; privacy</span></span>${icon('chevron', { size: 18, cls: 'text-faint' })}</a>
  </div>
  <p class="muted text-sm" style="text-align:center;padding:24px">Built with the Nova Mini App Kit by ${esc(config.brand.author)}.</p>
`;
