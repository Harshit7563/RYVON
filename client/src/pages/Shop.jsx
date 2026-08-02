import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, getProducts } from "../api";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [tabs, setTabs] = useState([{ id: "all", label: "All" }]);
  const [loading, setLoading] = useState(true);

  const category = params.get("category") || "all";
  const sort = params.get("sort") || "";
  const search = params.get("search") || "";
  const sale = params.get("sale") || "";

  useEffect(() => {
    getCategories()
      .then((cats) => {
        const dynamic = cats
          .filter((c) => c.filter !== "sale")
          .map((c) => ({ id: c.filter || c.id, label: c.name }));
        setTabs([{ id: "all", label: "All" }, ...dynamic]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = {};
    if (category !== "all") q.category = category;
    if (sort) q.sort = sort;
    if (search) q.search = search;
    if (sale) q.sale = sale;
    getProducts(q).then(setProducts).catch(console.error).finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [category, sort, search, sale]);

  const set = (key, val) => {
    const next = new URLSearchParams(params);
    if (key === "category") {
      next.delete("sale");
      if (val && val !== "all") next.set("category", val);
      else next.delete("category");
    } else if (val && val !== "all") next.set(key, val);
    else next.delete(key);
    setParams(next);
  };

  const title = search ? `Search: “${search}”` : sale ? "Sale" : "All Footwear";
  const activeTab = sale ? null : category;

  return (
    <div className="mx-auto max-w-[1280px] px-3 py-5 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
      <h1 className="font-display text-xl font-extrabold uppercase tracking-wide sm:text-3xl">{title}</h1>
      <p className="mt-0.5 text-xs text-mute sm:text-sm">{products.length} products</p>

      <div className="sticky top-[88px] z-30 -mx-3 mt-4 border-y border-line bg-white/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none lg:top-auto">
        <div className="flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set("category", t.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold uppercase sm:px-4 sm:text-xs ${
                  activeTab === t.id ? "bg-tss text-white" : "bg-wash text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("category");
                next.set("sale", "1");
                setParams(next);
              }}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold uppercase sm:px-4 sm:text-xs ${
                sale ? "bg-tss text-white" : "bg-wash text-ink"
              }`}
            >
              Sale
            </button>
          </div>
          <select
            value={sort}
            onChange={(e) => set("sort", e.target.value)}
            className="w-full border border-line bg-white px-3 py-2.5 text-sm outline-none sm:w-auto"
          >
            <option value="">Sort: Popular</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-wash" />
              <div className="mt-2 h-3 w-2/3 bg-wash" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-mute">No products found</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
