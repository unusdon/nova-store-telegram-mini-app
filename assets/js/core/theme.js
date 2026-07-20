/**
 * Nova Kit — Theme applier
 * ========================
 * Pushes `config.theme` values into the CSS token layer at runtime and resolves the active
 * colour scheme (config → Telegram → OS). Also keeps tokens in sync when the user changes
 * their Telegram theme. Call `applyTheme()` once during app bootstrap.
 */
import { config } from '../config.js';
import { telegramColorScheme, telegramThemeParams, onThemeChanged } from './telegram.js';

const STORAGE_KEY = `${config.data.persistNamespace}:theme`;

function resolveScheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const pref = saved || config.theme.colorScheme || 'auto';
  if (pref === 'light' || pref === 'dark') return pref;
  // auto → follow Telegram, then the OS
  return (
    telegramColorScheme() ||
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
}

function applyConfigTokens() {
  const root = document.documentElement.style;
  const { accent, accentContrast, radius, fontFamily } = config.theme;
  if (accent) root.setProperty('--accent', accent);
  if (accentContrast) root.setProperty('--accent-contrast', accentContrast);
  if (radius != null) root.setProperty('--radius-lg', `${radius}px`);
  if (fontFamily) root.setProperty('--font', fontFamily);
}

function applyTelegramSurface() {
  if (!config.theme.followTelegramTheme) return;
  const tp = telegramThemeParams();
  if (!tp) return;
  const root = document.documentElement.style;
  if (tp.bg_color) root.setProperty('--bg', tp.bg_color);
  if (tp.secondary_bg_color) root.setProperty('--surface', tp.secondary_bg_color);
  if (tp.text_color) root.setProperty('--text', tp.text_color);
  if (tp.hint_color) root.setProperty('--text-muted', tp.hint_color);
  if (tp.link_color) root.setProperty('--accent', tp.link_color);
}

/** Persist and apply an explicit scheme ('light' | 'dark' | 'auto'). */
export function setColorScheme(scheme) {
  if (scheme === 'auto') localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, scheme);
  applyTheme();
}

export function getColorScheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/** Toggle between light and dark (used by the Black/White switch). Returns the new scheme. */
export function toggleColorScheme() {
  const next = getColorScheme() === 'dark' ? 'light' : 'dark';
  setColorScheme(next);
  return next;
}

/** The user's saved preference: 'light' | 'dark' | 'auto' (auto = no explicit choice). */
export function savedColorScheme() {
  return localStorage.getItem(STORAGE_KEY) || 'auto';
}

export function applyTheme() {
  document.documentElement.setAttribute('data-theme', resolveScheme());
  applyConfigTokens();
  applyTelegramSurface();
}

// Re-apply when the user switches their Telegram theme.
onThemeChanged(() => applyTheme());

export default { applyTheme, setColorScheme, getColorScheme, toggleColorScheme, savedColorScheme };
