@echo off
REM ============================================================
REM  Nova Kit - one-click local server (Windows)
REM  Double-click this file to run the kit in your browser.
REM  Uses a no-cache dev server so your edits always show up.
REM ============================================================
cd /d "%~dp0"
set PORT=8000
echo.
echo   Starting Nova Store at http://localhost:%PORT%
echo   Keep this window open while you browse. Close it to stop.
echo.
start "" "http://localhost:%PORT%"

REM Prefer the bundled no-cache Node server; fall back to Python, then npx serve.
where node >nul 2>nul
if %errorlevel%==0 (
  node serve.js
  goto :eof
)
python -m http.server %PORT% 2>nul
if %errorlevel% neq 0 py -m http.server %PORT% 2>nul
if %errorlevel% neq 0 npx --yes serve -l %PORT%
if %errorlevel% neq 0 (
  echo.
  echo   Could not find Node or Python.
  echo   Install Node from https://nodejs.org then double-click this file again.
  pause
)
