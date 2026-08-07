import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { ids, clear } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getProducts()
      .then((all) => setProducts(all.filter((p) => ids.includes(p.id))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ids]);

  if (!ids.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase">Wishlist</h1>
        <p className="mt-2 text-sm text-mute">Save your favourite kicks for later. Login to sync wishlist across devices.</p>
        <Link to="/shop" className="mt-6 inline-flex bg-tss px-6 py-3 text-xs font-bold uppercase text-white">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-3 py-6 sm:px-4 sm:py-10 lg:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold uppercase sm:text-2xl">Wishlist</h1>
          <p className="text-sm text-mute">{ids.length} items</p>
        </div>
        <button type="button" onClick={clear} className="text-xs font-semibold text-mute underline">Clear all</button>
      </div>
      {loading ? (
        <p className="py-16 text-center text-mute">Loading…</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
