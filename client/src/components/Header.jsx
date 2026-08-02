import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

const LINKS = [
  { label: "Air Force", to: "/shop?category=air-force" },
  { label: "Low Dunk", to: "/shop?category=low-dunk" },
  { label: "Travis Scott", to: "/shop?category=travis-scott" },
  { label: "Jordan", to: "/shop?category=jordan" },
  { label: "Retro", to: "/shop?category=retro" },
  { label: "Samba", to: "/shop?category=samba" },
  { label: "Sale", to: "/shop?sale=1", sale: true },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [accountMenu, setAccountMenu] = useState(false);
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, openLogin, logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/shop?search=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  const drawer = open
    ? createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-[340px] flex-col bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="font-display text-lg font-extrabold text-tss"
              >
                RYVON
              </Link>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-wash"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <form onSubmit={submitSearch} className="shrink-0 border-b border-line p-4">
              <div className="flex overflow-hidden rounded border border-line focus-within:border-tss">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search shoes..."
                  className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
                  autoFocus
                />
                <button type="submit" className="bg-wash px-3 text-mute" aria-label="Search">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" />
                  </svg>
                </button>
              </div>
            </form>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1">
              {LINKS.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-line px-3 py-3.5 text-[14px] font-bold uppercase tracking-wide ${
                    l.sale ? "text-tss" : "text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/wishlist"
                onClick={() => setOpen(false)}
                className="block border-b border-line px-3 py-3.5 text-[14px] font-bold uppercase tracking-wide text-ink"
              >
                Wishlist
              </Link>
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="block border-b border-line px-3 py-3.5 text-[14px] font-bold uppercase tracking-wide text-ink"
              >
                My Account
              </Link>
              <Link
                to="/track"
                onClick={() => setOpen(false)}
                className="block px-3 py-3.5 text-[14px] font-bold uppercase tracking-wide text-ink"
              >
                Track Order
              </Link>
            </nav>

            <div className="shrink-0 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-[11px] text-mute">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="shrink-0 text-xs font-bold uppercase text-tss"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openLogin();
                  }}
                  className="w-full bg-tss py-3.5 text-xs font-bold uppercase tracking-wide text-white"
                >
                  Login / Register
                </button>
              )}
              <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-mute">Ryvon Original</p>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="bg-tss px-3 py-1.5 text-center text-white sm:py-2">
        <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.1em] sm:text-sm">
          RYVON Footwear · Premium style, built for every step
        </p>
      </div>

      <div className="border-b border-line shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-1.5 px-2 sm:gap-3 sm:px-4 lg:h-[60px] lg:px-6">
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link
            to="/"
            className="font-display shrink-0 text-[19px] font-extrabold tracking-tight text-tss sm:text-[22px]"
          >
            RYVON
          </Link>

          <nav className="ml-4 hidden items-center gap-4 xl:gap-5 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.04em] transition hover:text-tss ${
                  l.sale ? "text-tss" : "text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:flex lg:max-w-sm">
            <div className="flex w-full overflow-hidden rounded border border-line focus-within:border-tss">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full px-3 py-2 text-sm outline-none"
              />
              <button type="submit" className="bg-wash px-3 text-mute hover:text-tss" aria-label="Search">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center md:ml-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Search"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            </button>
            <Link to="/wishlist" className="relative hidden h-11 w-11 place-items-center sm:grid" aria-label="Wishlist">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
              </svg>
              {wishCount > 0 && (
                <span className="absolute right-1 top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-tss px-1 text-[9px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </Link>
            <div className="relative hidden sm:block">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center"
                aria-label="Account"
                onClick={() => (user ? setAccountMenu((v) => !v) : openLogin())}
              >
                {user ? (
                  user.picture ? (
                    <img
                      src={user.picture}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-tss text-[11px] font-bold uppercase text-white">
                      {user.name.charAt(0)}
                    </span>
                  )
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3.2" />
                    <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
                  </svg>
                )}
              </button>
              {user && accountMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-[11px] text-mute">{user.email}</p>
                  </div>
                  <Link to="/account" onClick={() => setAccountMenu(false)} className="block px-3 py-2.5 text-sm font-semibold hover:bg-wash">
                    My Account
                  </Link>
                  <Link to="/track" onClick={() => setAccountMenu(false)} className="block px-3 py-2.5 text-sm font-semibold hover:bg-wash">
                    Track Order
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setAccountMenu(false);
                    }}
                    className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-tss hover:bg-wash"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            <Link to="/cart" className="relative grid h-10 w-10 place-items-center sm:h-11 sm:w-11" aria-label="Cart">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 7h15l-1.5 9H7.2L6 7z" />
                <path d="M6 7L5 4H2" />
                <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
              </svg>
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-tss px-1 text-[9px] font-bold text-white sm:right-1 sm:top-1 sm:h-[18px] sm:min-w-[18px] sm:text-[10px]">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {drawer}
    </header>
  );
}

export function MobileNav() {
  const { count } = useCart();
  const item = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide";
  const active = ({ isActive }) => `${item} ${isActive ? "text-tss" : "text-mute"}`;

  return (
    <nav className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white lg:hidden">
      <div className="mx-auto flex max-w-lg">
        <NavLink to="/" end className={active}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z" />
          </svg>
          Home
        </NavLink>
        <NavLink to="/shop" className={active}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Shop
        </NavLink>
        <NavLink to="/shop?sale=1" className={active}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
          </svg>
          Sale
        </NavLink>
        <NavLink to="/cart" className={active}>
          <span className="relative">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M6 7h15l-1.5 9H7.2L6 7z" />
              <path d="M6 7L5 4H2" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-tss px-0.5 text-[9px] text-white">
                {count}
              </span>
            )}
          </span>
          Cart
        </NavLink>
      </div>
    </nav>
  );
}
