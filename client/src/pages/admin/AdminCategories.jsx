import { useEffect, useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminCategories,
  adminUpdateCategory,
  mediaUrl,
} from "../../api";
import ImageUploadField from "../../components/admin/ImageUploadField";

const EMPTY = {
  name: "",
  slug: "",
  filter: "",
  image: "",
  to: "",
  sort: "1",
  active: true,
};

export default function AdminCategories() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => adminCategories().then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      slug: c.slug || c.id,
      filter: c.filter || c.slug || "",
      image: c.image,
      to: c.to || "",
      sort: String(c.sort ?? 1),
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
    if (!form.image?.trim()) {
      setError("Please upload a category image");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        sort: Number(form.sort || 1),
        slug: form.slug || form.name,
        filter: form.filter || form.slug || form.name,
      };
      if (editId) await adminUpdateCategory(editId, body);
      else await adminCreateCategory(body);
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this category?")) return;
    await adminDeleteCategory(id);
    await load();
  };

  const toggleActive = async (c) => {
    await adminUpdateCategory(c.id, { ...c, active: !(c.active !== false) });
    await load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase">Categories</h1>
          <p className="mt-1 text-sm text-mute">Custom add · any image type for home circles</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setForm({ ...EMPTY, image: "", sort: String(list.length + 1) });
            setOpen(true);
          }}
          className="bg-tss px-4 py-2.5 text-xs font-bold uppercase text-white"
        >
          Add Category
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="mt-5 rounded-xl border border-line bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase">{editId ? "Edit Category" : "New Category"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required placeholder="Name *" value={form.name} onChange={(e) => set("name", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input placeholder="Slug (sneakers)" value={form.slug} onChange={(e) => set("slug", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input placeholder="Filter key (air-force / sale)" value={form.filter} onChange={(e) => set("filter", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />
            <input placeholder="Sort order" type="number" value={form.sort} onChange={(e) => set("sort", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss" />

            <ImageUploadField
              label="Category photo"
              value={form.image}
              onChange={(url) => set("image", url)}
              disabled={busy}
              variant="avatar"
            />

            <input placeholder="Custom link (optional)" value={form.to} onChange={(e) => set("to", e.target.value)} className="border border-line px-3 py-2.5 text-sm outline-none focus:border-tss sm:col-span-2" />
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

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-line bg-wash text-[11px] uppercase text-mute">
            <tr>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Filter</th>
              <th className="px-3 py-3">Sort</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={mediaUrl(c.image)} alt="" className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-mute">{c.slug || c.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{c.filter}</td>
                <td className="px-3 py-3">{c.sort}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                      c.active !== false ? "bg-off/15 text-off" : "bg-wash text-mute"
                    }`}
                  >
                    {c.active !== false ? "Active" : "Hidden"}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(c)} className="text-xs font-bold uppercase underline">Edit</button>
                    <button type="button" onClick={() => remove(c.id)} className="text-xs font-bold uppercase text-tss underline">Delete</button>
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
