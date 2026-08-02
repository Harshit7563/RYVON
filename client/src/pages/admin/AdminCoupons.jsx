import { useEffect, useState } from "react";
import {
  adminCoupons,
  adminCreateCoupon,
  adminDeleteCoupon,
  adminUpdateCoupon,
  inr,
} from "../../api";

const EMPTY = {
  code: "",
  type: "percent",
  value: "10",
  minOrder: "0",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  active: true,
};

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => adminCoupons().then(setList).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({
      code: c.code || "",
      type: c.type === "fixed" ? "fixed" : "percent",
      value: String(c.value ?? ""),
      minOrder: String(c.minOrder ?? 0),
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? String(c.expiresAt).slice(0, 10) : "",
      active: c.active !== false,
    });
    setOpen(true);
  };

  const reset = () => {
    setEditId(null);
    setForm(EMPTY);
    setOpen(false);
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError("Coupon code required");
      return;
    }
    if (!Number(form.value) || Number(form.value) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        expiresAt: form.expiresAt || null,
        active: form.active,
      };
      if (editId) await adminUpdateCoupon(editId, body);
      else await adminCreateCoupon(body);
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    await adminDeleteCoupon(id);
    await load();
  };

  const toggleActive = async (c) => {
    await adminUpdateCoupon(c.id, { ...c, active: !(c.active !== false) });
    await load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase">Coupons</h1>
          <p className="mt-1 text-sm text-mute">Create codes · % or flat discount</p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="rounded-lg bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white"
        >
          + New Coupon
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="mt-5 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Code</span>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="RYVON10"
                className="w-full border border-line px-3 py-2.5 text-sm uppercase outline-none focus:border-tss"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Type</span>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase text-mute">
                {form.type === "percent" ? "Discount %" : "Discount ₹"}
              </span>
              <input
                type="number"
                min="1"
                max={form.type === "percent" ? 100 : undefined}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Min order ₹</span>
              <input
                type="number"
                min="0"
                value={form.minOrder}
                onChange={(e) => set("minOrder", e.target.value)}
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
              />
            </label>
            {form.type === "percent" && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Max discount ₹ (optional)</span>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => set("maxDiscount", e.target.value)}
                  placeholder="No cap"
                  className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Usage limit (optional)</span>
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="Unlimited"
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Expires (optional)</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              Active
            </label>
          </div>
          {error && <p className="mt-3 text-xs font-semibold text-tss">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : editId ? "Update Coupon" : "Create Coupon"}
            </button>
            <button type="button" onClick={reset} className="rounded-lg border border-line px-4 py-2.5 text-xs font-bold uppercase">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {list.length === 0 && (
          <p className="rounded-xl border border-line bg-white p-8 text-center text-mute">No coupons yet</p>
        )}
        {list.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-extrabold tracking-wide">{c.code}</p>
                <p className="mt-1 text-sm text-mute">
                  {c.type === "percent" ? `${c.value}% off` : `${inr(c.value)} off`}
                  {c.minOrder > 0 ? ` · Min ${inr(c.minOrder)}` : ""}
                  {c.type === "percent" && c.maxDiscount ? ` · Cap ${inr(c.maxDiscount)}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-mute">
                  Used {c.usedCount || 0}
                  {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  {c.expiresAt ? ` · Expires ${String(c.expiresAt).slice(0, 10)}` : " · No expiry"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(c)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                    c.active !== false ? "bg-off/15 text-off" : "bg-wash text-mute"
                  }`}
                >
                  {c.active !== false ? "Live" : "Off"}
                </button>
                <button type="button" onClick={() => startEdit(c)} className="text-xs font-bold uppercase underline">
                  Edit
                </button>
                <button type="button" onClick={() => remove(c.id)} className="text-xs font-bold uppercase text-tss underline">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
