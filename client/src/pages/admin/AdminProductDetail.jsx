import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminProducts, adminUpdateProduct, inr, mediaUrl } from "../../api";

function gallery(p) {
  const imgs = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
  if (imgs.length) return imgs;
  return p?.image ? [p.image] : ["/products/p1.jpg"];
}

export default function AdminProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [img, setImg] = useState(0);

  const load = async () => {
    try {
      const list = await adminProducts();
      const p = (Array.isArray(list) ? list : []).find((x) => String(x.id) === String(id));
      if (!p) {
        setError("Product not found");
        setProduct(null);
        return;
      }
      setProduct(p);
      setImg(0);
    } catch (e) {
      setError(e.message || "Could not load product");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const patch = async (body) => {
    if (!product) return;
    setBusy(true);
    setError("");
    try {
      const updated = await adminUpdateProduct(product.id, body);
      setProduct(updated);
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  if (error && !product) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p className="font-display text-xl font-extrabold uppercase">{error}</p>
        <Link to="/admin/products" className="mt-4 inline-block text-sm font-bold text-tss underline">
          Back to products
        </Link>
      </div>
    );
  }

  if (!product) return <p className="text-mute">Loading product…</p>;

  const images = gallery(product);
  const colors = Array.isArray(product.colorOptions) ? product.colorOptions : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const features = Array.isArray(product.features) ? product.features : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/products" className="text-[11px] font-bold uppercase text-mute hover:text-tss">
            ← Products
          </Link>
          <h1 className="font-display mt-1 text-2xl font-extrabold uppercase">{product.name}</h1>
          <p className="text-sm text-mute">{product.type}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/product/${product.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase hover:border-tss"
          >
            View on site
          </Link>
          <button
            type="button"
            onClick={() => nav(`/admin/products?edit=${product.id}`)}
            className="rounded-lg bg-ink px-3 py-2 text-[11px] font-bold uppercase text-white"
          >
            Edit
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-tss">{error}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="aspect-square overflow-hidden bg-wash">
            <img
              src={mediaUrl(images[img] || images[0])}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/products/p1.jpg";
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setImg(i)}
                className={`h-16 w-16 overflow-hidden border-2 ${img === i ? "border-tss" : "border-line"}`}
              >
                <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-mute">Price</p>
                <p className="font-display text-2xl font-extrabold">{inr(product.price)}</p>
                {product.mrp > product.price && (
                  <p className="text-mute line-through">{inr(product.mrp)}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${product.active !== false ? "bg-off/15 text-off" : "bg-wash text-mute"}`}>
                  {product.active !== false ? "Live" : "Hidden"}
                </span>
                {product.featuredTop && (
                  <span className="rounded bg-tss/10 px-2 py-1 text-[10px] font-bold uppercase text-tss">Pinned top</span>
                )}
              </div>
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-3">
              <div className="flex justify-between gap-3"><dt className="text-mute">SKU</dt><dd className="font-semibold">RYV-{String(product.id).padStart(4, "0")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mute">Category</dt><dd className="capitalize font-semibold">{product.category}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mute">Badge</dt><dd className="font-semibold">{product.badge || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mute">Updated</dt><dd>{product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "—"}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => patch({ active: !(product.active !== false) })}
                className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-60"
              >
                {product.active !== false ? "Hide" : "Publish"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => patch({ featuredTop: !product.featuredTop })}
                className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-60"
              >
                {product.featuredTop ? "Unpin from top" : "Pin to top"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-bold uppercase text-mute">Colors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.length === 0 && <p className="text-sm text-mute">—</p>}
              {colors.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-2 rounded-full border border-line px-2 py-1 text-xs">
                  <span className="h-4 w-4 rounded-full border border-line" style={{ background: c.hex || c }} />
                  {c.name || c}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase text-mute">UK sizes & stock</p>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {sizes.map((s) => (
                <li key={s} className="rounded border border-line px-2 py-1.5 text-center text-xs">
                  <p className="font-bold">UK {s}</p>
                  <p className="text-mute">{product.stock?.[String(s)] ?? "—"} left</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-white p-4">
        <p className="text-[11px] font-bold uppercase text-mute">Description</p>
        <p className="mt-2 text-sm leading-relaxed text-[#444]">{product.description || "No description yet."}</p>
        {features.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
