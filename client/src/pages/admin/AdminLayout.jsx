import { Navigate, Outlet, NavLink, useNavigate } from "react-router-dom";

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

export function RequireAdmin({ children }) {
  const { token } = useAdminAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AdminLayout() {
  const { admin } = useAdminAuth();
  const nav = useNavigate();
  const link = ({ isActive }) =>
    `block rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-tss text-white" : "text-[#333] hover:bg-wash"}`;

  const logout = () => {
    localStorage.removeItem("ryvon-admin-token");
    localStorage.removeItem("ryvon-admin");
    nav("/admin/login");
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
            <a href="/" className="font-semibold text-mute hover:text-tss">View store</a>
            <button type="button" onClick={logout} className="font-bold text-tss">Logout</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-line bg-white p-3">
          <nav className="space-y-1">
            <NavLink to="/admin" end className={link}>Dashboard</NavLink>
            <NavLink to="/admin/products" className={link}>Products</NavLink>
            <NavLink to="/admin/categories" className={link}>Categories</NavLink>
            <NavLink to="/admin/banners" className={link}>Banners</NavLink>
            <NavLink to="/admin/coupons" className={link}>Coupons</NavLink>
            <NavLink to="/admin/users" className={link}>Users</NavLink>
            <NavLink to="/admin/orders" className={link}>Orders</NavLink>
            <NavLink to="/admin/messages" className={link}>Messages</NavLink>
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
