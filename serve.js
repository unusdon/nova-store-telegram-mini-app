/*
 * Nova Kit — zero-config no-cache dev server
 * =========================================
 * Serves this folder over HTTP with caching DISABLED, so every edit shows up on refresh
 * (no more "my change didn't appear" from a stale browser cache). Run: `node serve.js`
 * (START-SERVER.bat uses this automatically). For production, deploy the static files to
 * any host — this script is only for local preview.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = path.normalize(path.join(ROOT, pathname));

  // Prevent path traversal outside the served folder.
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1 style="font-family:sans-serif">404 – Not found</h1>');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      // Disable caching so edits always appear on reload.
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('\n  Nova Store  →  http://localhost:' + PORT + '   (no-cache dev server)');
  console.log('  Keep this window open while you browse. Press Ctrl+C to stop.\n');
});
