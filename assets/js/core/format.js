/**
 * Nova Kit — Formatting helpers
 * All currency rendering goes through `formatPrice()` so it obeys `config.currency`.
 */
import { config } from '../config.js';

export function formatPrice(amount) {
  const { symbol, position, decimals, thousands, decimal } = config.currency;
  const fixed = Number(amount || 0).toFixed(decimals);
  let [int, frac] = fixed.split('.');
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const num = frac ? `${int}${decimal}${frac}` : int;
  return position === 'after' ? `${num}${symbol}` : `${symbol}${num}`;
}

export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default { formatPrice, formatDate };
