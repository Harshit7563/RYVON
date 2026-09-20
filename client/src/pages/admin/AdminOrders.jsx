import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDeleteOrder, adminOrders, adminPatchOrder, adminUpdateOrder, inr, mediaUrl } from "../../api";

const STATUSES = ["pending_payment", "placed", "confirmed", "shipped", "delivered", "cancelled"];

function paymentLabel(o) {
  const status = String(o?.paymentStatus || "").toLowerCase();
  const method = String(o?.payment || "").toLowerCase();
  if (status === "paid" || method === "paid") return "Paid";
  if (o?.status === "pending_payment" || status === "pending") return "Pending";
  if (status === "cancelled" || o?.status === "cancelled") return "Cancelled";
  if (method === "cod" || status === "cod") return "COD";
  if (method === "razorpay") return status === "paid" ? "Paid" : "Pending";
  return o?.payment || "—";
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-line/70 py-2 text-sm last:border-0">
      <span className="text-mute">{label}</span>
      <span className="max-w-[70%] text-right font-semibold text-ink">{children}</span>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(null);

  const [awbDraft, setAwbDraft] = useState("");

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await adminOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load orders");
      setOrders([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!view) return undefined;
    setAwbDraft(view.awb || "");
    const onKey = (e) => {
      if (e.key === "Escape") setView(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const update = async (id, status) => {
    try {
      const updated = await adminUpdateOrder(id, status);
      await load();
      if (view && (view.id === id || view.code === updated?.code)) {
        setView(updated);
      }
    } catch (e) {
      setError(e.message || "Update failed");
    }
  };

  const saveAwb = async (id) => {
    setBusy(true);
    setError("");
    try {
      const updated = await adminPatchOrder(id, { awb: awbDraft.trim() });
      await load();
      setView(updated);
    } catch (e) {
      setError(e.message || "Could not save AWB / tracking");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (o) => {
    const id = o?.id ?? o?.code;
    if (!id) return;
    if (!confirm(`Delete order ${o.code || id}? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await adminDeleteOrder(id);
      if (view && (view.id === o.id || view.code === o.code)) setView(null);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const shown = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      o.code?.toLowerCase().includes(s) ||
      o.customer?.name?.toLowerCase().includes(s) ||
      o.customer?.phone?.includes(s) ||
      o.customer?.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase">Orders</h1>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase hover:border-tss disabled:opacity-50"
        >
          {busy ? "Loading…" : "Refresh"}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-lg border border-tss/30 bg-tss/5 px-3 py-2 text-sm font-semibold text-tss">
          {error}
        </p>
      )}
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
            {t.replace("_", " ")}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search code, name, phone, email…"
        className="mt-3 w-full max-w-md border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
      />

      <p className="mt-3 text-xs text-mute">
        {shown.length} of {orders.length} orders
      </p>

      <div className="mt-5 space-y-3">
        {shown.length === 0 && !busy && (
          <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">No orders</p>
        )}
        {shown.map((o) => (
          <div key={o.id || o.code} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-extrabold">{o.code}</p>
                <p className="text-sm text-mute">
                  {o.customer?.name || "—"} · {o.customer?.phone || "—"}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-ink">
                  {o.createdAt
                    ? new Date(o.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{inr(o.total || 0)}</p>
                <p className="text-xs font-bold uppercase text-mute">{paymentLabel(o)}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-tss">{o.status}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setView(o)}
                className="rounded-lg bg-ink px-3 py-2 text-[11px] font-bold uppercase text-white hover:bg-black"
              >
                View Order
              </button>
              <Link
                to={`/admin/track-order?q=${encodeURIComponent(o.awb || o.code)}`}
                className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase hover:border-tss"
              >
                Track Order
              </Link>
              <span className="text-xs font-bold uppercase text-mute">Status</span>
              <select
                value={STATUSES.includes(o.status) ? o.status : "placed"}
                onChange={(e) => update(o.id, e.target.value)}
                className="border border-line px-2 py-1.5 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(o)}
                className="rounded-lg border border-tss/40 px-3 py-2 text-[11px] font-bold uppercase text-tss hover:bg-tss/5 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {view && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${view.code}`}
          onClick={() => setView(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-mute">Order details</p>
                <h2 className="font-display text-xl font-extrabold">{view.code}</h2>
              </div>
              <button
                type="button"
                onClick={() => setView(null)}
                className="rounded-lg border border-line px-2.5 py-1 text-sm font-bold hover:border-tss"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(92vh-4.5rem)] overflow-y-auto px-4 py-4">
              <div className="rounded-xl border border-line p-3">
                <Row label="Status">
                  <span className="uppercase text-tss">{view.status}</span>
                </Row>
                <Row label="Payment">{paymentLabel(view)}</Row>
                <Row label="Total">{inr(view.total || 0)}</Row>
                <Row label="Subtotal">{inr(view.subtotal || 0)}</Row>
                {(view.discount > 0 || view.prepaidDiscount > 0 || view.couponDiscount > 0) && (
                  <Row label="Discount">−{inr(view.discount || 0)}</Row>
                )}
                {view.couponCode && <Row label="Coupon">{view.couponCode}</Row>}
                <Row label="Shipping">{view.shipping ? inr(view.shipping) : "FREE"}</Row>
                <Row label="Placed">
                  {view.createdAt
                    ? new Date(view.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })
                    : "—"}
                </Row>
                {view.paidAt && (
                  <Row label="Paid at">
                    {new Date(view.paidAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Row>
                )}
                {view.razorpayPaymentId && <Row label="Payment ID">{view.razorpayPaymentId}</Row>}
                {view.razorpayOrderId && <Row label="Razorpay order">{view.razorpayOrderId}</Row>}
                <Row label="AWB">{view.awb || "Not assigned (add below)"}</Row>
                {view.courierName && <Row label="Courier">{view.courierName}</Row>}
                {view.shipStatus && <Row label="Courier status">{view.shipStatus}</Row>}
                {view.tracking?.events?.length > 0 && (
                  <div className="mt-2 border-t border-line pt-2 text-left text-xs">
                    <p className="mb-1 font-bold uppercase text-mute">Tracking</p>
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-mute">
                      {view.tracking.events.slice(0, 12).map((ev, i) => (
                        <li key={i}>
                          {ev.status || ev.message || ev.event || "Update"}
                          {ev.location ? ` · ${ev.location}` : ""}
                          {ev.time || ev.date ? ` · ${ev.time || ev.date}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-line p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-mute">Manual AWB (Nimbus track)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    value={awbDraft}
                    onChange={(e) => setAwbDraft(e.target.value)}
                    placeholder="Enter AWB / tracking number"
                    className="min-w-[12rem] flex-1 border border-line px-3 py-2 text-sm outline-none focus:border-tss"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => saveAwb(view.id)}
                    className="rounded-lg bg-ink px-3 py-2 text-[11px] font-bold uppercase text-white hover:bg-black disabled:opacity-50"
                  >
                    {busy ? "…" : "Save & Track"}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-mute">Shipping is manual — paste AWB after you book outside RYVON.</p>
              </div>

              <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-mute">Customer</h3>
              <div className="mt-2 rounded-xl border border-line p-3 text-sm">
                <p className="font-bold">{view.customer?.name || "—"}</p>
                <p className="mt-1 text-mute">{view.customer?.email || "—"}</p>
                <p className="text-mute">{view.customer?.phone || "—"}</p>
                <p className="mt-2 leading-relaxed text-mute">
                  {[view.customer?.address, view.customer?.city, view.customer?.state, view.customer?.pincode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>

              <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-mute">Items</h3>
              <ul className="mt-2 space-y-2">
                {(view.items || []).map((i, idx) => (
                  <li key={idx} className="flex gap-3 rounded-xl border border-line p-2.5">
                    <img
                      src={mediaUrl(i.image)}
                      alt=""
                      className="h-14 w-14 shrink-0 bg-wash object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-semibold">{i.name}</p>
                      <p className="text-[12px] text-mute">
                        UK {i.size}
                        {i.color ? ` · ${i.color}` : ""} ×{i.qty}
                      </p>
                      <p className="font-bold">{inr((i.price || 0) * (i.qty || 1))}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <span className="text-xs font-bold uppercase text-mute">Update status</span>
                <select
                  value={STATUSES.includes(view.status) ? view.status : "placed"}
                  onChange={(e) => update(view.id, e.target.value)}
                  className="border border-line px-2 py-1.5 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(view)}
                  className="rounded-lg border border-tss/40 px-3 py-2 text-[11px] font-bold uppercase text-tss hover:bg-tss/5 disabled:opacity-50"
                >
                  Delete
                </button>
                <Link
                  to={`/admin/track-order?q=${encodeURIComponent(view.awb || view.code)}`}
                  className="ml-auto rounded-lg bg-tss px-3 py-2 text-[11px] font-bold uppercase text-white"
                >
                  Track Order
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
