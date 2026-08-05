#!/usr/bin/env bash
# RYVON server deploy (run as root or ryvon on the VPS)
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ryvon/RYVON}"
API_PORT="${API_PORT:-5002}"
LOG_FILE="${LOG_FILE:-/home/ryvon/ryvon-api.log}"

cd "$APP_DIR"
echo "==> git pull"
git pull origin main

echo "==> server deps"
cd "$APP_DIR/server"
npm install --omit=dev --no-audit --maxsockets=1

mkdir -p data uploads/products
chown -R ryvon:ryvon "$APP_DIR/server/data" "$APP_DIR/server/uploads" 2>/dev/null || true
touch "$LOG_FILE"
chown ryvon:ryvon "$LOG_FILE" 2>/dev/null || true

echo "==> restart API on :$API_PORT"
pkill -f "$APP_DIR/server/index.js" 2>/dev/null || true
sleep 1
cd "$APP_DIR/server"
sudo -u ryvon bash -lc "PORT=$API_PORT nohup node index.js >> '$LOG_FILE' 2>&1 &" 2>/dev/null \
  || PORT="$API_PORT" nohup node index.js >> "$LOG_FILE" 2>&1 &
sleep 1
curl -s "http://127.0.0.1:$API_PORT/api/health" || true
echo
echo "==> API done. Frontend: build on Mac then upload zip to public_html (server RAM is low for vite build)."
echo "    Or from Mac: npm run build --prefix client && scp/upload dist"
