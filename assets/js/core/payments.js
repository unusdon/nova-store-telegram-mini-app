/**
 * Nova Kit — Payments adapter
 * ===========================
 * The ONE place that talks to a payment rail. Three providers are wired, all driven by
 * `config.payments` (see config.js):
 *
 *   • telegramStars — Telegram Stars (XTR). Your bot backend creates an invoice link
 *                     (Bot API `createInvoiceLink`, currency 'XTR'); we open it with
 *                     WebApp.openInvoice().
 *   • tonConnect    — TON on-chain payment via the TON Connect UI SDK (window.TON_CONNECT_UI,
 *                     loaded from checkout.html) to your `recipientAddress`.
 *   • stripe        — hosted Stripe Checkout Session or Payment Link (redirect; no card data
 *                     touches the app). Offered only in `supportedCountries` when set.
 *
 * Plus `manual` (Cash on Delivery / bank transfer) which just records a pending order.
 *
 * Everything is guarded: if a provider isn't configured — or its SDK / Telegram isn't
 * present — and `config.payments.demoSimulate` is true, we resolve a simulated success so
 * the storefront always completes. Pages must go through `pay()`; never call a rail directly.
 *
 * pay() resolves one of:
 *   { status: 'paid',     provider, reference, … }  → collect + fulfil the order now
 *   { status: 'pending',  provider, … }             → order placed, awaiting confirmation
 *   { status: 'redirect', provider }                → we navigated away (Stripe); do nothing
 *   { status: 'failed',   provider, error }          → show an error, let the shopper retry
 */
import { config } from '../config.js';
import { isTelegram, openInvoice } from './telegram.js';

const pay_ = () => config.payments;
const providerCfg = (id) => pay_().providers?.[id] || {};

/** Methods a shopper may pick, filtered by enabled flags, provider availability and country. */
export function enabledMethods({ country } = {}) {
  return (pay_().methods || []).filter((m) => {
    if (!m.enabled) return false;
    const prov = pay_().providers?.[m.provider];
    if (prov && prov.enabled === false) return false;
    if (m.provider === 'stripe' && country) {
      const list = providerCfg('stripe').supportedCountries || [];
      if (list.length && !list.includes(country)) return false;
    }
    return true;
  });
}

export function methodById(id) {
  return (pay_().methods || []).find((m) => m.id === id) || null;
}

/** Store-currency amount → whole Stars (XTR), minimum 1. */
export function toStars(amount) {
  const rate = providerCfg('telegramStars').starsPerUnit || 0;
  return Math.max(1, Math.round(amount * (rate || 0)));
}

/** Store-currency amount → TON (4dp). */
export function toTon(amount) {
  const rate = providerCfg('tonConnect').tonPerUnit || 0;
  return Math.round(amount * rate * 1e4) / 1e4;
}

/** True when a provider has enough config (or SDK) to run for real. */
export function isProviderReady(provider) {
  const cfg = providerCfg(provider);
  switch (provider) {
    case 'telegramStars': return Boolean(cfg.createInvoiceUrl) && isTelegram();
    case 'tonConnect':    return Boolean(cfg.manifestUrl && cfg.recipientAddress && globalThis.TON_CONNECT_UI);
    case 'stripe':        return cfg.mode === 'paymentLink' ? Boolean(cfg.paymentLinkUrl) : Boolean(cfg.checkoutUrl);
    case 'manual':        return true;
    default:              return false;
  }
}

function simulated(provider, extra = {}) {
  return { status: 'paid', provider, simulated: true, reference: reference(provider), ...extra };
}
function reference(provider) {
  // Deterministic-ish demo reference (no crypto needed for a mock receipt).
  return provider.slice(0, 3).toUpperCase() + '-' + Math.abs(Date.now() % 0xffffff).toString(36).toUpperCase();
}

/**
 * Charge for an order. `method` is a method id or object; `amount` is in store currency.
 */
export async function pay({ method, amount, currency = config.currency.code, description = '', order = null }) {
  const m = typeof method === 'string' ? methodById(method) : method;
  if (!m) throw new Error('Unknown payment method');
  const provider = m.provider;
  const cfg = providerCfg(provider);
  try {
    switch (provider) {
      case 'telegramStars': return await payStars({ cfg, amount, description, order });
      case 'tonConnect':    return await payTon({ cfg, amount, description, order });
      case 'stripe':        return await payStripe({ cfg, amount, currency, description, order });
      case 'manual':        return { status: 'pending', provider, reference: null };
      default:
        if (pay_().demoSimulate) return simulated(provider);
        throw new Error(`No handler for provider "${provider}"`);
    }
  } catch (err) {
    if (pay_().demoSimulate) return simulated(provider, { note: `demo fallback (${err.message})` });
    return { status: 'failed', provider, error: err.message };
  }
}

/* -------------------------------------------------------------------------- Telegram Stars */
async function payStars({ cfg, amount, description, order }) {
  const stars = toStars(amount);
  let link = '';
  if (cfg.createInvoiceUrl) {
    const res = await fetch(cfg.createInvoiceUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, amount, stars, currency: 'XTR', description }),
    });
    if (!res.ok) throw new Error(`invoice endpoint ${res.status}`);
    link = (await res.json()).invoiceLink || '';
  }
  if (link && isTelegram()) {
    const status = await openInvoice(link);
    if (status === 'paid') return { status: 'paid', provider: 'telegramStars', stars, reference: link };
    if (status === 'pending') return { status: 'pending', provider: 'telegramStars', stars };
    throw new Error(`invoice ${status}`);
  }
  if (pay_().demoSimulate) return simulated('telegramStars', { stars });
  throw new Error('Telegram Stars not configured');
}

/* ----------------------------------------------------------------------------- TON Connect */
async function payTon({ cfg, amount }) {
  const ton = toTon(amount);
  const nano = String(Math.round(ton * 1e9));
  const TC = globalThis.TON_CONNECT_UI;
  if (TC && cfg.manifestUrl && cfg.recipientAddress) {
    const ui = globalThis.__novaTonUI || (globalThis.__novaTonUI = new TC.TonConnectUI({ manifestUrl: cfg.manifestUrl }));
    if (!ui.account) await ui.connectWallet();
    const result = await ui.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + (cfg.validSeconds || 600),
      messages: [{ address: cfg.recipientAddress, amount: nano }],
    });
    return { status: 'paid', provider: 'tonConnect', ton, reference: result?.boc || null };
  }
  if (pay_().demoSimulate) return simulated('tonConnect', { ton });
  throw new Error('TON Connect not configured');
}

/* ---------------------------------------------------------------------------------- Stripe */
async function payStripe({ cfg, amount, currency, order }) {
  const stash = () => { try { localStorage.setItem(`${config.data.persistNamespace}:pendingOrder`, JSON.stringify(order || {})); } catch { /* ignore */ } };
  if (cfg.mode === 'paymentLink' && cfg.paymentLinkUrl) {
    stash(); location.href = cfg.paymentLinkUrl;
    return { status: 'redirect', provider: 'stripe' };
  }
  if (cfg.mode === 'checkout' && cfg.checkoutUrl) {
    const res = await fetch(cfg.checkoutUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, amount, currency }),
    });
    if (!res.ok) throw new Error(`checkout endpoint ${res.status}`);
    const url = (await res.json()).url;
    if (!url) throw new Error('no checkout url returned');
    stash(); location.href = url;
    return { status: 'redirect', provider: 'stripe' };
  }
  if (pay_().demoSimulate) return simulated('stripe');
  throw new Error('Stripe not configured');
}

export default { enabledMethods, methodById, toStars, toTon, isProviderReady, pay };
