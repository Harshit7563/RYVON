const LAST_ORDER_KEY = "ryvon-admin-last-order-id";
const NOTIFIED_IDS_KEY = "ryvon-admin-notified-order-ids";
const NOTIFY_PREF_KEY = "ryvon-admin-order-notify";
const MAX_NOTIFIED_IDS = 400;

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyPrefEnabled() {
  try {
    const v = localStorage.getItem(NOTIFY_PREF_KEY);
    if (v == null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export function setNotifyPref(on) {
  localStorage.setItem(NOTIFY_PREF_KEY, on ? "1" : "0");
}

export function getLastSeenOrderId() {
  return Number(localStorage.getItem(LAST_ORDER_KEY) || 0) || 0;
}

export function setLastSeenOrderId(id) {
  const n = Number(id) || 0;
  if (n > 0) localStorage.setItem(LAST_ORDER_KEY, String(n));
}

/** Real order for admin alert: COD placed or online payment captured — never pending/failed. */
export function isConfirmedOrder(o) {
  if (!o) return false;
  const st = String(o.status || "").toLowerCase();
  const ps = String(o.paymentStatus || "").toLowerCase();
  if (st === "pending_payment" || st === "cancelled") return false;
  if (ps === "pending" || ps === "cancelled" || ps === "failed") return false;
  if (ps === "paid" || ps === "cod") return true;
  const pay = String(o.payment || "").toLowerCase();
  return pay === "cod" || pay === "paid";
}

function readNotifiedIds() {
  try {
    const raw = localStorage.getItem(NOTIFIED_IDS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set((Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter((n) => n > 0));
  } catch {
    return new Set();
  }
}

function writeNotifiedIds(set) {
  const ids = [...set].slice(-MAX_NOTIFIED_IDS);
  localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(ids));
}

function markNotified(ids) {
  const set = readNotifiedIds();
  for (const id of ids) {
    const n = Number(id) || 0;
    if (n > 0) set.add(n);
  }
  writeNotifiedIds(set);
  const maxId = ids.reduce((m, id) => Math.max(m, Number(id) || 0), getLastSeenOrderId());
  if (maxId > 0) setLastSeenOrderId(maxId);
}

export async function ensureNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Baseline without alerting (first admin session / first poll).
 * Marks existing confirmed orders as already seen.
 */
export function baselineOrders(orders) {
  const list = Array.isArray(orders) ? orders : [];
  const confirmed = list.filter(isConfirmedOrder);
  const maxId = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0);
  if (getLastSeenOrderId() <= 0 && maxId > 0) setLastSeenOrderId(maxId);
  markNotified(confirmed.map((o) => o.id));
  return maxId;
}

/**
 * Notify only when payment succeeded (paid) or COD order is placed.
 * Pending Razorpay checkouts never alert — avoids false "success" on failed payments.
 * @returns {{ lastId: number, alerted: object[] }}
 */
export function notifyNewOrders(orders, { onClick } = {}) {
  const empty = { lastId: getLastSeenOrderId(), alerted: [] };
  if (!notifyPrefEnabled() || !notificationsSupported()) return empty;
  if (Notification.permission !== "granted") return empty;

  const list = Array.isArray(orders) ? orders : [];
  const notified = readNotifiedIds();

  if (getLastSeenOrderId() <= 0 && notified.size === 0) {
    baselineOrders(list);
    return { lastId: getLastSeenOrderId(), alerted: [] };
  }

  const fresh = list
    .filter((o) => isConfirmedOrder(o) && !notified.has(Number(o.id) || 0))
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  if (fresh.length === 0) return empty;

  const newest = fresh[fresh.length - 1];
  const title =
    fresh.length === 1 ? `New order ${newest.code}` : `${fresh.length} new orders`;
  const body =
    fresh.length === 1
      ? `${newest.customer?.name || "Customer"} · ₹${Math.round(Number(newest.total) || 0)}`
      : `Latest: ${newest.code} · ₹${Math.round(Number(newest.total) || 0)}`;

  try {
    const n = new Notification(title, {
      body,
      tag: `ryvon-order-${newest.id}`,
      renotify: true,
      icon: "/favicon.svg",
    });
    if (typeof onClick === "function") {
      n.onclick = () => {
        window.focus();
        onClick(newest);
        n.close();
      };
    }
  } catch {
    /* ignore */
  }

  markNotified(fresh.map((o) => o.id));
  return { lastId: getLastSeenOrderId(), alerted: fresh };
}
