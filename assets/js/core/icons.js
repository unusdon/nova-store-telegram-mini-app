/**
 * Nova Kit — Icon set
 * Original inline SVG icons (24×24, stroke-based, currentColor). Add your own by extending
 * the map. Usage: icon('heart', { size: 20, filled: true }).
 */
const paths = {
  home:   '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  grid:   '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  heart:  '<path d="M12 20.5C12 20.5 3.5 14.6 3.5 8.9 3.5 6.2 5.6 4 8.3 4 10 4 11.4 5 12 6.2 12.6 5 14 4 15.7 4 18.4 4 20.5 6.2 20.5 8.9 20.5 14.6 12 20.5 12 20.5Z"/>',
  bag:    '<path d="M5 8h14v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>',
  user:   '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  back:   '<path d="M15 5 8 12l7 7"/>',
  cart:   '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 8H6"/>',
  star:   '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>',
  plus:   '<path d="M12 5v14M5 12h14"/>',
  minus:  '<path d="M5 12h14"/>',
  close:  '<path d="M6 6l12 12M18 6 6 18"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  bell:   '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.5 21a2 2 0 0 0 3 0"/>',
  map:    '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  card:   '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
  gear:   '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/>',
  globe:  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  help:   '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1-1.4 2M12 17h.01"/>',
  check:  '<path d="m5 12 4 4 10-10"/>',
  trash:  '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
  sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  moon:   '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  edit:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  box:    '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  chart:  '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7"/>',
  users:  '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><path d="M16 5a3.5 3.5 0 0 1 0 6.5M17.5 14.5c2.4.6 4 2.3 4 5"/>',
  tag:    '<path d="M20 12 12 20l-8-8V4h8z"/><circle cx="8" cy="8" r="1.4"/>',
  truck:  '<path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
  plug:   '<path d="M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0z"/><path d="M12 18v3"/>',
  info:   '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  gift:   '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8S9 3 7 5s5 3 5 3zM12 8s3-5 5-3-5 3-5 3z"/>',
  logout: '<path d="M15 5V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1"/><path d="M18 15l3-3-3-3M9 12h12"/>',
  send:   '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  image:  '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  key:    '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 8.3-8.3M16 5l3 3M14 7l2 2"/>',
  download: '<path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>',
  clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

export function icon(name, { size = 24, filled = false, stroke = 2, cls = '' } = {}) {
  const body = paths[name] || '';
  const fill = filled ? 'currentColor' : 'none';
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="${fill}" stroke="currentColor" stroke-width="${stroke}"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export default icon;
