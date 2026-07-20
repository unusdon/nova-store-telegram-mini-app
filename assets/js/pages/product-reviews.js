/**
 * Nova Kit — Product reviews (faithful replica of the original reviews section)
 * Rating summary with per-star bars, review cards with a "helpful" action, and a
 * write-review bottom sheet (tap-to-rate + comment). Product id comes from ?id=.
 */
import { bootstrap } from '../app.js';
import { icon } from '../core/icons.js';
import { formatDate } from '../core/format.js';
import { dataService } from '../core/store.js';
import { esc, toast, bottomSheet } from '../core/ui.js';
import { haptic } from '../core/telegram.js';
import { bindThemeToggle } from '../components.js';

bootstrap();

const screen = document.getElementById('screen');
const id = new URLSearchParams(location.search).get('id');
let product = null;
let reviews = [];

function stars(rating, cls = '') {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => `<span class="star${i < full ? ' filled' : ''} ${cls}">★</span>`).join('');
}

/* Build a 5→1 star distribution that sums to the review count (weighted to the average). */
function distribution(avg, total) {
  const weights = avg >= 4.5 ? [0.68, 0.2, 0.07, 0.03, 0.02]
    : avg >= 4 ? [0.55, 0.28, 0.1, 0.04, 0.03] : [0.4, 0.3, 0.18, 0.08, 0.04];
  const counts = weights.map((w) => Math.round(w * total));
  const diff = total - counts.reduce((a, b) => a + b, 0);
  counts[0] += diff;
  return counts; // [5★, 4★, 3★, 2★, 1★]
}

function reviewCard(r) {
  return `<div class="review-item">
    <div class="review-header">
      <div class="reviewer-info">
        <span class="reviewer-name">${esc(r.author)}</span>
        <div class="review-rating">${stars(r.rating)}</div>
      </div>
      <span class="review-date">${formatDate(r.date)}</span>
    </div>
    <div class="review-comment">${esc(r.body)}</div>
    <div class="review-actions"><button class="helpful-btn" data-helpful>👍 Helpful (${r.helpful ?? Math.max(2, Math.round(r.rating * 3))})</button></div>
  </div>`;
}

function render() {
  const total = product.reviewCount;
  const dist = distribution(product.rating, total);
  const max = Math.max(...dist, 1);

  document.getElementById('appbar').innerHTML = `
    <header class="reviews-page-header"><div class="header-top">
      <a class="back-button" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="Back">${icon('back', { size: 24 })}</a>
      <h1 class="page-title">Reviews</h1>
      <span style="width:40px"></span>
    </div></header>`;

  screen.innerHTML = `
    <div class="reviews-section">
      <div class="reviews-header">
        <h3 class="section-title">Customer Reviews</h3>
        <button class="write-review-btn" id="writeBtn">Write Review</button>
      </div>

      <div class="reviews-summary"><div class="rating-breakdown">
        <div class="overall-rating">
          <span class="rating-number">${product.rating.toFixed(1)}</span>
          <div class="rating-stars-large">${stars(product.rating)}</div>
          <span class="total-reviews">${total} reviews</span>
        </div>
        <div class="rating-bars">
          ${dist.map((count, i) => `<div class="rating-bar">
            <span class="bar-label">${5 - i}★</span>
            <div class="bar-fill"><div class="bar-progress" style="width:${Math.round((count / max) * 100)}%"></div></div>
            <span class="bar-count">${count}</span>
          </div>`).join('')}
        </div>
      </div></div>

      <div class="reviews-list" id="list">${reviews.map(reviewCard).join('')}</div>
    </div>`;

  document.getElementById('writeBtn').addEventListener('click', openWrite);
  screen.querySelectorAll('[data-helpful]').forEach((b) => b.addEventListener('click', () => { haptic('light'); toast('Thanks for your feedback'); }));
  bindThemeToggle();
}

function openWrite() {
  let rating = 5;
  const form = `
    <div class="star-picker" id="picker">
      ${Array.from({ length: 5 }, (_, i) => `<button data-star="${i + 1}" class="${i < 5 ? 'on' : ''}">★</button>`).join('')}
    </div>
    <div class="field"><label class="field__label">Your review</label>
      <textarea class="textarea" id="rc" placeholder="Share your experience with this product"></textarea></div>
    <button class="btn btn--block" id="submit">Submit review</button>`;
  const sheet = bottomSheet({ title: 'Write a review', content: form });
  const btns = sheet.el.querySelectorAll('[data-star]');
  btns.forEach((b) => b.addEventListener('click', () => {
    rating = +b.dataset.star;
    btns.forEach((x, i) => x.classList.toggle('on', i < rating));
    haptic('selection');
  }));
  sheet.el.querySelector('#submit').addEventListener('click', () => {
    const body = sheet.el.querySelector('#rc').value.trim();
    if (!body) { toast('Please write a few words', { kind: 'danger' }); return; }
    reviews.unshift({ id: 'new', author: 'You', rating, date: new Date().toISOString(), body });
    haptic('success'); sheet.close(); toast('Review submitted (demo)', { kind: 'success' }); render();
  });
}

(async function init() {
  product = await dataService.getProduct(id);
  if (!product) {
    document.getElementById('appbar').innerHTML = `<header class="reviews-page-header"><div class="header-top">
      <a class="back-button" href="catalog.html">${icon('back', { size: 24 })}</a><h1 class="page-title">Reviews</h1><span style="width:40px"></span></div></header>`;
    screen.innerHTML = `<div class="empty-state"><div class="empty-state__emoji">🧐</div><h3>Product not found</h3></div>`;
    return;
  }
  reviews = await dataService.getReviews(product.id);
  render();
})();
