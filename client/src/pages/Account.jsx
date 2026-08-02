import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, inr, mediaUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

export default function Account() {
  const { user, openLogin, logout } = useAuth();
  const { count } = useWishlist();
  const [orders, setOrders] = useState([]);
  const [ordersErr, setOrdersErr] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!user?.email) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    setOrdersErr("");
    getMyOrders(user.email)
      .then(setOrders)
      .catch((e) => setOrdersErr(e.message || "Could not load orders"))
      .finally(() => setOrdersLoading(false));
  }, [user?.email]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase">My Account</h1>
        <p className="mt-2 text-sm text-mute">Login to view your profile, wishlist & orders.</p>
        <button type="button" onClick={openLogin} className="mt-6 bg-tss px-6 py-3 text-xs font-bold uppercase text-white">
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
      <div className="flex items-center gap-4 border border-line p-5">
        {user.picture ? (
          <img src={user.picture} alt="" className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-tss text-xl font-bold uppercase text-white">
            {user.name.charAt(0)}
          </span>
        )}
        <div>
          <h1 className="font-display text-xl font-extrabold uppercase">{user.name}</h1>
          <p className="text-sm text-mute">{user.email}</p>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold uppercase">My Orders</h2>
            <p className="mt-0.5 text-sm text-mute">Orders placed with this account email</p>
          </div>
          <Link to="/track" className="text-[11px] font-bold uppercase text-tss underline">
            Track
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {ordersLoading && <p className="border border-line p-6 text-center text-sm text-mute">Loading orders…</p>}
          {ordersErr && <p className="border border-line p-4 text-sm font-semibold text-tss">{ordersErr}</p>}
          {!ordersLoading && !ordersErr && orders.length === 0 && (
            <div className="border border-line p-8 text-center">
              <p className="text-sm text-mute">No orders yet with {user.email}</p>
              <Link to="/shop" className="mt-3 inline-block text-xs font-bold uppercase text-tss underline">
                Shop now
              </Link>
            </div>
          )}
          {orders.map((o) => {
            const open = openId === o.id;
            return (
              <div key={o.id} className="border border-line">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : o.id)}
                  className="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="font-display text-base font-extrabold">{o.code}</p>
                    <p className="mt-1 text-[12px] text-mute">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                      {" · "}
                      {o.items?.length || 0} item{(o.items?.length || 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{inr(o.total)}</p>
                    <span className="mt-1 inline-block rounded bg-tss/10 px-2 py-0.5 text-[10px] font-bold uppercase text-tss">
                      {o.status}
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-line bg-wash/40 px-4 py-4">
                    <ul className="space-y-3">
                      {(o.items || []).map((i, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <img
                            src={mediaUrl(i.image)}
                            alt=""
                            className="h-14 w-14 shrink-0 object-cover bg-wash"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold line-clamp-2">{i.name}</p>
                            <p className="text-[12px] text-mute">
                              UK {i.size}
                              {i.color ? ` · ${i.color}` : ""} ×{i.qty}
                            </p>
                            <p className="mt-0.5 font-bold">{inr(i.price * i.qty)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
                      <div className="flex justify-between"><span className="text-mute">Subtotal</span><span>{inr(o.subtotal)}</span></div>
                      {o.discount > 0 && (
                        <div className="flex justify-between text-off">
                          <span>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</span>
                          <span>−{inr(o.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-mute">Shipping</span>
                        <span>{o.shipping ? inr(o.shipping) : "FREE"}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{inr(o.total)}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-mute">Payment</span>
                        <span className="uppercase font-semibold">{o.payment}</span>
                      </div>
                    </div>
                    {(o.customer?.address || o.customer?.city) && (
                      <p className="mt-3 text-[13px] leading-relaxed text-mute">
                        Ship to: {o.customer.name}
                        {o.customer.phone ? ` · ${o.customer.phone}` : ""}
                        <br />
                        {[o.customer.address, o.customer.city, o.customer.state, o.customer.pincode].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <Link
                      to={`/track?code=${o.code}`}
                      className="mt-4 inline-block text-[11px] font-bold uppercase text-tss underline"
                    >
                      Track this order →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          ["/wishlist", "Wishlist", `${count} items`],
          ["/cart", "My Cart", "Checkout ready"],
          ["/contact", "Support", "Get help"],
        ].map(([to, title, sub]) => (
          <Link key={to} to={to} className="border border-line p-4 transition hover:border-tss">
            <p className="text-sm font-bold uppercase">{title}</p>
            <p className="mt-1 text-xs text-mute">{sub}</p>
          </Link>
        ))}
      </div>

      <button type="button" onClick={logout} className="mt-8 w-full border border-tss py-3 text-xs font-bold uppercase text-tss">
        Logout
      </button>
    </div>
  );
}
