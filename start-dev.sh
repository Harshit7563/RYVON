#!/bin/bash
set -e
ROOT="/Users/harshit/RYVON"
API_LOG="/tmp/ryvon-api.log"
VITE_LOG="/tmp/ryvon-vite.log"

mkdir -p "$ROOT"
cd "$ROOT"

# free ports
for p in 5001 5173; do
  pids=$(lsof -ti tcp:$p 2>/dev/null || true)
  if [ -n "$pids" ]; then kill -9 $pids 2>/dev/null || true; fi
done
sleep 1

# API
cd "$ROOT/server"
nohup node index.js >> "$API_LOG" 2>&1 &
echo $! > /tmp/ryvon-api.pid

# Vite (direct binary — more stable than npx)
cd "$ROOT/client"
nohup ./node_modules/.bin/vite --port 5173 --host 0.0.0.0 --strictPort >> "$VITE_LOG" 2>&1 &
echo $! > /tmp/ryvon-vite.pid

sleep 2
echo "API PID $(cat /tmp/ryvon-api.pid)"
echo "VITE PID $(cat /tmp/ryvon-vite.pid)"
lsof -nP -iTCP:5001,5173 -sTCP:LISTEN || true
curl -s http://127.0.0.1:5001/api/health || true
echo
curl -s -o /dev/null -w "vite:%{http_code}\n" http://127.0.0.1:5173/ || true
