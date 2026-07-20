/**
 * Nova Kit — Central Configuration
 * =================================
 * This is the ONE file you edit to make the kit your own. Almost everything a developer
 * needs to change to match their own project lives here: brand, colours, typography,
 * currency, tax/shipping, promo codes, payment methods, enabled features, navigation, the
 * default language, and where data comes from.
 *
 * Nothing in the pages hardcodes these values — they all read from this config, so editing
 * here re-skins and re-scopes the whole app. Visual tokens also live in
 * `assets/css/tokens.css`; the `theme` block below overrides the key ones at runtime.
 *
 * Author: unusdon
 */

export const config = {
  /* ---- Brand -------------------------------------------------------------------------- */
  brand: {
    name: 'Nova Store',        // full name shown in the app bar / about
    shortName: 'Nova',         // compact name (badges, titles)
    tagline: 'Shop smarter, right inside chat',
    logoEmoji: '🛍️',           // quick logo; set logoSvg to use custom artwork instead
    logoSvg: null,             // e.g. '<svg ...>...</svg>' — overrides logoEmoji when set
    author: 'unusdon',
    supportUrl: '',            // optional external help/support link
  },

  /* ---- Theme (maps into CSS tokens at runtime) ---------------------------------------- */
  theme: {
    colorScheme: 'light',      // 'auto' | 'light' | 'dark' — Telegram-native white default (dark stays on the toggle)
    allowUserToggle: true,     // show the Black/White (dark/light) toggle in the UI
    // Leave `accent`/`accentContrast` null to use the theme-optimised mint greens in
    // tokens.css (bright on dark, deeper on light). Set a hex to FORCE your own brand
    // colour across BOTH themes.
    accent: null,              // e.g. '#00E676'
    accentContrast: null,      // e.g. '#05271A'
    radius: 16,                // base corner radius in px
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    followTelegramTheme: true, // sync background/text colours with the user's Telegram theme
  },

  /* ---- Localisation -------------------------------------------------------------------- */
  locale: {
    default: 'en',
    available: ['en', 'es', 'ar'],
    rtlLocales: ['ar'],
  },

  /* ---- Currency & formatting ---------------------------------------------------------- */
  currency: {
    code: 'USD',
    symbol: '$',
    position: 'before',        // 'before' => $9.99, 'after' => 9.99$
    decimals: 2,
    thousands: ',',
    decimal: '.',
  },

  /* ---- Commerce rules ----------------------------------------------------------------- */
  commerce: {
    taxRate: 0.08,             // 8%
    shippingFlat: 9.99,        // charged when the cart has physical items
    freeShippingThreshold: 150,// subtotal at/above which shipping is free (0 to disable)
    maxQtyPerItem: 10,
    enablePromo: true,
    promoCodes: {
      SAVE20:    { type: 'percentage', value: 20,   label: '20% off' },
      WELCOME10: { type: 'percentage', value: 10,   label: '10% off your first order' },
      FREESHIP:  { type: 'fixed',      value: 9.99, label: 'Free shipping' },
    },
  },

  /* ---- Feature flags (toggle whole areas on/off) -------------------------------------- */
  features: {
    onboarding: true,
    search: true,
    categories: true,
    wishlist: true,
    reviews: true,
    ratings: true,
    digitalProducts: true,
    promo: true,
    addresses: true,
    paymentMethods: true,
    notifications: true,
    languageSwitcher: true,
    admin: true,
  },

  /* ---- Payments ----------------------------------------------------------------------- *
   * Three real rails are wired through `assets/js/core/payments.js`:
   *   • Telegram Stars (XTR) — Telegram's native in-app currency
   *   • TON Connect         — pay on-chain from any TON wallet
   *   • Stripe              — hosted Checkout / Payment Link (card, where you offer it)
   * Plus a simple Cash-on-Delivery / manual option.
   *
   * Everything below is safe to keep in the client (endpoints + PUBLISHABLE values only —
   * never a secret key). Leave a provider's fields blank to run it in demo mode: with
   * `demoSimulate: true` an unconfigured provider resolves as a successful test payment so
   * the storefront always completes. Fill the fields in to go live.
   * -------------------------------------------------------------------------------------- */
  payments: {
    // Checkout methods in display order. `provider` links to a handler in core/payments.js.
    methods: [
      { id: 'stars',  provider: 'telegramStars', label: 'Telegram Stars',   icon: '⭐', enabled: true, note: 'Pay in-app with Stars' },
      { id: 'ton',    provider: 'tonConnect',    label: 'TON',              icon: '💎', enabled: true, note: 'Pay from your TON wallet' },
      { id: 'stripe', provider: 'stripe',        label: 'Card',             icon: '💳', enabled: true, note: 'Visa, Mastercard, Amex' },
      { id: 'cod',    provider: 'manual',        label: 'Cash on Delivery', icon: '💵', enabled: true, note: 'Pay when your order arrives' },
    ],

    providers: {
      // Telegram Stars — your BOT BACKEND creates an invoice link (Bot API `createInvoiceLink`
      // with currency 'XTR') and returns it; the app opens it via WebApp.openInvoice().
      telegramStars: {
        enabled: true,
        createInvoiceUrl: '',   // POST { order, amount, stars } -> { invoiceLink }  (your backend)
        starsPerUnit: 50,       // demo conversion: Stars per 1 unit of store currency (≈ 50 XTR = $1)
      },

      // TON Connect — connect any TON wallet and pay on-chain. Requires the TON Connect UI
      // script in checkout.html (a hint tag is included, commented out) and a public manifest.
      tonConnect: {
        enabled: true,
        manifestUrl: '',        // https URL to your tonconnect-manifest.json (sample ships at the kit root)
        recipientAddress: '',   // the TON wallet that receives payments
        tonPerUnit: 0.25,       // demo conversion: TON per 1 unit of store currency
        validSeconds: 600,      // how long a payment request stays valid
      },

      // Stripe — hosted, so no card data ever touches your app.
      //   mode 'checkout':    your backend creates a Checkout Session and returns { url }.
      //   mode 'paymentLink': redirect straight to a fixed Stripe Payment Link.
      stripe: {
        enabled: true,
        mode: 'checkout',       // 'checkout' | 'paymentLink'
        publishableKey: '',     // pk_live_… (publishable only — the secret key stays on your server)
        checkoutUrl: '',        // POST { order, amount, currency } -> { url }  (mode: 'checkout')
        paymentLinkUrl: '',     // https://buy.stripe.com/…                      (mode: 'paymentLink')
        supportedCountries: [], // ISO codes where you offer Stripe; empty = everywhere ("where supported")
      },
    },

    // When a provider isn't configured (or its SDK / Telegram isn't present), simulate a
    // successful payment so the demo always completes. Set false to require real config.
    demoSimulate: true,
  },

  /* ---- Bottom navigation (config-driven) ---------------------------------------------- */
  nav: {
    tabs: [
      { id: 'home',     label: 'Home',     icon: 'home',    href: 'index.html' },
      { id: 'catalog',  label: 'Shop',     icon: 'grid',    href: 'catalog.html' },
      { id: 'wishlist', label: 'Wishlist', icon: 'heart',   href: 'wishlist.html' },
      { id: 'orders',   label: 'Orders',   icon: 'bag',     href: 'orders.html' },
      { id: 'profile',  label: 'Profile',  icon: 'user',    href: 'profile.html' },
    ],
  },

  /* ---- Data source -------------------------------------------------------------------- */
  data: {
    source: 'mock',            // 'mock' (bundled catalog + localStorage) | 'api'
    apiBaseUrl: '',            // used when source === 'api'
    persistNamespace: 'nova',  // localStorage key prefix
  },

  /* ---- Telegram integration ----------------------------------------------------------- */
  telegram: {
    enabled: true,
    expand: true,
    haptics: true,
    closingConfirmation: true,
  },
};

export default config;
