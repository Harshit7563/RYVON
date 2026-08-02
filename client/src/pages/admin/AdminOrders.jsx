import { useEffect, useState } from "react";
import { adminOrders, adminUpdateOrder, inr } from "../../api";

const STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const load = () => adminOrders().then(setOrders).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    await adminUpdateOrder(id, status);
    await load();
  };

  if (error) return <p className="text-tss">{error}</p>;

  const shown = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      o.code?.toLowerCase().includes(s) ||
      o.customer?.name?.toLowerCase().includes(s) ||
      o.customer?.phone?.includes(s)
    );
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold uppercase">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase ${
              filter === t ? "bg-tss text-white" : "border border-line bg-white text-mute"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search code, name, phone…"
        className="mt-3 w-full max-w-md border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
      />

      <div className="mt-5 space-y-3">
        {shown.length === 0 && <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">No orders</p>}
        {shown.map((o) => (
          <div key={o.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-extrabold">{o.code}</p>
                <p className="text-sm text-mute">{o.customer.name} · {o.customer.phone}</p>
                <p className="text-xs text-mute">{o.customer.address}, {o.customer.city} {o.customer.pincode}</p>
                <p className="mt-1 text-[11px] text-mute">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{inr(o.total)}</p>
                <p className="text-xs uppercase text-mute">{o.payment}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-mute">
              {o.items.map((i, idx) => (
                <li key={idx}>• {i.name} · UK {i.size} ×{i.qty}</li>
              ))}
            </ul>
            {o.discount > 0 && (
              <p className="mt-2 text-sm font-semibold text-off">
                Coupon {o.couponCode}: −{inr(o.discount)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-mute">Status</span>
              <select
                value={o.status}
                onChange={(e) => update(o.id, e.target.value)}
                className="border border-line px-2 py-1.5 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
