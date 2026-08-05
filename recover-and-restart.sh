#!/usr/bin/env bash
# Run on the VPS (WHM Terminal) to recover missing orders into store.json
# and restart a SINGLE API process on port 5002.
set -euo pipefail

APP=/home/ryvon/RYVON
STORE="$APP/server/data/store.json"
LOG=/home/ryvon/ryvon-api.log
PORT=5002

echo "==> Fetch live orders from running API (before kill)"
python3 <<'PY'
import json, urllib.request, urllib.parse, os
STORE = "/home/ryvon/RYVON/server/data/store.json"
codes = ["RYV53596716", "RYV52592338", "RYV80291441", "RYV79577865"]
emails = ["harshitsharma7563@gmail.com", "rishabhyadav2301@gmail.com"]
found = {}

def get(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            return json.load(r)
    except Exception as e:
        print("skip", url, e)
        return None

for c in codes:
    o = get(f"http://127.0.0.1:5002/api/orders/{c}")
    if o and o.get("code"):
        found[o["code"]] = o
for email in emails:
    lst = get("http://127.0.0.1:5002/api/my-orders?email=" + urllib.parse.quote(email)) or []
    for o in lst:
        if o.get("code"):
            found[o["code"]] = o

os.makedirs(os.path.dirname(STORE), exist_ok=True)
if os.path.exists(STORE):
    store = json.load(open(STORE))
else:
    store = {"orders": [], "messages": [], "users": [], "products": [], "categories": [], "banners": [], "coupons": []}

for o in store.get("orders") or []:
    if o.get("code") and o["code"] not in found:
        found[o["code"]] = o

orders = sorted(found.values(), key=lambda o: o.get("createdAt") or "", reverse=True)
store["orders"] = orders
max_id = max([int(o.get("id") or 0) for o in orders] + [1000])
store["nextOrderId"] = max(int(store.get("nextOrderId") or 1), max_id + 1)
json.dump(store, open(STORE, "w"), indent=2)
os.chmod(STORE, 0o664)
print("merged orders:", len(orders), [o["code"] for o in orders])
PY

chown ryvon:ryvon "$STORE" 2>/dev/null || true

echo "==> Kill ALL RYVON API processes (duplicates cause missing admin orders)"
pkill -f "/home/ryvon/RYVON/server/index.js" 2>/dev/null || true
pkill -f "RYVON/server/index.js" 2>/dev/null || true
sleep 2

echo "==> git pull + start ONE API"
cd "$APP" && git pull origin main
cd "$APP/server"
npm install --omit=dev --no-audit --maxsockets=1
touch "$LOG"
chown ryvon:ryvon "$LOG" 2>/dev/null || true
mkdir -p data uploads/products
chown -R ryvon:ryvon data uploads 2>/dev/null || true

# Prefer running as ryvon so file ownership stays consistent
if id ryvon >/dev/null 2>&1; then
  sudo -u ryvon bash -lc "cd '$APP/server' && PORT=$PORT nohup node index.js >> '$LOG' 2>&1 &"
else
  PORT=$PORT nohup node index.js >> "$LOG" 2>&1 &
fi
sleep 1
echo "==> health (call twice — pid must be SAME both times)"
curl -s "http://127.0.0.1:$PORT/api/health"; echo
curl -s "http://127.0.0.1:$PORT/api/health"; echo
echo "Done. If pids differ, duplicate processes still exist."
