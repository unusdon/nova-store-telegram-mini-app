/**
 * English (en) — Nova Kit locale
 * ==============================
 * To add a new language: copy this file to `xx.js`, translate the values (keep the keys),
 * register it in `../index.js`, and add its code to `config.locale.available`.
 * For a right-to-left language, also add its code to `config.locale.rtlLocales`.
 */
export default {
  code: 'en',
  name: 'English',
  strings: {
    // Generic
    'app.loading': 'Loading…',
    'action.add_to_cart': 'Add to cart',
    'action.buy_now': 'Buy now',
    'action.checkout': 'Checkout',
    'action.continue': 'Continue',
    'action.apply': 'Apply',
    'action.remove': 'Remove',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.see_all': 'See all',
    'action.back': 'Back',

    // Navigation
    'nav.home': 'Home',
    'nav.catalog': 'Shop',
    'nav.wishlist': 'Wishlist',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',

    // Home
    'home.greeting': 'Welcome back',
    'home.search_placeholder': 'Search products',
    'home.categories': 'Categories',
    'home.featured': 'Featured',
    'home.trending': 'Trending now',
    'home.new_arrivals': 'New arrivals',
    'home.balance_trend': 'vs last week',

    // Product
    'product.reviews': '{count} reviews',
    'product.in_stock': 'In stock',
    'product.out_of_stock': 'Out of stock',
    'product.description': 'Description',
    'product.related': 'You may also like',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_hint': 'Browse the shop and add items you love.',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.tax': 'Tax',
    'cart.discount': 'Discount',
    'cart.total': 'Total',
    'cart.free': 'Free',
    'cart.promo_placeholder': 'Promo code',
    'cart.promo_invalid': 'Invalid promo code',

    // Orders
    'orders.title': 'Orders',
    'orders.empty': 'No orders yet',
    'order.status.pending': 'Pending',
    'order.status.paid': 'Paid',
    'order.status.shipped': 'Shipped',
    'order.status.delivered': 'Delivered',
    'order.status.cancelled': 'Cancelled',

    // Profile
    'profile.title': 'Profile',
    'profile.addresses': 'Addresses',
    'profile.payment_methods': 'Payment methods',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.help': 'Help & Support',
    'profile.about': 'About',
  },
};
