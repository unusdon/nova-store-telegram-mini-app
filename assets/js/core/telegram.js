/**
 * Nova Kit — Telegram WebApp adapter
 * ==================================
 * The ONLY place that touches `window.Telegram.WebApp`. Every call is guarded, so pages
 * work identically inside Telegram and in a plain browser (where these become no-ops or
 * sensible fallbacks). Never call the Telegram SDK directly from a page — use this module.
 */
import { config } from '../config.js';

const wa = () => (config.telegram.enabled ? window.Telegram?.WebApp : null);

/**
 * Is the running Telegram client at least Bot API version `min` (e.g. '6.2')?
 * Older clients still expose newer methods (showAlert, openInvoice, HapticFeedback…) but calling
 * them only logs "Method X is not supported in version 6.0" and never fires their callback — so we
 * must feature-detect by VERSION, not by method presence, and fall back to a browser equivalent.
 * `isVersionAtLeast` itself only exists on 6.7+, so we also parse `version` manually for old clients.
 */
function atLeast(app, min) {
  if (!app) return false;
  if (typeof app.isVersionAtLeast === 'function') {
    try { return app.isVersionAtLeast(min); } catch { /* fall through to the manual parse */ }
  }
  const parse = (v) => String(v).split('.').map((n) => parseInt(n, 10) || 0);
  const cur = parse(app.version || '6.0');
  const want = parse(min);
  for (let i = 0; i < Math.max(cur.length, want.length); i++) {
    const c = cur[i] || 0;
    const w = want[i] || 0;
    if (c !== w) return c > w;
  }
  return true;
}

export const isTelegram = () => Boolean(wa());

/** Call once on every page load. Prepares the viewport and reads the colour scheme. */
export function initTelegram() {
  const app = wa();
  if (!app) return null;
  app.ready();
  if (config.telegram.expand) app.expand();
  // enableClosingConfirmation needs Bot API 6.2+.
  if (config.telegram.closingConfirmation && atLeast(app, '6.2')) {
    app.enableClosingConfirmation?.();
  }
  return app;
}

/** 'light' | 'dark' | null (null => caller decides from config/OS). */
export function telegramColorScheme() {
  return wa()?.colorScheme || null;
}

/** Read Telegram theme params so the design tokens can follow the user's Telegram theme. */
export function telegramThemeParams() {
  return wa()?.themeParams || null;
}

export function onThemeChanged(handler) {
  wa()?.onEvent?.('themeChanged', handler);
}

/** Haptic feedback: 'light'|'medium'|'heavy'|'success'|'warning'|'error'|'selection'. */
export function haptic(kind = 'light') {
  const app = wa();
  const h = app?.HapticFeedback;
  // HapticFeedback requires Bot API 6.1+ — calling it on older clients just logs a warning.
  if (!h || !config.telegram.haptics || !atLeast(app, '6.1')) return;
  if (kind === 'success' || kind === 'warning' || kind === 'error') {
    h.notificationOccurred(kind);
  } else if (kind === 'selection') {
    h.selectionChanged();
  } else {
    h.impactOccurred(kind);
  }
}

/** Back button — shows the native Telegram back button and wires a handler. */
export function setBackButton(handler) {
  const bb = wa()?.BackButton;
  if (!bb) return;
  if (handler) {
    bb.show();
    bb.onClick(handler);
  } else {
    bb.hide();
  }
}

/** Main (primary) button at the bottom of the Telegram viewport. */
export function setMainButton({ text, visible = true, onClick } = {}) {
  const mb = wa()?.MainButton;
  if (!mb) return;
  if (!visible) return mb.hide();
  if (text) mb.setText(text);
  if (onClick) mb.onClick(onClick);
  mb.show();
}

/** Native alert with a browser fallback. Returns a Promise. */
export function alert(message) {
  const app = wa();
  return new Promise((resolve) => {
    // showAlert needs Bot API 6.2+. On older clients the method exists but never fires its
    // callback (it only logs "not supported"), which would hang this promise — so fall back.
    if (app?.showAlert && atLeast(app, '6.2')) app.showAlert(message, () => resolve());
    else { window.alert(message); resolve(); }
  });
}

/** Native confirm with a browser fallback. Resolves to a boolean. */
export function confirm(message) {
  const app = wa();
  return new Promise((resolve) => {
    // showConfirm needs Bot API 6.2+ — same hang risk as showAlert on older clients.
    if (app?.showConfirm && atLeast(app, '6.2')) app.showConfirm(message, (ok) => resolve(ok));
    else resolve(window.confirm(message));
  });
}

export function close() {
  wa()?.close();
}

/**
 * Open a Telegram invoice (e.g. a Telegram Stars / XTR invoice link created by your bot
 * backend) and resolve with its final status: 'paid' | 'cancelled' | 'failed' | 'pending'.
 * Resolves 'unsupported' when not running inside a Telegram client that supports invoices.
 */
export function openInvoice(link) {
  const app = wa();
  return new Promise((resolve) => {
    // openInvoice needs Bot API 6.1+ — on older clients it never calls back, so report unsupported.
    if (app?.openInvoice && atLeast(app, '6.1')) app.openInvoice(link, (status) => resolve(status));
    else resolve('unsupported');
  });
}

export default {
  isTelegram, initTelegram, telegramColorScheme, telegramThemeParams,
  onThemeChanged, haptic, setBackButton, setMainButton, alert, confirm, close, openInvoice,
};
