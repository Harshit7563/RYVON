import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminStats, inr } from "../../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-tss">{error}</p>;
  if (!stats) return <p className="text-mute">Loading dashboard…</p>;

  const cards = [
    ["Products", stats.products, "/admin/products"],
    ["Categories", stats.categories ?? "—", "/admin/categories"],
    ["Banners", stats.banners ?? "—", "/admin/banners"],
    ["Coupons", stats.coupons ?? "—", "/admin/coupons"],
    ["Users", stats.users ?? "—", "/admin/users"],
    ["Orders", stats.orders, "/admin/orders"],
    ["Unread msgs", stats.messages, "/admin/messages"],
    ["Revenue", inr(stats.revenue), "/admin/orders"],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold uppercase">Dashboard</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, to]) => (
          <Link key={label} to={to} className="rounded-xl border border-line bg-white p-4 shadow-sm transition hover:border-tss">
            <p className="text-[11px] font-bold uppercase text-mute">{label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide">Recent Orders</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase text-mute">
              <tr>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-mute">No orders yet</td></tr>
              )}
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-line/70">
                  <td className="py-2.5 pr-3 font-semibold">{o.code}</td>
                  <td className="py-2.5 pr-3">{o.customer.name}</td>
                  <td className="py-2.5 pr-3">{inr(o.total)}</td>
                  <td className="py-2.5 uppercase text-tss">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
