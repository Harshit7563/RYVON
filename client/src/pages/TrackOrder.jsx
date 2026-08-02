import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrder, inr } from "../api";

const STEPS = ["placed", "confirmed", "shipped", "delivered"];

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    setError("");
    setOrder(null);
    if (!code.trim()) return;
    setBusy(true);
    try {
      setOrder(await getOrder(code.trim()));
    } catch {
      setError("Order not found. Check your Order ID.");
    } finally {
      setBusy(false);
    }
  };

  const stepIdx = order ? Math.max(0, STEPS.indexOf(order.status === "cancelled" ? "placed" : order.status)) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14 lg:px-6">
      <h1 className="font-display text-center text-2xl font-extrabold uppercase">Track Order</h1>
      <p className="mt-2 text-center text-sm text-mute">Enter your Order ID from confirmation email / SMS</p>

      <form onSubmit={search} className="mt-6 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. RYV12345678"
          className="flex-1 border border-line px-3 py-3 text-sm outline-none focus:border-tss"
        />
        <button type="submit" disabled={busy} className="bg-tss px-5 text-xs font-bold uppercase text-white disabled:opacity-60">
          {busy ? "…" : "Track"}
        </button>
      </form>
      {error && <p className="mt-3 text-center text-sm font-semibold text-tss">{error}</p>}

      {order && (
        <div className="mt-8 border border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase text-mute">Order ID</p>
              <p className="font-display text-lg font-extrabold">{order.code}</p>
            </div>
            <span className="rounded bg-tss/10 px-2 py-1 text-[11px] font-bold uppercase text-tss">{order.status}</span>
          </div>

          <div className="mt-6 flex justify-between gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i <= stepIdx ? "bg-tss" : "bg-line"}`} />
                <p className={`mt-2 text-[10px] font-bold uppercase ${i <= stepIdx ? "text-tss" : "text-mute"}`}>{s}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <p><span className="text-mute">Ship to:</span> {order.customer.name}, {order.customer.city}</p>
            <p><span className="text-mute">Total:</span> <strong>{inr(order.total)}</strong></p>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-mute">
            {order.items.map((i, idx) => (
              <li key={idx}>• {i.name} (UK {i.size}) ×{i.qty}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-center text-sm">
        Need help? <Link to="/contact" className="font-bold text-tss underline">Contact us</Link>
      </p>
    </div>
  );
}
