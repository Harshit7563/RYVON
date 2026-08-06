import { useEffect, useRef, useState } from "react";
import {
  adminCategories,
  adminCreateProduct,
  adminDeleteProduct,
  adminProducts,
  adminUpdateProduct,
  adminUpload,
  fileToDataUrl,
  inr,
  mediaUrl,
} from "../../api";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { ALL_UK_SIZES, defaultStock } from "../../data/sizeChart";

const PRESET_COLORS = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Red", hex: "#c4121a" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Beige", hex: "#e8e4d9" },
  { name: "Brown", hex: "#6b4423" },
  { name: "Green", hex: "#1f5c3a" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Orange", hex: "#ea580c" },
];

const EMPTY = () => ({
  name: "",
  type: "Men Low Top Sneakers",
  category: "air-force",
  price: "",
  mrp: "",
  badge: "",
  description: "",
  featuresText: "Premium build|Everyday comfort",
  active: true,
  images: [],
  colorOptions: [
    { name: "Black", hex: "#111111" },
    { name: "White", hex: "#f5f5f5" },
  ],
  sizes: [7, 8, 9, 10, 11],
  stock: defaultStock([7, 8, 9, 10, 11], 10),
});

function normalizeColors(p) {
  if (Array.isArray(p?.colorOptions) && p.colorOptions.length) {
    return p.colorOptions.map((c) =>
      typeof c === "string" ? { name: c, hex: c } : { name: c?.name || "Color", hex: c?.hex || "#111111" }
    );
  }
  return PRESET_COLORS.slice(0, Math.min(Math.max(Number(p?.colors) || 2, 1), 5));
}

function normalizeSizes(p) {
  if (Array.isArray(p?.sizes) && p.sizes.length) return p.sizes.map(Number).filter((n) => !Number.isNaN(n));
  return [7, 8, 9, 10, 11];
}

function normalizeStock(p, sizes) {
  const stock = { ...(p?.stock || {}) };
  sizes.forEach((s) => {
    const k = String(s);
    if (stock[k] == null) stock[k] = 10;
  });
  return stock;
}

function featuresToText(features) {
  if (Array.isArray(features)) return features.filter(Boolean).join("|");
  if (typeof features === "string") return features;
  return "Premium build|Everyday comfort";
}

function formFromProduct(p) {
  const sizes = normalizeSizes(p);
  return {
    name: p?.name || "",
    type: p?.type || "Men Low Top Sneakers",
    category: p?.category || "air-force",
    price: p?.price != null ? String(p.price) : "",
    mrp: p?.mrp != null ? String(p.mrp) : "",
    badge: p?.badge || "",
    description: p?.description || "",
    featuresText: featuresToText(p?.features),
    active: p?.active !== false,
    images: p?.images?.length ? [...p.images] : p?.image ? [p.image] : [],
    colorOptions: normalizeColors(p),
    sizes,
    stock: normalizeStock(p, sizes),
  };
}

export default function AdminProducts() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const editIdRef = useRef(null);
  const formRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const load = () =>
    Promise.all([adminProducts(), adminCategories()])
      .then(([products, categories]) => {
        setList(Array.isArray(products) ? products : []);
        setCats((categories || []).filter((c) => (c.filter || c.slug) !== "sale"));
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setEditing = (id) => {
    editIdRef.current = id;
    setEditId(id);
  };

  const startEdit = (p) => {
    if (!p || p.id == null) {
      setError("Invalid product — refresh and try again");
      return;
    }
    setError("");
    setOkMsg("");
    setEditing(p.id);
    setForm(formFromProduct(p));
    setOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const reset = () => {
    setEditing(null);
    setForm(EMPTY());
    setOpen(false);
    setError("");
    setOkMsg("");
  };

  const toggleSize = (size) => {
    setForm((f) => {
      const has = f.sizes.includes(size);
      const sizes = has ? f.sizes.filter((s) => s !== size) : [...f.sizes, size].sort((a, b) => a - b);
      if (!sizes.length) return f;
      const stock = { ...f.stock };
      if (has) delete stock[String(size)];
      else if (stock[String(size)] == null) stock[String(size)] = 10;
      return { ...f, sizes, stock };
    });
  };

  const setStockQty = (size, qty) => {
    setForm((f) => ({
      ...f,
      stock: { ...f.stock, [String(size)]: Math.max(0, Number(qty) || 0) },
    }));
  };

  const addColor = (preset) => {
    setForm((f) => {
      if (f.colorOptions.some((c) => c.hex.toLowerCase() === preset.hex.toLowerCase())) return f;
      if (f.colorOptions.length >= 8) return f;
      return { ...f, colorOptions: [...f.colorOptions, { ...preset }] };
    });
  };

  const updateColor = (idx, patch) => {
    setForm((f) => ({
      ...f,
      colorOptions: f.colorOptions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const removeColor = (idx) => {
    setForm((f) => ({
      ...f,
      colorOptions: f.colorOptions.length <= 1 ? f.colorOptions : f.colorOptions.filter((_, i) => i !== idx),
    }));
  };

  const onMainImage = (url) => {
    setForm((f) => {
      const rest = f.images.filter((u) => u !== url);
      return { ...f, images: url ? [url, ...rest] : rest };
    });
  };

  const addGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type?.startsWith("image/") && !/\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(file.name)) {
      setError("Only image files allowed");
      return;
    }
    setUploadingExtra(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await adminUpload(dataUrl, file.name);
      setForm((f) => ({ ...f, images: [...f.images, url].slice(0, 6) }));
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadingExtra(false);
    }
  };

  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.images?.length) {
      setError("Upload at least one product image");
      return;
    }
    if (!form.colorOptions?.length) {
      setError("Add at least one shoe color");
      return;
    }
    if (!form.sizes?.length) {
      setError("Select at least one UK size");
      return;
    }
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      const colorOptions = form.colorOptions.map((c) => ({
        name: (c.name || "Color").trim(),
        hex: c.hex || "#111111",
      }));
      const features = form.featuresText
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        name: form.name,
        type: form.type,
        category: form.category,
        price: Number(form.price),
        mrp: Number(form.mrp || form.price),
        badge: form.badge || null,
        description: form.description,
        active: form.active,
        images: form.images,
        image: form.images[0],
        colorOptions,
        colors: colorOptions.length,
        sizes: form.sizes,
        stock: form.stock,
        features,
      };
      const currentId = editIdRef.current;
      if (currentId != null && currentId !== "") {
        const updated = await adminUpdateProduct(currentId, body);
        setForm(formFromProduct(updated));
        setEditing(updated.id);
        setOkMsg("Product updated");
      } else {
        const created = await adminCreateProduct(body);
        // Stay on the form in edit mode so admin can keep editing right away.
        setForm(formFromProduct(created));
        setEditing(created.id);
        setOpen(true);
        setOkMsg("Product added — ab aap edit kar sakte ho");
      }
      await load();
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await adminDeleteProduct(id);
      if (String(editIdRef.current) === String(id)) reset();
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const toggleActive = async (p) => {
    try {
      setError("");
      await adminUpdateProduct(p.id, { active: !(p.active !== false) });
      await load();
    } catch (err) {
      setError(err.message || "Could not update product");
    }
  };

  const catOptions = cats.length
    ? cats.map((c) => c.filter || c.slug || c.id)
    : ["air-force", "low-dunk", "travis-scott", "jordan", "retro", "samba"];
  const categoryChoices = form.category && !catOptions.includes(form.category)
    ? [form.category, ...catOptions]
    : catOptions;

  const shown = list.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      String(p.name || "").toLowerCase().includes(s) ||
      String(p.category || "").toLowerCase().includes(s) ||
      String(p.type || "").toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase">Products</h1>
          <p className="mt-1 text-sm text-mute">Images · colors · UK sizes · stock · publish</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm({ ...EMPTY(), category: catOptions[0] || "air-force" });
            setOkMsg("");
            setError("");
            setOpen(true);
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
          }}
          className="bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white"
        >
          Add Product
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        className="mt-4 w-full max-w-md border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
      />

      {open && (
        <form
          ref={formRef}
          onSubmit={save}
          className="mt-5 scroll-mt-4 rounded-xl border border-line bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-bold uppercase">
            {editId != null ? `Edit Product #${editId}` : "New Product"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required placeholder="Name *" value={form.name} onChange={(e) => set("name", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input placeholder="Type" value={form.type} onChange={(e) => set("type", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="border border-line px-3 py-2.5 text-sm">
              {categoryChoices.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input placeholder="Badge (NEW/HOT/...)" value={form.badge} onChange={(e) => set("badge", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input required type="number" placeholder="Price *" value={form.price} onChange={(e) => set("price", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input type="number" placeholder="MRP" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              Active on website (uncheck to hide)
            </label>

            <ImageUploadField
              label="Main product image *"
              value={form.images[0] || ""}
              onChange={onMainImage}
              disabled={busy}
              preview="square"
            />

            <div className="sm:col-span-2 rounded-lg border border-line bg-wash/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-mute">Gallery images (up to 6)</p>
                <label className="cursor-pointer bg-ink px-3 py-2 text-[10px] font-bold uppercase text-white">
                  {uploadingExtra ? "Uploading…" : "+ Add image"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingExtra || form.images.length >= 6} onChange={addGalleryImage} />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.images.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative">
                    <img src={mediaUrl(src)} alt="" className="h-16 w-16 object-cover border border-line" />
                    {i === 0 && (
                      <span className="absolute left-0 top-0 bg-tss px-1 text-[8px] font-bold uppercase text-white">Main</span>
                    )}
                    <button type="button" onClick={() => removeImage(i)} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-white">×</button>
                  </div>
                ))}
                {!form.images.length && <p className="text-xs text-mute">No gallery images yet</p>}
              </div>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-line bg-wash/40 p-3">
              <p className="text-xs font-bold uppercase text-mute">UK sizes & stock *</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_UK_SIZES.map((s) => {
                  const on = form.sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`min-w-[44px] border px-2 py-2 text-sm font-bold ${
                        on ? "border-tss bg-tss text-white" : "border-line bg-white text-mute"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {form.sizes.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded border border-line bg-white px-2 py-2 text-sm">
                    <span className="w-10 font-bold">UK {s}</span>
                    <input
                      type="number"
                      min="0"
                      value={form.stock[String(s)] ?? 0}
                      onChange={(e) => setStockQty(s, e.target.value)}
                      className="w-full border border-line px-2 py-1.5 text-sm outline-none focus:border-tss"
                    />
                    <span className="shrink-0 text-[10px] uppercase text-mute">qty</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-line bg-wash/40 p-3">
              <p className="text-xs font-bold uppercase text-mute">Shoe colors *</p>
              <div className="mt-3 space-y-2">
                {form.colorOptions.map((c, i) => (
                  <div key={`${c.hex}-${i}`} className="flex flex-wrap items-center gap-2 rounded border border-line bg-white p-2">
                    <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line">
                      <span className="absolute inset-0" style={{ background: c.hex }} />
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#111111"}
                        onChange={(e) => updateColor(i, { hex: e.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                    <input value={c.name} onChange={(e) => updateColor(i, { name: e.target.value })} placeholder="Color name" className="min-w-[120px] flex-1 border border-line px-2.5 py-2 text-sm outline-none focus:border-tss" />
                    <button type="button" onClick={() => removeColor(i)} disabled={form.colorOptions.length <= 1} className="px-2 py-2 text-[11px] font-bold uppercase text-tss disabled:opacity-30">Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_COLORS.map((p) => (
                  <button key={p.hex} type="button" title={p.name} onClick={() => addColor(p)} className="h-8 w-8 rounded-full border border-line" style={{ background: p.hex }} />
                ))}
              </div>
            </div>

            <textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss sm:col-span-2" />
            <input
              placeholder="Features (separate with | )"
              value={form.featuresText}
              onChange={(e) => set("featuresText", e.target.value)}
              className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss sm:col-span-2"
            />
          </div>
          {okMsg && <p className="mt-2 text-xs font-semibold text-off">{okMsg}</p>}
          {error && <p className="mt-2 text-xs font-semibold text-tss">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={busy || uploadingExtra} className="bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-60">
              {busy ? "Saving…" : editId != null ? "Update Product" : "Save Product"}
            </button>
            <button type="button" onClick={reset} className="border border-line px-4 py-2.5 text-xs font-bold uppercase">
              {editId != null ? "Close" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-wash text-[11px] uppercase text-mute">
            <tr>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-b border-line/70">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={mediaUrl(p.image)} alt="" className="h-12 w-12 object-cover" onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }} />
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-mute">{p.type} · {(p.sizes || []).join(", ")}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 capitalize">{p.category}</td>
                <td className="px-3 py-3">{inr(p.price)}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                      p.active !== false ? "bg-off/15 text-off" : "bg-wash text-mute"
                    }`}
                  >
                    {p.active !== false ? "Live" : "Hidden"}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(p)} className="text-xs font-bold uppercase text-ink underline">Edit</button>
                    <button type="button" onClick={() => remove(p.id)} className="text-xs font-bold uppercase text-tss underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
