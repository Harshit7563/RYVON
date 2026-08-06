import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { adminStats } from "../../api";

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
  const badgesRef = useRef(badges);
  badgesRef.current = badges;

  useEffect(() => {
    const load = () =>
      adminStats()
        .then((s) => {
          const b = s.badges || {};
          // First load: baseline growth badges so we only show *new* later.
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

  // Acknowledge section when opened so growth badges clear.
  useEffect(() => {
    const item = NAV.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    );
    if (!item?.badge) return;
    if (item.badge === "orders" || item.badge === "messages" || item.badge === "dashboard") {
      // actionable badges stay live; no local ack needed
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

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-extrabold text-tss">RYVON</span>
            <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
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
