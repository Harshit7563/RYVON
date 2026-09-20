import { useEffect, useState } from "react";
import { adminUpdateUser, adminUserOrders, adminUsers, inr, mediaUrl } from "../../api";
import { formatOrderDateTime } from "../../formatDate";

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState("");

  const load = () => adminUsers().then(setList).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!activeUser) return undefined;
    const onKey = (e) => e.key === "Escape" && closeOrders();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [activeUser]);

  const toggleActive = async (u) => {
    const next = !(u.active !== false);
    await adminUpdateUser(u.id, { active: next });
    await load();
  };

  const openOrders = async (u) => {
    setActiveUser(u);
    setOrders([]);
    setOrdersErr("");
    setOrdersLoading(true);
    try {
      setOrders(await adminUserOrders(u.id));
    } catch (e) {
      setOrdersErr(e.message || "Could not load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const closeOrders = () => {
    setActiveUser(null);
    setOrders([]);
    setOrdersErr("");
  };

  if (error) return <p className="text-tss">{error}</p>;

  const shown = list.filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.phone?.includes(s)
    );
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase">Users</h1>
          <p className="mt-1 text-sm text-mute">Registered & logged-in customers</p>
        </div>
        <p className="text-sm font-bold text-mute">{shown.length} shown</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, email, phone…"
        className="mt-4 w-full max-w-md border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
      />

      <div className="mt-5 space-y-3">
        {shown.length === 0 && (
          <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">No users yet</p>
        )}
        {shown.map((u) => {
          const count = u.orderCount || 0;
          const on = u.active !== false;
          return (
            <div key={u.id} className={`rounded-xl border bg-white p-4 shadow-sm ${on ? "border-line" : "border-line opacity-70"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {u.picture ? (
                    <img src={u.picture} alt="" className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-tss text-lg font-bold uppercase text-white">
                      {(u.name || u.email || "?").charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="font-display text-lg font-extrabold">{u.name}</p>
                    <p className="text-sm text-mute">{u.email}</p>
                    {u.phone && <p className="text-sm text-mute">{u.phone}</p>}
                    <p className="mt-1 text-[11px] text-mute">
                      <span className="uppercase">{u.provider || "email"}</span>
                      {u.createdAt ? ` · Joined ${new Date(u.createdAt).toLocaleDateString()}` : ""}
                      {u.lastLoginAt ? ` · Last login ${new Date(u.lastLoginAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => openOrders(u)}
                    className="rounded-lg border border-line bg-wash px-3 py-2 text-left transition hover:border-tss hover:bg-tss/5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-mute">Total</p>
                    <p className="text-sm font-extrabold text-ink">
                      {count} order{count === 1 ? "" : "s"}
                    </p>
                    <p className="text-[11px] text-mute">{inr(u.spent || 0)} spent</p>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggleActive(u)}
                    className={`relative h-7 w-12 rounded-full transition ${on ? "bg-off" : "bg-[#cfcfcf]"}`}
                    title={on ? "User On" : "User Off"}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                        on ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <p className={`text-[10px] font-bold uppercase ${on ? "text-off" : "text-mute"}`}>
                    {on ? "On" : "Off"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeUser && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close" onClick={closeOrders} />
          <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-mute">Orders</p>
                <h2 className="font-display text-lg font-extrabold uppercase">{activeUser.name}</h2>
                <p className="text-xs text-mute">{activeUser.email}</p>
              </div>
              <button
                type="button"
                onClick={closeOrders}
                className="grid h-9 w-9 place-items-center rounded-full border border-line"
                aria-label="Close"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              {ordersLoading && <p className="py-8 text-center text-sm text-mute">Loading orders…</p>}
              {ordersErr && <p className="py-4 text-center text-sm font-semibold text-tss">{ordersErr}</p>}
              {!ordersLoading && !ordersErr && orders.length === 0 && (
                <p className="py-10 text-center text-sm text-mute">No orders for this user</p>
              )}
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-line p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-extrabold">{o.code}</p>
                        <p className="text-[11px] font-semibold text-ink">
                          {o.createdAt
                            ? `Placed on ${formatOrderDateTime(o.createdAt, { withSeconds: true })}`
                            : "Date unavailable"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{inr(o.total)}</p>
                        <span className="mt-1 inline-block rounded bg-tss/10 px-2 py-0.5 text-[10px] font-bold uppercase text-tss">
                          {o.status}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 border-t border-line pt-3">
                      {(o.items || []).map((i, idx) => (
                        <li key={idx} className="flex gap-2.5 text-sm">
                          <img
                            src={mediaUrl(i.image)}
                            alt=""
                            className="h-12 w-12 shrink-0 bg-wash object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-semibold">{i.name}</p>
                            <p className="text-[12px] text-mute">
                              UK {i.size}
                              {i.color ? ` · ${i.color}` : ""} ×{i.qty}
                            </p>
                            <p className="font-bold">{inr(i.price * i.qty)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {(o.customer?.address || o.customer?.city) && (
                      <p className="mt-3 text-[12px] leading-relaxed text-mute">
                        {[o.customer.address, o.customer.city, o.customer.state, o.customer.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {o.discount > 0 && (
                      <p className="mt-2 text-xs font-semibold text-off">
                        Coupon {o.couponCode}: −{inr(o.discount)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
