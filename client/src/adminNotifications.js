const LAST_ORDER_KEY = "ryvon-admin-last-order-id";
const NOTIFY_PREF_KEY = "ryvon-admin-order-notify";

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
 * @returns {number} max order id seen
 */
export function baselineOrders(orders) {
  const list = Array.isArray(orders) ? orders : [];
  const maxId = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0);
  if (maxId > 0 && getLastSeenOrderId() <= 0) {
    setLastSeenOrderId(maxId);
  }
  return maxId;
}

/**
 * Notify for orders newer than last seen. Returns updated last id.
 */
export function notifyNewOrders(orders, { onClick } = {}) {
  if (!notifyPrefEnabled() || !notificationsSupported()) {
    return getLastSeenOrderId();
  }
  if (Notification.permission !== "granted") {
    return getLastSeenOrderId();
  }

  const list = Array.isArray(orders) ? orders : [];
  const last = getLastSeenOrderId();
  if (last <= 0) {
    baselineOrders(list);
    return getLastSeenOrderId();
  }

  const fresh = list
    .filter((o) => (Number(o.id) || 0) > last)
    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  if (fresh.length === 0) return last;

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

  setLastSeenOrderId(newest.id);
  return Number(newest.id) || last;
}
