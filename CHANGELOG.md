# Changelog

All notable changes to **Nova Store — Telegram Mini App Store Kit** are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-07-15

Initial release.

### Storefront (43 pages)
- Home dashboard, catalog (2-per-row grid, filters, sort), product detail with gallery,
  options/variants, quantity, specs, reviews summary and "frequently bought together".
- Full cart → checkout → order-success flow with promo codes, tax/shipping rules and order notes.
- Orders list, order detail, live order tracking, guest track-order lookup, returns & refunds.
- Wishlist, recently viewed, product comparison, product Q&A.
- Wallet, transactions, send/receive, payment requests (with QR), withdrawals.
- Gift cards (buy & redeem, with QR), rewards/loyalty points, referrals, coupons.
- Downloads for digital products — attached files and/or download links, plus licence keys.
- Profile (with avatar chooser), personal information (photo upload), addresses, payment methods,
  settings, notifications, language switcher, help center, support tickets, legal, about.
- Onboarding, a styled 404, and a component style-guide page.

### Admin dashboard (34 pages)
- Dashboard with clickable KPIs and a weekly sales chart, full order management, returns,
  abandoned carts.
- Full-page product editor with a multi-image gallery, inventory, categories, collections,
  and digital keys (paste or import a `.txt` of keys).
- Customers (with loyalty & staff status), Q&A moderation, support threads, content/banners.
- Analytics (top selling products), reports, marketing, discounts, gift cards, loyalty tiers,
  referrals, broadcasts, message templates, activity/audit log.
- Wallets (credit/debit adjustments), transactions, payouts, payments, shipping zones,
  integrations, staff and store settings.

### Platform
- **Config-first**: brand, colours, currency, tax/shipping, promo codes, feature flags,
  navigation, payments and data source all live in `assets/js/config.js`.
- **Theming**: dark-first mint palette with a full light theme and a Black/White toggle,
  driven by CSS design tokens; optionally follows the user's Telegram theme.
- **Localization**: file-per-language i18n shipping English, Spanish and Arabic (RTL);
  add a language by dropping in one file.
- **Payments**: Telegram Stars (XTR), TON Connect and Stripe wired through a single guarded
  adapter, plus Cash on Delivery — with a demo-simulate fallback so the storefront completes
  with zero configuration.
- **Data**: bundled catalog + `localStorage` mock adapter by default, or point `data.source`
  at your own API.
- **Telegram**: guarded WebApp adapter (haptics, back button, theme, invoices) with graceful
  browser fallbacks so every page is testable outside Telegram.
- **Build-free**: pure HTML, CSS and vanilla ES modules — no framework, bundler or dependencies.
- Generated SVG placeholder imagery throughout — no third-party image assets, fully resale-safe.
- Includes a no-cache dev server and one-click local preview launchers for Windows and macOS,
  and self-contained HTML documentation under `documentation/`.

---

<!--
Template for future releases — copy this block above when you ship an update:

## [1.1.0] — YYYY-MM-DD
### Added
- …
### Changed
- …
### Fixed
- …
### Removed
- …
-->

[1.0.0]: #100--2026-07-15
