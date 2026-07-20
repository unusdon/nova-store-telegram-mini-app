/**
 * Nova Kit — Admin demo data
 * ==========================
 * Sample merchant-side data (KPIs, customers, sales series) plus seeded demo orders so the
 * admin looks populated even before any customer places a real order. Real orders placed in
 * the storefront (localStorage) are merged in. Swap this for your API in production.
 */
import { dataService } from '../core/store.js';
import { products as catalogProducts } from '../data/catalog.js';

/* Deterministic demo customers. `points` drives their loyalty tier. */
export const demoCustomers = [
  { id: 'c-01', userId: '80421567', name: 'Amara Okafor', handle: '@amara', email: 'amara@example.com', phone: '+234 803 555 0112', orders: 12, spent: 1840.5, points: 1840, joined: '2024-02-11', lastActive: '2024-07-02', location: 'Lagos, NG', status: 'active' },
  { id: 'c-02', userId: '61209833', name: 'Liam Brooks', handle: '@liamb', email: 'liam.b@example.com', phone: '+44 7700 900311', orders: 5, spent: 620.0, points: 620, joined: '2024-05-03', lastActive: '2024-06-28', location: 'Leeds, UK', status: 'active' },
  { id: 'c-03', userId: '74558021', name: 'Sofia Marín', handle: '@sofiam', email: 'sofia.m@example.com', phone: '+34 612 34 56 78', orders: 8, spent: 1130.25, points: 1130, joined: '2024-03-27', lastActive: '2024-07-01', location: 'Madrid, ES', status: 'active' },
  { id: 'c-04', userId: '90833471', name: 'Kenji Tanaka', handle: '@kenji', email: 'kenji.t@example.com', phone: '+81 90 1234 5678', orders: 3, spent: 289.99, points: 290, joined: '2024-06-19', lastActive: '2024-06-20', location: 'Osaka, JP', status: 'banned' },
  { id: 'c-05', userId: '55712094', name: 'Noor Haddad', handle: '@noorh', email: 'noor.h@example.com', phone: '+962 7 9012 3456', orders: 15, spent: 2450.0, points: 2450, joined: '2023-12-08', lastActive: '2024-07-03', location: 'Amman, JO', status: 'active' },
];

/**
 * Team roster. `@sofiam` is deliberately also a customer (Sofia Marín) so the customer detail
 * sheet's "Staff" row has something to show — staff are matched to customers by handle.
 */
export const demoStaff = [
  { id: 's1', name: 'You', handle: '@owner', role: 'Owner', active: true },
  { id: 's2', name: 'Dana Whitfield', handle: '@dana', role: 'Manager', active: true },
  { id: 's3', name: 'Marco Ruiz', handle: '@marco', role: 'Support', active: true },
  { id: 's4', name: 'Sofia Marín', handle: '@sofiam', role: 'Fulfilment', active: true },
];

/* Loyalty tiers, ascending. Shared by the loyalty screen and the customer detail sheet. */
export const loyaltyTiers = [
  { name: 'Bronze', min: 0, perk: 'Standard earning', color: 'tint-orange' },
  { name: 'Silver', min: 500, perk: '1.25× points', color: 'tint-blue' },
  { name: 'Gold', min: 2000, perk: '1.5× points + free shipping', color: 'tint-orange' },
  { name: 'Platinum', min: 5000, perk: '2× points + early access', color: 'tint-purple' },
];

/** The highest tier a points balance qualifies for. */
export function tierFor(points, tiers = loyaltyTiers) {
  return [...tiers].reverse().find((t) => points >= t.min) || tiers[0];
}

/** Customers ranked by loyalty points — the loyalty screen's "Top members". */
export function getTopMembers(limit = 4) {
  return [...demoCustomers].sort((a, b) => b.points - a.points).slice(0, limit);
}

/** The staff record for a customer handle, or null if they aren't staff. */
export function staffFor(handle) {
  return demoStaff.find((s) => s.handle.toLowerCase() === String(handle).toLowerCase()) || null;
}

/* Seeded demo orders (shown alongside real ones). */
const demoOrders = [
  { id: 'NV-0912', number: 'NV-0912', createdAt: '2024-06-28T10:12:00Z', status: 'delivered',
    customer: 'Amara Okafor', total: 178.0, items: [{ name: 'Aurora Wireless Earbuds', qty: 2, price: 89 }] },
  { id: 'NV-0913', number: 'NV-0913', createdAt: '2024-06-29T14:40:00Z', status: 'shipped',
    customer: 'Liam Brooks', total: 149.0, items: [{ name: 'Pulse Smart Watch', qty: 1, price: 149 }] },
  { id: 'NV-0914', number: 'NV-0914', createdAt: '2024-06-30T09:05:00Z', status: 'paid',
    customer: 'Sofia Marín', total: 59.0, items: [{ name: 'Photon Photo Suite', qty: 1, price: 59 }] },
  { id: 'NV-0915', number: 'NV-0915', createdAt: '2024-07-01T18:22:00Z', status: 'pending',
    customer: 'Kenji Tanaka', total: 699.0, items: [{ name: 'Nimbus 5G Phone', qty: 1, price: 699 }] },
];

export function getAllOrders() {
  // Real (customer-placed) orders first, then the demo seed.
  const real = dataService.getOrders().map((o) => ({
    ...o, customer: o.address?.name || 'Guest',
  }));
  return [...real, ...demoOrders];
}

export function getOrderById(id) {
  return getAllOrders().find((o) => o.id === id) || null;
}

export function getStats() {
  const orders = getAllOrders();
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  return {
    revenue,
    orders: orders.length,
    products: catalogProducts.length,
    customers: demoCustomers.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    lowStock: catalogProducts.filter((p) => p.inStock && p.stock <= 15).length,
  };
}

/* 7-day sales series for the dashboard/analytics charts. */
export function getSalesSeries() {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [820, 610, 940, 1180, 760, 1520, 1340];
  return { labels, values };
}

/* Abandoned carts (demo). */
export const demoAbandoned = [
  { id: 'ab-01', customer: 'Amara Okafor', handle: '@amara', items: 2, value: 178.0, updated: '2024-07-03T14:20:00Z' },
  { id: 'ab-02', customer: 'Guest', handle: '—', items: 1, value: 699.0, updated: '2024-07-03T09:05:00Z' },
  { id: 'ab-03', customer: 'Sofia Marín', handle: '@sofiam', items: 3, value: 246.0, updated: '2024-07-02T18:40:00Z' },
];

/* License-key stock per digital product (demo). */
export const demoKeys = {
  'p-photon-suite': { name: 'Photon Photo Suite', available: 42, sold: 358, keys: ['PHTN-7F3K-9QX2', 'PHTN-2M8D-4RA1', 'PHTN-5T6P-1KZ9'] },
  'p-void-runner': { name: 'Void Runner (Game)', available: 8, sold: 175, keys: ['VOID-A1B2-C3D4', 'VOID-E5F6-G7H8'] },
  'p-craft-guide': { name: 'The Craft of Code', available: 999, sold: 96, keys: [] },
};

export function getTopProducts() {
  return [...catalogProducts]
    .map((p) => ({ ...p, sold: Math.round(p.reviewCount * 0.6) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
}

export default {
  demoCustomers, demoStaff, loyaltyTiers, tierFor, getTopMembers, staffFor,
  getAllOrders, getOrderById, getStats, getSalesSeries, getTopProducts,
};
