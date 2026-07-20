#!/bin/bash
# ============================================================
#  Nova Kit - one-click local server (macOS / Linux)
#  Double-click (macOS) or run `./START-SERVER.command`.
#  The kit uses JavaScript modules, which browsers block when a
#  page is opened directly as a file, so it needs a local server.
# ============================================================
cd "$(dirname "$0")" || exit 1
PORT=8000
echo ""
echo "  Starting Nova Store at http://localhost:$PORT"
echo "  Keep this window open while you browse. Press Ctrl+C to stop."
echo ""
( sleep 1; (open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null) ) &

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then
  npx --yes serve -l "$PORT"
else
  echo "  Could not find Python or Node.js. Install one and try again."
  read -r
fi
