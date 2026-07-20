/**
 * Nova Kit — Bundled demo catalog
 * ===============================
 * Sample categories and products used by the mock data adapter. Images are generated as
 * SVG placeholders (emoji + brand colour) so the kit ships no third-party imagery.
 * Replace this file, or switch `config.data.source` to 'api', to use your own catalogue.
 */

export const categories = [
  { id: 'electronics', name: 'Electronics', icon: '📱', type: 'physical',
    subcategories: [
      { id: 'phones', name: 'Phones', count: 24 },
      { id: 'audio', name: 'Audio', count: 18 },
      { id: 'wearables', name: 'Wearables', count: 12 },
    ] },
  { id: 'fashion', name: 'Fashion', icon: '👕', type: 'physical',
    subcategories: [
      { id: 'men', name: 'Men', count: 40 },
      { id: 'women', name: 'Women', count: 52 },
      { id: 'accessories', name: 'Accessories', count: 30 },
    ] },
  { id: 'home', name: 'Home', icon: '🏠', type: 'physical',
    subcategories: [
      { id: 'kitchen', name: 'Kitchen', count: 22 },
      { id: 'decor', name: 'Decor', count: 19 },
    ] },
  { id: 'software', name: 'Software', icon: '💾', type: 'digital',
    subcategories: [
      { id: 'apps', name: 'Apps', count: 16 },
      { id: 'games', name: 'Games', count: 28 },
    ] },
  { id: 'ebooks', name: 'E-books', icon: '📚', type: 'digital',
    subcategories: [
      { id: 'fiction', name: 'Fiction', count: 34 },
      { id: 'learning', name: 'Learning', count: 41 },
    ] },
];

export const products = [
  {
    id: 'p-aurora-buds', name: 'Aurora Wireless Earbuds', slug: 'aurora-earbuds',
    type: 'physical', categoryId: 'electronics', subcategoryId: 'audio',
    price: 89.0, compareAtPrice: 119.0, rating: 4.7, reviewCount: 214,
    inStock: true, stock: 37, badges: ['Bestseller'],
    emoji: '🎧', color: '#5B6CFF',
    shortDescription: 'Crisp sound, active noise cancelling, 30-hour battery.',
    description: 'Aurora earbuds deliver rich, balanced audio with adaptive noise cancelling and a compact charging case that keeps you powered for up to 30 hours.',
    variants: [{ id: 'black', label: 'Black' }, { id: 'white', label: 'White' }],
  },
  {
    id: 'p-pulse-watch', name: 'Pulse Smart Watch', slug: 'pulse-watch',
    type: 'physical', categoryId: 'electronics', subcategoryId: 'wearables',
    price: 149.0, compareAtPrice: null, rating: 4.5, reviewCount: 128,
    inStock: true, stock: 20, badges: ['New'],
    emoji: '⌚', color: '#1FB57A',
    shortDescription: 'Health tracking, always-on display, 7-day battery.',
    description: 'Track workouts, sleep and heart rate on a bright always-on display, with a battery that lasts a full week on a single charge.',
    variants: [{ id: '42mm', label: '42mm' }, { id: '46mm', label: '46mm' }],
  },
  {
    id: 'p-nimbus-phone', name: 'Nimbus 5G Phone', slug: 'nimbus-phone',
    type: 'physical', categoryId: 'electronics', subcategoryId: 'phones',
    price: 699.0, compareAtPrice: 799.0, rating: 4.8, reviewCount: 356,
    inStock: true, stock: 12, badges: ['Bestseller'],
    emoji: '📱', color: '#3AA0FF',
    shortDescription: 'Triple camera, 5G, 120Hz OLED display.',
    description: 'A flagship experience with a pro-grade triple camera, blazing 5G and a silky 120Hz OLED screen in a slim aluminium frame.',
    variants: [{ id: '128', label: '128GB' }, { id: '256', label: '256GB' }],
  },
  {
    id: 'p-terra-jacket', name: 'Terra Field Jacket', slug: 'terra-jacket',
    type: 'physical', categoryId: 'fashion', subcategoryId: 'men',
    price: 74.0, compareAtPrice: 99.0, rating: 4.4, reviewCount: 87,
    inStock: true, stock: 45, badges: [],
    emoji: '🧥', color: '#F5A524',
    shortDescription: 'Water-resistant, insulated, everyday jacket.',
    description: 'A durable water-resistant jacket with light insulation and plenty of pockets — built for everyday wear in changing weather.',
    variants: [{ id: 's', label: 'S' }, { id: 'm', label: 'M' }, { id: 'l', label: 'L' }],
  },
  {
    id: 'p-luna-bag', name: 'Luna Crossbody Bag', slug: 'luna-bag',
    type: 'physical', categoryId: 'fashion', subcategoryId: 'accessories',
    price: 45.0, compareAtPrice: null, rating: 4.6, reviewCount: 63,
    inStock: true, stock: 58, badges: ['New'],
    emoji: '👜', color: '#F0416C',
    shortDescription: 'Compact, vegan leather, adjustable strap.',
    description: 'A minimalist crossbody bag in soft vegan leather with an adjustable strap and just enough room for the essentials.',
    variants: [{ id: 'tan', label: 'Tan' }, { id: 'noir', label: 'Noir' }],
  },
  {
    id: 'p-brew-kettle', name: 'Brew Electric Kettle', slug: 'brew-kettle',
    type: 'physical', categoryId: 'home', subcategoryId: 'kitchen',
    price: 39.0, compareAtPrice: 49.0, rating: 4.3, reviewCount: 51,
    inStock: false, stock: 0, badges: [],
    emoji: '🫖', color: '#8B5CF6',
    shortDescription: 'Fast-boil, precise temperature, auto shut-off.',
    description: 'Boil water in under three minutes with precise temperature control and automatic shut-off for peace of mind.',
    variants: [],
  },
  {
    id: 'p-photon-suite', name: 'Photon Photo Suite', slug: 'photon-suite',
    type: 'digital', categoryId: 'software', subcategoryId: 'apps',
    price: 59.0, compareAtPrice: 89.0, rating: 4.9, reviewCount: 402,
    inStock: true, stock: 999, badges: ['Bestseller'],
    emoji: '🎨', color: '#5B6CFF',
    shortDescription: 'Pro photo editor — lifetime licence.',
    description: 'A complete photo-editing suite with layers, presets and AI-assisted tools, delivered instantly as a lifetime licence key.',
    // Key-delivered: the buyer gets a licence key (admin → Digital keys) plus the installer download.
    digital: {
      platform: 'Windows / macOS', format: 'Licence key', license: 'Lifetime, 1 device',
      assets: [{ kind: 'link', label: 'Download installer', url: 'https://example.com/photon-suite-setup.zip' }],
    },
    variants: [],
  },
  {
    id: 'p-void-runner', name: 'Void Runner (Game)', slug: 'void-runner',
    type: 'digital', categoryId: 'software', subcategoryId: 'games',
    price: 24.99, compareAtPrice: null, rating: 4.6, reviewCount: 175,
    inStock: true, stock: 999, badges: ['New'],
    emoji: '🎮', color: '#1FB57A',
    shortDescription: 'Fast-paced arcade runner — instant key.',
    description: 'Dash through neon worlds in this fast-paced arcade runner. Delivered instantly as a redeemable game key.',
    digital: { platform: 'PC', format: 'Game key', license: 'Single activation' },
    variants: [],
  },
  {
    id: 'p-craft-guide', name: 'The Craft of Code', slug: 'craft-of-code',
    type: 'digital', categoryId: 'ebooks', subcategoryId: 'learning',
    price: 14.99, compareAtPrice: 19.99, rating: 4.7, reviewCount: 96,
    inStock: true, stock: 999, badges: [],
    emoji: '📘', color: '#3AA0FF',
    shortDescription: 'A practical guide to clean software — PDF + EPUB.',
    description: 'A hands-on guide to writing clean, maintainable software, with real examples. Delivered as DRM-free PDF and EPUB.',
    // File-delivered (no key): the buyer simply downloads these assets.
    digital: {
      platform: 'Any reader', format: 'PDF + EPUB', license: 'Personal use',
      assets: [
        { kind: 'link', label: 'The Craft of Code (PDF)', url: 'https://example.com/craft-of-code.pdf' },
        { kind: 'link', label: 'The Craft of Code (EPUB)', url: 'https://example.com/craft-of-code.epub' },
      ],
    },
    variants: [],
  },
];

export default { categories, products };
