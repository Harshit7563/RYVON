import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct, getRelated, inr, mediaUrl } from "../api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { SIZE_CHART } from "../data/sizeChart";
import ProductCard from "../components/ProductCard";

const FALLBACK_SWATCHES = [
  { name: "Black", hex: "#111111" },
  { name: "Red", hex: "#c4121a" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Beige", hex: "#e8e4d9" },
  { name: "Grey", hex: "#6b7280" },
];

function productColors(product) {
  if (Array.isArray(product?.colorOptions) && product.colorOptions.length) {
    return product.colorOptions.map((c) =>
      typeof c === "string" ? { name: c, hex: c } : { name: c.name || "Color", hex: c.hex || "#111111" }
    );
  }
  const n = Math.min(Math.max(Number(product?.colors) || 3, 1), FALLBACK_SWATCHES.length);
  return FALLBACK_SWATCHES.slice(0, n);
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-[13px] font-bold uppercase tracking-[0.06em]">{title}</span>
        <span className="text-lg leading-none text-mute">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-4 text-[13px] leading-relaxed text-[#555]">{children}</div>}
    </div>
  );
}

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(0);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [sizeHint, setSizeHint] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSize(null);
    setColor(0);
    setQty(1);
    window.scrollTo(0, 0);
    Promise.all([getProduct(id), getRelated(id)])
      .then(([p, r]) => {
        setProduct(p);
        setImg(0);
        setRelated(r);
        if (p?.name) document.title = `${p.name} — RYVON`;
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => {
      document.title = "RYVON — Homegrown Indian Footwear";
    };
  }, [id]);

  const addBag = (goCheckout = false) => {
    if (!product) return;
    if (!size) {
      setSizeHint(true);
      return;
    }
    const left = Math.max(0, Number(product.stock?.[String(size)]) || 0);
    if (left <= 0) {
      setSizeHint(true);
      return;
    }
    const buyQty = Math.min(qty, left);
    const swatches = productColors(product);
    const picked = swatches[Math.min(color, swatches.length - 1)] || swatches[0];
    for (let i = 0; i < buyQty; i++) add(product, size, picked?.hex || "#111111");
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    if (goCheckout) nav("/checkout");
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-[1280px] gap-6 px-3 py-6 sm:gap-8 sm:px-4 sm:py-10 lg:grid-cols-2 lg:px-6">
        <div className="aspect-square animate-pulse bg-wash" />
        <div className="space-y-3 pt-2">
          <div className="h-7 w-2/3 animate-pulse bg-wash" />
          <div className="h-5 w-1/3 animate-pulse bg-wash" />
          <div className="h-24 animate-pulse bg-wash" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl font-bold uppercase">Product not found</p>
        <Link to="/shop" className="mt-4 inline-block text-sm font-bold text-tss underline">Back to shop</Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image || "/products/p1.jpg"].filter(Boolean);
  const features = Array.isArray(product.features) ? product.features : [];
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [7, 8, 9, 10, 11];
  const colors = productColors(product);
  const selectedColor = colors[Math.min(color, colors.length - 1)] || colors[0];
  const off = (product.mrp || product.price) - product.price;
  const offPct = product.mrp ? Math.round((off / product.mrp) * 100) : 0;
  const stockLeft = size != null ? Math.max(0, Number(product.stock?.[String(size)]) || 0) : 0;
  const maxQty = stockLeft > 0 ? Math.min(stockLeft, 20) : 0;

  return (
    <div className="mx-auto max-w-[1280px] px-0 pb-28 sm:px-4 sm:pb-10 lg:px-6 lg:py-8">
      {/* Breadcrumb */}
      <nav className="hidden items-center gap-2 px-0 pb-4 text-xs text-mute sm:flex">
        <Link to="/" className="hover:text-tss">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-tss">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category}`} className="capitalize hover:text-tss">{product.category}</Link>
        <span>/</span>
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-0 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-square overflow-hidden bg-wash sm:rounded-sm">
            {product.badge && (
              <span className="absolute left-3 top-3 z-10 bg-tss px-2 py-1 text-[10px] font-bold uppercase text-white">
                {product.badge}
              </span>
            )}
            <button
              type="button"
              onClick={() => toggle(product.id)}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"
              aria-label="Wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={has(product.id) ? "#ec1c24" : "none"} stroke={has(product.id) ? "#ec1c24" : "currentColor"} strokeWidth="2">
                <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
              </svg>
            </button>
            <img
              src={mediaUrl(images[img] || images[0])}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }}
            />
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-3 sm:px-0">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImg(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden border-2 sm:h-[72px] sm:w-[72px] ${
                  img === i ? "border-tss" : "border-line"
                }`}
              >
                <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }} />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="px-3 pt-4 sm:px-0 sm:pt-0">
          {product.badge && (
            <span className="inline-block bg-tss px-2 py-0.5 text-[10px] font-bold uppercase text-white sm:hidden">
              {product.badge}
            </span>
          )}
          <h1 className="font-display mt-1 text-[22px] font-extrabold uppercase leading-tight tracking-wide sm:mt-0 sm:text-[28px]">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-mute">{product.type}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-2xl font-bold">{inr(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-base text-mute line-through">{inr(product.mrp)}</span>
                <span className="rounded bg-[#e8f5ec] px-2 py-0.5 text-xs font-bold text-off">
                  {offPct}% OFF · ₹{off} OFF
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[12px] text-mute">Inclusive of all taxes · Extra 5% off on prepaid (UPI / card)</p>

          {/* Colors */}
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider">
              Color{" "}
              <span className="font-semibold normal-case text-mute">
                · {selectedColor?.name || `Option ${color + 1}`}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <button
                  key={`${c.hex}-${i}`}
                  type="button"
                  onClick={() => setColor(i)}
                  title={c.name}
                  className={`h-9 w-9 rounded-full border-2 ${
                    color === i ? "border-tss ring-2 ring-tss/20" : "border-line"
                  }`}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider">
                Select Size (UK) {!size && <span className="text-tss">*</span>}
              </p>
              <button
                type="button"
                onClick={() => setSizeGuide(true)}
                className="text-[11px] font-bold uppercase tracking-wide text-tss underline underline-offset-2"
              >
                Size Guide
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const qtyLeft = product.stock?.[String(s)];
                const oos = qtyLeft != null && Number(qtyLeft) <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={oos}
                    onClick={() => {
                      if (oos) return;
                      setSize(s);
                      setSizeHint(false);
                      const left = Math.max(0, Number(product.stock?.[String(s)]) || 0);
                      setQty((q) => Math.min(Math.max(1, q), Math.max(1, left)));
                    }}
                    className={`relative grid h-11 min-w-11 place-items-center border px-2 text-sm font-bold transition ${
                      oos
                        ? "cursor-not-allowed border-line text-mute line-through opacity-50"
                        : size === s
                          ? "border-tss bg-tss text-white"
                          : "border-line hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {sizeHint && <p className="mt-2 text-xs font-semibold text-tss">Please select a size</p>}
            <Link to="/size-chart" className="mt-2 inline-block text-[11px] font-bold uppercase text-mute underline hover:text-tss">
              Full size chart →
            </Link>
          </div>

          {/* Qty */}
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider">Quantity</p>
            <div className="mt-2 inline-flex border border-line">
              <button type="button" className="h-10 w-10 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="grid h-10 w-10 place-items-center border-x border-line text-sm font-bold">{qty}</span>
              <button
                type="button"
                className="h-10 w-10 text-lg disabled:opacity-40"
                disabled={!size || maxQty <= 0 || qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
              >
                +
              </button>
            </div>
            {size && (
              <p className="mt-1.5 text-xs text-mute">
                {stockLeft > 0 ? `${stockLeft} in stock` : "Out of stock"}
              </p>
            )}
          </div>

          {/* Desktop CTAs */}
          <div className="mt-6 hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => addBag(false)}
              className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wide transition ${
                added ? "bg-off text-white" : "bg-tss text-white hover:bg-tss-dark"
              }`}
            >
              {added ? "Added to Cart ✓" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={() => addBag(true)}
              className="flex-1 border-2 border-ink py-3.5 text-xs font-bold uppercase tracking-wide hover:bg-ink hover:text-white"
            >
              Buy Now
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-5 grid grid-cols-3 gap-2 border border-line bg-wash/60 p-3 text-center">
            {[
              ["Free Ship", "Above ₹999"],
              ["Easy Returns", "7 Days"],
              ["COD", "Available"],
            ].map(([t, s]) => (
              <div key={t}>
                <p className="text-[11px] font-bold uppercase">{t}</p>
                <p className="text-[10px] text-mute">{s}</p>
              </div>
            ))}
          </div>

          {/* Accordions — product details */}
          <div className="mt-6 border-t border-line">
            <Accordion title="Product Details" defaultOpen>
              <p>{product.description || `${product.name} — RYVON original footwear.`}</p>
              {features.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-tss">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <p><span className="font-semibold text-ink">Category:</span> {product.category}</p>
                <p><span className="font-semibold text-ink">Type:</span> {product.type}</p>
                <p><span className="font-semibold text-ink">SKU:</span> RYV-{product.id.toString().padStart(4, "0")}</p>
                <p><span className="font-semibold text-ink">Country:</span> Made in India</p>
              </div>
            </Accordion>
            <Accordion title="Material & Care">
              <ul className="space-y-1.5">
                <li>• Upper: Premium mesh / synthetic overlays</li>
                <li>• Midsole: Cushion foam for all-day comfort</li>
                <li>• Outsole: High-grip rubber</li>
                <li>• Wipe with a soft dry cloth; air dry away from heat</li>
                <li>• Avoid machine wash & harsh detergents</li>
              </ul>
            </Accordion>
            <Accordion title="Shipping & Delivery">
              <ul className="space-y-1.5">
                <li>• Free shipping on orders above ₹999</li>
                <li>• Standard delivery: 3–6 business days</li>
                <li>• Express options available at checkout</li>
                <li>• Track your order from the RYVON account / app</li>
              </ul>
            </Accordion>
            <Accordion title="Returns & Exchange">
              <ul className="space-y-1.5">
                <li>• Easy 7-day returns & exchange</li>
                <li>• Product must be unused with original tags</li>
                <li>• Size exchanges subject to availability</li>
                <li>• Refunds processed within 5–7 business days</li>
              </ul>
            </Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line px-3 pt-8 sm:mt-14 sm:px-0 sm:pt-10">
          <h2 className="section-title">You May Also Like</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 md:grid-cols-4 md:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-40 border-t border-line bg-white p-3 sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={() => addBag(false)}
            className={`flex-1 py-3.5 text-[11px] font-bold uppercase ${
              added ? "bg-off text-white" : "bg-tss text-white"
            }`}
          >
            {added ? "Added ✓" : "Add to Cart"}
          </button>
          <button
            type="button"
            onClick={() => addBag(true)}
            className="flex-1 border-2 border-ink py-3 text-[11px] font-bold uppercase"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Size guide modal */}
      {sizeGuide && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setSizeGuide(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold uppercase">Size Guide</h3>
              <button type="button" onClick={() => setSizeGuide(false)} className="grid h-9 w-9 place-items-center" aria-label="Close">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6"/></svg>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-wash text-[11px] font-bold uppercase tracking-wide">
                    <th className="px-2 py-2.5">UK</th>
                    <th className="px-2 py-2.5">US</th>
                    <th className="px-2 py-2.5">EU</th>
                    <th className="px-2 py-2.5">CM</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((r) => (
                    <tr key={r.uk} className={`border-b border-line ${size === r.uk ? "bg-tss/5 font-bold text-tss" : ""}`}>
                      <td className="py-2.5">{r.uk}</td>
                      <td className="py-2.5">{r.us}</td>
                      <td className="py-2.5">{r.eu}</td>
                      <td className="py-2.5">{r.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-mute">Tip: measure your foot length in CM for the best fit.</p>
            <Link to="/size-chart" onClick={() => setSizeGuide(false)} className="mt-3 inline-block text-xs font-bold uppercase text-tss underline">
              Open full size chart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
