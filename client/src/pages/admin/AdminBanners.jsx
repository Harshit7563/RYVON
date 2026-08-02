import { useEffect, useState } from "react";
import {
  adminBanners,
  adminCreateBanner,
  adminDeleteBanner,
  adminUpdateBanner,
  mediaUrl,
} from "../../api";
import ImageUploadField from "../../components/admin/ImageUploadField";

const EMPTY = {
  type: "hero",
  title: "",
  subtitle: "",
  cta: "Shop Now",
  link: "/shop",
  image: "",
  sort: "1",
  active: true,
};

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = () => adminBanners().then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const shown = filter === "all" ? list : list.filter((b) => b.type === filter);

  const startEdit = (b) => {
    setEditId(b.id);
    setForm({
      type: b.type || "hero",
      title: b.title,
      subtitle: b.subtitle || "",
      cta: b.cta || "Shop Now",
      link: b.link || "/shop",
      image: b.image,
      sort: String(b.sort ?? 1),
      active: b.active !== false,
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
    if (!form.image?.trim()) {
      setError("Please upload a banner image");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = { ...form, sort: Number(form.sort || 1) };
      if (editId) await adminUpdateBanner(editId, body);
      else await adminCreateBanner(body);
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await adminDeleteBanner(id);
    await load();
  };

  const toggleActive = async (b) => {
    await adminUpdateBanner(b.id, { ...b, active: !(b.active !== false) });
    await load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase">Banners</h1>
          <p className="mt-1 text-sm text-mute">Custom add · any image type for hero & promo</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm({ ...EMPTY, image: "" });
            setOpen(true);
          }}
          className="bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white"
        >
          Add Banner
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {["all", "hero", "promo"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase ${
              filter === t ? "bg-tss text-white" : "bg-white text-mute border border-line"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {open && (
        <form onSubmit={save} className="mt-5 rounded-xl border border-line bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase">{editId ? "Edit Banner" : "New Banner"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className="border border-line px-3 py-2.5 text-sm">
              <option value="hero">Hero (main slider)</option>
              <option value="promo">Promo tile</option>
            </select>
            <input type="number" placeholder="Sort order" value={form.sort} onChange={(e) => set("sort", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input required placeholder="Title *" value={form.title} onChange={(e) => set("title", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss sm:col-span-2" />
            <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss sm:col-span-2" />
            <input placeholder="CTA text" value={form.cta} onChange={(e) => set("cta", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input placeholder="Link (/shop?sale=1)" value={form.link} onChange={(e) => set("link", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />

            <ImageUploadField
              label="Banner image *"
              value={form.image}
              onChange={(url) => set("image", url)}
              disabled={busy}
              preview="wide"
            />

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              Active on website
            </label>
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-tss">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={busy} className="bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={reset} className="border border-line px-4 py-2.5 text-xs font-bold uppercase">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {shown.length === 0 && (
          <p className="col-span-full rounded-xl border border-line bg-white p-8 text-center text-mute">No banners</p>
        )}
        {shown.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className="relative aspect-[16/7] bg-wash">
              <img src={mediaUrl(b.image)} alt={b.title} className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {b.type}
              </span>
              {b.active === false && (
                <span className="absolute right-2 top-2 rounded bg-mute px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Hidden
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold uppercase">{b.title}</p>
              {b.subtitle && <p className="mt-0.5 text-xs text-mute">{b.subtitle}</p>}
              <p className="mt-1 truncate text-[11px] text-mute">{b.link}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(b)} className="text-xs font-bold uppercase underline">Edit</button>
                <button type="button" onClick={() => toggleActive(b)} className="text-xs font-bold uppercase underline">
                  {b.active !== false ? "Hide" : "Show"}
                </button>
                <button type="button" onClick={() => remove(b.id)} className="text-xs font-bold uppercase text-tss underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
