/**
 * Nova Kit — Wallet transactions store
 * A single source of truth for wallet activity, shared by the Wallet, Transactions,
 * Transaction-detail, Send, Withdraw, and Payment-request pages. Persisted under
 * `nova:transactions`; balance is derived from the signed amounts.
 */
import { config } from '../config.js';

const KEY = `${config.data.persistNamespace}:transactions`;

/* type → { icon, label } for display. amount is signed (+in / -out). */
export const TX_TYPES = {
  topup:    { icon: '⬆️', label: 'Top-up' },
  cashback: { icon: '🎁', label: 'Cashback' },
  purchase: { icon: '🛍️', label: 'Purchase' },
  refund:   { icon: '↩️', label: 'Refund' },
  receive:  { icon: '📥', label: 'Received' },
  send:     { icon: '📤', label: 'Sent' },
  withdraw: { icon: '🏦', label: 'Withdrawal' },
  request:  { icon: '🧾', label: 'Payment request' },
};

const DEMO = [
  { id: 'TX-24071', type: 'cashback', title: 'Cashback · order NV-1001', amount: 12.0, status: 'completed', date: '2024-07-03T12:10:00Z', method: 'Store credit', reference: 'CB-8841' },
  { id: 'TX-24070', type: 'receive', title: 'From @amara', amount: 50.0, status: 'completed', date: '2024-07-02T16:30:00Z', method: 'Wallet transfer', reference: 'TR-5521', counterparty: '@amara' },
  { id: 'TX-24069', type: 'purchase', title: 'Order NV-0998', amount: -42.0, status: 'completed', date: '2024-06-30T09:20:00Z', method: 'Wallet balance', reference: 'OR-0998' },
  { id: 'TX-24068', type: 'topup', title: 'Top-up · Visa •••• 4242', amount: 100.0, status: 'completed', date: '2024-06-28T11:00:00Z', method: 'Visa •••• 4242', reference: 'TP-3390' },
  { id: 'TX-24067', type: 'send', title: 'To @liamb', amount: -30.0, status: 'completed', date: '2024-06-25T18:45:00Z', method: 'Wallet transfer', reference: 'TR-5510', counterparty: '@liamb' },
  { id: 'TX-24066', type: 'refund', title: 'Refund · Terra Field Jacket', amount: 24.0, status: 'completed', date: '2024-06-22T14:05:00Z', method: 'Store credit', reference: 'RF-2201' },
  { id: 'TX-24065', type: 'withdraw', title: 'Withdraw to bank', amount: -60.0, status: 'pending', date: '2024-06-20T08:15:00Z', method: 'Bank ••6789', reference: 'WD-1180' },
];

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('nova:store', { detail: { key: KEY } }));
}

export function getTransactions() {
  let list = read();
  if (!list) { list = DEMO.slice(); write(list); }
  return list;
}
export function getTransaction(id) {
  return getTransactions().find((t) => t.id === id) || null;
}
export function walletBalance() {
  return getTransactions().filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
}
export function addTransaction(tx) {
  const list = getTransactions();
  const seq = 24072 + list.length;
  const record = { id: `TX-${seq}`, status: 'completed', date: new Date().toISOString(), method: 'Wallet balance', reference: `RF-${seq}`, ...tx };
  list.unshift(record);
  write(list);
  return record;
}

export default { TX_TYPES, getTransactions, getTransaction, walletBalance, addTransaction };
