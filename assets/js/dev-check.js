/*
 * Nova Kit — Dev environment check (classic script, NOT a module)
 * ==============================================================
 * The kit uses native ES modules, which browsers refuse to load over the file:// protocol.
 * If someone opens a page by double-clicking it, the module scripts silently fail and the
 * page looks blank. This tiny classic script always runs (classic scripts DO load from
 * file://) and shows friendly instructions instead of a blank screen. Safe to keep in
 * production — it does nothing when served over http(s).
 */
(function () {
  if (location.protocol !== 'file:') return;

  var html =
    '<div style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;' +
    'justify-content:center;padding:24px;background:#0F0F0F;color:#fff;' +
    "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;\">" +
      '<div style="max-width:460px;text-align:center;">' +
        '<div style="font-size:44px;margin-bottom:8px;">🛠️</div>' +
        '<h1 style="font-size:22px;margin:0 0 8px;">Run this on a local server</h1>' +
        '<p style="color:#8E8E93;line-height:1.5;margin:0 0 16px;">' +
          'This kit uses JavaScript modules, which browsers block when a file is opened ' +
          'directly (file://). <b style="color:#fff;">Double-click START-SERVER.bat</b> ' +
          '(Windows) or START-SERVER.command (Mac) in this folder — or run one of these:</p>' +
        '<div style="text-align:left;background:#1A1A1A;border:1px solid #3A3A3C;' +
          'border-radius:12px;padding:14px 16px;font-family:ui-monospace,Menlo,Consolas,monospace;' +
          'font-size:13px;color:#00E676;line-height:1.9;">' +
          'python -m http.server 8000<br>' +
          '<span style="color:#636366;">— or —</span><br>' +
          'npx serve<br>' +
          '<span style="color:#636366;">— or use the VS Code &ldquo;Live Server&rdquo; extension —</span>' +
        '</div>' +
        '<p style="color:#8E8E93;margin:16px 0 0;font-size:13px;">' +
          'Then visit <b style="color:#fff;">http://localhost:8000</b></p>' +
      '</div>' +
    '</div>';

  function show() {
    var el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el);
  }
  if (document.body) show();
  else document.addEventListener('DOMContentLoaded', show);
})();
