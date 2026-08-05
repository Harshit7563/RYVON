#!/usr/bin/env bash
# ROOT ONLY — kill duplicate RYVON APIs, merge live orders into store.json, start ONE process.
set -euo pipefail

APP=/home/ryvon/RYVON
SERVER="$APP/server"
STORE="$SERVER/data/store.json"
LOG=/home/ryvon/ryvon-api.log
PORT=5002
PIDFILE="$SERVER/data/api.pid"

echo "=== BEFORE: who owns :$PORT ==="
ss -tlnp | grep ":$PORT" || true
ps aux | grep -E '[n]ode.*index|[n]ode /home/ryvon' || true
lsof -iTCP:$PORT -sTCP:LISTEN 2>/dev/null || true

echo "=== Harvest orders from ANY live process on :$PORT ==="
python3 <<'PY'
import json, urllib.request, urllib.parse, os, time
STORE = "/home/ryvon/RYVON/server/data/store.json"
codes = set()
found = {}

def try_get(url):
    try:
        with urllib.request.urlopen(url, timeout=3) as r:
            return json.load(r)
    except Exception:
        return None

# Hit many times — round-robin may hit different processes
for _ in range(20):
    h = try_get("http://127.0.0.1:5002/api/health")
    if h:
        print("health hit:", h)
    for email in ["harshitsharma7563@gmail.com", "rishabhyadav2301@gmail.com"]:
        lst = try_get("http://127.0.0.1:5002/api/my-orders?email=" + urllib.parse.quote(email)) or []
        for o in lst:
            if o.get("code"):
                found[o["code"]] = o
    time.sleep(0.05)

for c in list(found) + [
    "RYV54221543", "RYV53596716", "RYV52592338", "RYV80291441", "RYV79577865"
]:
    o = try_get(f"http://127.0.0.1:5002/api/orders/{c}")
    if o and o.get("code"):
        found[o["code"]] = o

os.makedirs(os.path.dirname(STORE), exist_ok=True)
store = json.load(open(STORE)) if os.path.exists(STORE) else {
    "orders": [], "messages": [], "users": [], "products": [],
    "categories": [], "banners": [], "coupons": [], "nextOrderId": 1001
}
for o in store.get("orders") or []:
    if o.get("code") and o["code"] not in found:
        found[o["code"]] = o
orders = sorted(found.values(), key=lambda o: o.get("createdAt") or "", reverse=True)
store["orders"] = orders
max_id = max([int(o.get("id") or 0) for o in orders] + [1000])
store["nextOrderId"] = max(int(store.get("nextOrderId") or 1), max_id + 1)
# keep messages if any
json.dump(store, open(STORE, "w"), indent=2)
os.chmod(STORE, 0o664)
print("DISK orders now:", len(orders), [o["code"] for o in orders])
PY

echo "=== Kill EVERY listener on $PORT + ryvon node ==="
fuser -k ${PORT}/tcp 2>/dev/null || true
# kill by pidfile
if [[ -f "$PIDFILE" ]]; then
  kill -9 "$(cat "$PIDFILE")" 2>/dev/null || true
  rm -f "$PIDFILE"
fi
pkill -9 -f '/home/ryvon/RYVON/server/index.js' 2>/dev/null || true
# also kill bare "node index.js" owned by root/ryvon started from that dir
for pid in $(lsof -t -iTCP:$PORT -sTCP:LISTEN 2>/dev/null || true); do
  kill -9 "$pid" 2>/dev/null || true
done
sleep 2
ss -tlnp | grep ":$PORT" && echo "ERROR: port still busy" && exit 1 || echo "PORT $PORT FREE"

echo "=== Fix ownership + pull ==="
chown -R ryvon:ryvon "$APP"
chown ryvon:ryvon "$LOG" 2>/dev/null || touch "$LOG" && chown ryvon:ryvon "$LOG"
chmod 664 "$LOG"
sudo -u ryvon bash -lc "cd '$APP' && git pull origin main"

echo "=== Start ONE api as ryvon ==="
sudo -u ryvon bash -lc "cd '$SERVER' && PORT=$PORT nohup node index.js >> '$LOG' 2>&1 &"
sleep 2

echo "=== VERIFY (pid must appear + same twice) ==="
H1=$(curl -s http://127.0.0.1:$PORT/api/health)
H2=$(curl -s http://127.0.0.1:$PORT/api/health)
echo "$H1"
echo "$H2"
ss -tlnp | grep ":$PORT" || true
ps aux | grep -E '[n]ode.*RYVON|[n]ode index.js' || true

echo "$H1" | grep -q '"pid"' || { echo "FAIL: old API still running (no pid in health)"; exit 1; }
echo "OK — now hard-refresh admin orders."
