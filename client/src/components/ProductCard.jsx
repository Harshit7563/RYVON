import { Link } from "react-router-dom";
import { inr, mediaUrl } from "../api";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({ product }) {
  const off = product.mrp > product.price ? product.mrp - product.price : 0;
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  return (
    <div className="group relative block w-full min-w-0">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-sm bg-wash">
          {product.badge && (
            <span className="absolute left-0 top-0 z-10 bg-tss px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white sm:px-2 sm:text-[10px]">
              {product.badge}
            </span>
          )}
          <img
            src={mediaUrl(product.image)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }}
          />
        </div>
        <div className="mt-2 sm:mt-2.5">
          <h3 className="line-clamp-2 min-h-[2.4em] text-[12px] font-bold leading-snug text-ink group-hover:text-tss sm:text-[13px]">
            {product.name}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-mute sm:text-[12px]">{product.type}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[13px] font-bold sm:text-sm">{inr(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-[11px] text-mute line-through sm:text-xs">{inr(product.mrp)}</span>
                <span className="text-[10px] font-semibold text-off sm:text-[11px]">₹{off} OFF</span>
              </>
            )}
          </div>
        </div>
      </Link>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm"
        aria-label="Wishlist"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(product.id);
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={wished ? "#ec1c24" : "none"}
          stroke={wished ? "#ec1c24" : "currentColor"}
          strokeWidth="2"
        >
          <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
        </svg>
      </button>
    </div>
  );
}
