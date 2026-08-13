import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { adminOrders, adminStats } from "../../api";
import {
  baselineOrders,
  ensureNotificationPermission,
  notificationsSupported,
  notifyNewOrders,
  notifyPrefEnabled,
  setNotifyPref,
} from "../../adminNotifications";

function useAdminAuth() {
  const token = localStorage.getItem("ryvon-admin-token");
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("ryvon-admin") || "null");
    } catch {
      return null;
    }
  })();
  return { token, admin };
}

function Badge({ n, active }) {
  if (active || !n || n < 1) return null;
  const label = n > 99 ? "99+" : String(n);
  return (
    <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-tss px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white">
      {label}
    </span>
  );
}

const SEEN_KEY = "ryvon-admin-seen";

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

function markSeen(key, value) {
  const seen = readSeen();
  seen[key] = value;
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

function freshCount(key, current) {
  const prev = Number(readSeen()[key] || 0);
  const n = Number(current) || 0;
  return n > prev ? n - prev : 0;
}

export function RequireAdmin({ children }) {
  const { token } = useAdminAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", badge: "dashboard" },
  { to: "/admin/products", label: "Products", badge: "products" },
  { to: "/admin/categories", label: "Categories", badge: "categories" },
  { to: "/admin/banners", label: "Banners", badge: "banners" },
  { to: "/admin/coupons", label: "Coupons", badge: "coupons" },
  { to: "/admin/users", label: "Users", badge: "users" },
  { to: "/admin/orders", label: "Orders", badge: "orders" },
  { to: "/admin/messages", label: "Messages", badge: "messages" },
];

export default function AdminLayout() {
  const { admin } = useAdminAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [badges, setBadges] = useState({});
  const [seenTick, setSeenTick] = useState(0);
  const [notifyOn, setNotifyOn] = useState(() => notifyPrefEnabled());
  const [notifyState, setNotifyState] = useState(() =>
    notificationsSupported() ? Notification.permission : "unsupported"
  );
  const [toast, setToast] = useState(null);
  const badgesRef = useRef(badges);
  const primedRef = useRef(false);
  badgesRef.current = badges;

  useEffect(() => {
    const load = () =>
      adminStats()
        .then((s) => {
          const b = s.badges || {};
          const seen = readSeen();
          let changed = false;
          for (const key of ["products", "categories", "banners", "coupons", "users"]) {
            if (seen[key] == null && b[key] != null) {
              seen[key] = Number(b[key]) || 0;
              changed = true;
            }
          }
          if (changed) localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
          setBadges(b);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notifyOn || !notificationsSupported()) return;
    if (Notification.permission === "default") {
      ensureNotificationPermission().then(setNotifyState).catch(() => {});
    }
  }, [notifyOn]);

  useEffect(() => {
    let cancelled = false;

    const pollWithToast = async () => {
      if (!notifyPrefEnabled()) return;
      try {
        const data = await adminOrders();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        if (!primedRef.current) {
          baselineOrders(list);
          primedRef.current = true;
          return;
        }
        const prev = Number(localStorage.getItem("ryvon-admin-last-order-id") || 0);
        const fresh = list
          .filter((o) => (Number(o.id) || 0) > prev)
          .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        if (fresh.length === 0) return;
        const newest = fresh[fresh.length - 1];
        notifyNewOrders(list, { onClick: () => nav("/admin/orders") });
        setToast({
          code: newest.code,
          name: newest.customer?.name || "Customer",
          total: newest.total,
          count: fresh.length,
        });
      } catch {
        /* ignore */
      }
    };

    pollWithToast();
    const t = setInterval(pollWithToast, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [nav, notifyOn]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const item = NAV.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    );
    if (!item?.badge) return;
    if (item.badge === "orders" || item.badge === "messages" || item.badge === "dashboard") {
      return;
    }
    markSeen(item.badge, Number(badgesRef.current[item.badge]) || 0);
    setSeenTick((x) => x + 1);
  }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
      isActive ? "bg-tss text-white" : "text-[#333] hover:bg-wash"
    }`;

  const logout = () => {
    localStorage.removeItem("ryvon-admin-token");
    localStorage.removeItem("ryvon-admin");
    nav("/admin/login");
  };

  const badgeFor = (key) => {
    void seenTick;
    if (key === "orders" || key === "messages" || key === "dashboard") {
      return Number(badges[key]) || 0;
    }
    return freshCount(key, badges[key]);
  };

  const toggleNotify = async () => {
    if (!notificationsSupported()) {
      setNotifyState("unsupported");
      return;
    }
    if (!notifyOn) {
      const perm = await ensureNotificationPermission();
      setNotifyState(perm);
      setNotifyPref(true);
      setNotifyOn(true);
      primedRef.current = false;
    } else {
      setNotifyPref(false);
      setNotifyOn(false);
      setToast(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-extrabold text-tss">RYVON</span>
            <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {notificationsSupported() && (
              <button
                type="button"
                onClick={toggleNotify}
                className={`hidden rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase sm:inline ${
                  notifyOn ? "border-off/40 bg-off/10 text-off" : "border-line text-mute"
                }`}
                title={
                  notifyState === "denied"
                    ? "Browser blocked notifications — enable in site settings"
                    : "Toggle order push notifications"
                }
              >
                {notifyOn ? "Alerts On" : "Alerts Off"}
              </button>
            )}
            <span className="hidden text-mute sm:inline">{admin?.email}</span>
            <a href="/" className="font-semibold text-mute hover:text-tss">
              View store
            </a>
            <button type="button" onClick={logout} className="font-bold text-tss">
              Logout
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <button
          type="button"
          onClick={() => {
            setToast(null);
            nav("/admin/orders");
          }}
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-tss/30 bg-white p-4 text-left shadow-lg"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-tss">New order</p>
          <p className="mt-1 font-display text-lg font-extrabold">
            {toast.count > 1 ? `${toast.count} new · ${toast.code}` : toast.code}
          </p>
          <p className="text-sm text-mute">
            {toast.name} · ₹{Math.round(Number(toast.total) || 0)}
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase text-ink">Open orders →</p>
        </button>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-line bg-white p-3">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <span className={isActive ? "text-white" : undefined}>{item.label}</span>
                    <Badge n={badgeFor(item.badge)} active={isActive} />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
