import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminLiveTracking, adminPatchOrder, adminTrackOrder, inr } from "../../api";
import { formatOrderDateTime } from "../../formatDate";

function fmt(dt) {
  return formatOrderDateTime(dt, { withSeconds: true }) || "—";
}

function TrackingCard({ tracking, order }) {
  if (!tracking && !order) return null;
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-mute">
            {order?.code || "Shipment"}
          </p>
          <h2 className="font-display text-xl font-extrabold">{tracking?.awb || order?.awb || "—"}</h2>
          <p className="mt-1 text-sm text-mute">{tracking?.courierName || order?.courierName || "Courier pending"}</p>
        </div>
        <span className="rounded bg-tss/10 px-2 py-1 text-[11px] font-bold uppercase text-tss">
          {tracking?.shipStatus || order?.shipStatus || order?.status || "—"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p><span className="text-mute">Order date:</span> {fmt(order?.createdAt)}</p>
        <p><span className="text-mute">Paid at:</span> {fmt(order?.paidAt)}</p>
        <p><span className="text-mute">Customer:</span> {order?.customer?.name || "—"}</p>
        <p><span className="text-mute">Phone:</span> {order?.customer?.phone || "—"}</p>
        <p><span className="text-mute">Location:</span> {tracking?.location || "—"}</p>
        <p><span className="text-mute">Last update:</span> {fmt(tracking?.eventTime || tracking?.updatedAt)}</p>
        <p><span className="text-mute">EDD:</span> {fmt(tracking?.edd)}</p>
        <p><span className="text-mute">Amount:</span> {order ? inr(order.total || 0) : "—"}</p>
      </div>
      {tracking?.message && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-sm">{tracking.message}</p>
      )}
    </div>
  );
}

export default function AdminTrackOrder() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || params.get("code") || "");
  const [awbDraft, setAwbDraft] = useState("");
  const [result, setResult] = useState(null);
  const [live, setLive] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveErr, setLiveErr] = useState("");

  const search = async (query) => {
    const value = String(query || q).trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const data = await adminTrackOrder(value);
      setResult(data);
      setAwbDraft(data.order?.awb || data.tracking?.awb || "");
      setParams({ q: value }, { replace: true });
    } catch (e) {
      setResult(null);
      setError(e.message || "Tracking not found");
    } finally {
      setBusy(false);
    }
  };

  const loadLive = async () => {
    try {
      const data = await adminLiveTracking();
      setLive(Array.isArray(data.orders) ? data.orders : []);
      setLiveErr(data.error || (data.configured === false ? "Add NimbusPost keys in server .env" : ""));
    } catch (e) {
      setLiveErr(e.message || "Could not load live tracking");
    }
  };

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const initial = params.get("q") || params.get("code");
    if (initial) search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result?.order?.awb && !result?.tracking?.awb) return undefined;
    const t = setInterval(() => search(q), 12000);
    return () => clearInterval(t);
  }, [result?.order?.awb, result?.tracking?.awb, q]);

  const saveAwb = async () => {
    if (!result?.order?.id) {
      setError("Open an RYVON order first, then save AWB");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await adminPatchOrder(result.order.id, { awb: awbDraft.trim() });
      setResult((r) => ({ ...r, order: updated, tracking: updated.tracking || r?.tracking }));
      await search(updated.code);
      await loadLive();
    } catch (e) {
      setError(e.message || "Could not save AWB");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase">Track Order</h1>
          <p className="mt-1 text-sm text-mute">Live NimbusPost tracking by Order ID or AWB</p>
        </div>
        <button
          type="button"
          onClick={loadLive}
          className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase hover:border-tss"
        >
          Refresh live
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(q);
        }}
        className="mt-5 flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="RYV order ID or AWB"
          className="w-full max-w-md border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
        />
        <button type="submit" disabled={busy} className="bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60">
          {busy ? "…" : "Track"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm font-semibold text-tss">{error}</p>}

      {result && (
        <div className="mt-5 space-y-3">
          <TrackingCard tracking={result.tracking} order={result.order} />
          {result.order && (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[11px] font-bold uppercase text-mute">Attach / update AWB</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={awbDraft}
                  onChange={(e) => setAwbDraft(e.target.value)}
                  placeholder="NimbusPost AWB"
                  className="min-w-[180px] flex-1 border border-line px-3 py-2 text-sm outline-none focus:border-tss"
                />
                <button
                  type="button"
                  onClick={saveAwb}
                  disabled={busy}
                  className="bg-ink px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-60"
                >
                  Save AWB
                </button>
              </div>
              {result.order.items?.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-mute">
                  {result.order.items.map((i, idx) => (
                    <li key={idx}>• {i.name} · UK {i.size} ×{i.qty}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide">Live shipments</h2>
      {liveErr && <p className="mt-2 text-xs font-semibold text-tss">{liveErr}</p>}
      <div className="mt-3 space-y-3">
        {live.length === 0 && (
          <p className="rounded-xl border border-line bg-white p-6 text-center text-sm text-mute">
            No AWBs saved yet. Open an order, add the NimbusPost AWB, then tracking appears here automatically.
          </p>
        )}
        {live.map((row) => (
          <button
            key={row.order?.id || row.order?.code}
            type="button"
            onClick={() => {
              const id = row.order?.code || row.order?.awb;
              setQ(id || "");
              if (id) search(id);
            }}
            className="block w-full text-left"
          >
            <TrackingCard tracking={row.tracking} order={row.order} />
          </button>
        ))}
      </div>

      <p className="mt-6 text-xs text-mute">
        Customer track page: <Link to="/track" className="font-semibold text-tss underline">/track</Link>
      </p>
    </div>
  );
}
