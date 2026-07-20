/**
 * Nova Kit — 404 / Not found
 * Friendly fallback for unknown routes. Point your host's 404 handler here if desired.
 */
import { bootstrap } from '../app.js';
import { t } from '../i18n/index.js';
import { appBar, bindThemeToggle } from '../components.js';

bootstrap();

document.getElementById('appbar').innerHTML = appBar({ title: '', back: 'index.html', themeToggle: true });
bindThemeToggle();

document.getElementById('screen').innerHTML = `
  <div class="empty-state" style="min-height:70dvh;justify-content:center">
    <div class="empty-state__emoji" style="font-size:64px">🧭</div>
    <h3>Page not found</h3>
    <p>The page you’re looking for doesn’t exist or has moved.</p>
    <a class="btn" href="index.html">${t('nav.home')}</a>
  </div>`;
