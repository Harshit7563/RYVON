import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getBanners, getCategories, getProducts, mediaUrl } from "../api";
import ProductCard from "../components/ProductCard";

function ProductRail({ title, subtitle, products, viewAll, loading }) {
  return (
    <section className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1280px] px-3 sm:px-4 lg:px-6">
        <div className="mb-3 flex items-end justify-between gap-2 sm:mb-4">
          <div className="min-w-0">
            <h2 className="section-title text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-mute sm:text-xs">
                {subtitle}
              </p>
            )}
          </div>
          {viewAll && (
            <Link to={viewAll} className="shrink-0 text-[10px] font-bold uppercase text-tss underline underline-offset-2 sm:text-xs">
              View All
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-wash" />
                  <div className="mt-2 h-3 w-3/4 bg-wash" />
                  <div className="mt-1 h-3 w-1/2 bg-wash" />
                </div>
              ))
            : products.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [heroes, setHeroes] = useState([]);
  const [promos, setPromos] = useState([]);
  const [cats, setCats] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [loading, setLoading] = useState(true);
  const touchX = useRef(null);

  useEffect(() => {
    if (!heroes.length) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % heroes.length), 5000);
    return () => clearInterval(t);
  }, [heroes.length]);

  useEffect(() => {
    Promise.all([
      getBanners({ type: "hero" }),
      getBanners({ type: "promo" }),
      getCategories(),
      getProducts({ section: "fresh" }),
    ])
      .then(([hero, promo, c, f]) => {
        setHeroes(hero);
        setPromos(promo);
        setCats(c);
        setFresh(f.slice(0, 8));
        setSlide(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const b = heroes[slide];

  return (
    <div>
      {/* Hero — admin controlled */}
      {b ? (
        <section
          className="relative overflow-hidden bg-ink"
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current == null || heroes.length < 2) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (dx > 40) setSlide((s) => (s - 1 + heroes.length) % heroes.length);
            if (dx < -40) setSlide((s) => (s + 1) % heroes.length);
            touchX.current = null;
          }}
        >
          <Link to={b.link || "/shop"} className="relative block min-h-[220px] sm:min-h-[340px] lg:min-h-[440px]">
            <img
              key={b.id}
              src={mediaUrl(b.image)}
              alt={b.title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/30 sm:to-transparent" />
            <div className="relative z-10 flex min-h-[220px] flex-col justify-end px-4 py-8 text-white sm:min-h-[340px] sm:px-8 sm:py-12 lg:mx-auto lg:min-h-[440px] lg:max-w-[1280px] lg:px-6 lg:py-14">
              {b.subtitle && (
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 sm:text-xs">{b.subtitle}</p>
              )}
              <h1 className="font-display mt-1 text-[28px] font-extrabold uppercase leading-none tracking-wide sm:text-5xl lg:text-6xl">
                {b.title}
              </h1>
              <span className="mt-4 inline-flex w-fit bg-tss px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white sm:mt-5 sm:px-6 sm:py-3 sm:text-xs">
                {b.cta || "Shop Now"}
              </span>
            </div>
          </Link>
          {heroes.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-5">
              {heroes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-tss sm:w-8" : "w-3 bg-white/50 sm:w-4"}`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        !loading && (
          <div className="bg-wash px-4 py-16 text-center text-mute">
            No hero banners yet — add them from Admin → Banners
          </div>
        )
      )}

      {/* Categories — admin controlled */}
      <section className="border-b border-line bg-white py-5 sm:py-8">
        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 lg:px-6">
          <h2 className="section-title mb-4 text-center sm:mb-5">Categories</h2>
          <div className="snap-row no-scrollbar flex justify-start gap-4 overflow-x-auto px-1 pb-1 sm:justify-center sm:gap-7 sm:overflow-visible">
            {cats.map((c) => (
              <Link key={c.id} to={c.to} className="snap-card flex w-[70px] shrink-0 flex-col items-center gap-1.5 sm:w-[90px]">
                <span className="h-16 w-16 overflow-hidden rounded-full border border-line bg-wash shadow-sm transition hover:border-tss sm:h-[84px] sm:w-[84px]">
                  <img src={mediaUrl(c.image)} alt={c.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }} />
                </span>
                <span className="text-center text-[10px] font-bold uppercase tracking-wide sm:text-[11px]">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductRail title="Fresh Out The Lab" subtitle="Just dropped kicks" products={fresh} viewAll="/shop?sort=newest" loading={loading} />

      {/* Promo tiles — admin controlled */}
      {promos.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-3 py-2 sm:px-4 sm:py-4 lg:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {promos.map((t) => (
              <Link key={t.id} to={t.link || "/shop"} className="group relative aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
                <img src={mediaUrl(t.image)} alt={t.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }} />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-4 sm:p-6">
                  <h3 className="font-display text-xl font-extrabold uppercase text-white sm:text-2xl">{t.title}</h3>
                  <span className="mt-2 bg-white px-3 py-1.5 text-[10px] font-bold uppercase text-ink sm:text-[11px]">
                    {t.cta || "Shop Now"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="bg-tss px-3 py-3 text-center text-white sm:py-4">
        <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.1em] sm:text-sm">
          Made to move. Built to stand out · Extra 5% off when you choose prepaid at checkout
        </p>
      </div>

      <section className="bg-wash px-4 py-10 text-center sm:py-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tss sm:text-xs">Ryvon Original</p>
        <h2 className="font-display mt-2 text-xl font-extrabold uppercase sm:text-3xl">
          Over 50,000 Happy Feet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-mute sm:mt-3 sm:text-sm">
          From street to stadium — RYVON is built for Indian roads, courts, and everyday hustle.
        </p>
        <div className="mt-5 sm:mt-6">
          <Link
            to="/shop"
            className="inline-flex items-center justify-center bg-ink px-7 py-3 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-tss hover:text-white sm:text-xs"
          >
            Shop All Shoes
          </Link>
        </div>
      </section>
    </div>
  );
}
