import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getOrder, getSite, inr, mediaUrl, resumeOrderPayment, verifyRazorpayPayment, cancelRazorpayPayment } from "../api";
import { openRazorpayCheckout } from "../razorpay";

const LAST_ORDER_KEY = "ryvon-last-order";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function saveLastOrder(order) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ order, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

function loadLastOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const { order, at } = JSON.parse(raw);
    if (!order || Date.now() - (at || 0) > MAX_AGE_MS) return null;
    return order;
  } catch {
    return null;
  }
}

export default function ThankYou() {
  const location = useLocation();
  const nav = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [site, setSite] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState("");

  useEffect(() => {
    getSite().then(setSite).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.order) {
      saveLastOrder(location.state.order);
      setOrder(location.state.order);
      return;
    }
    const cached = loadLastOrder();
    if (cached) setOrder(cached);
    else nav("/shop", { replace: true });
  }, [location.state, nav]);

  // Meta Pixel — Purchase (from ads/shipping partner)
  useEffect(() => {
    if (!order?.code) return;
    if (order.status === "pending_payment") return;
    const key = `ryvon-fbq-purchase-${order.code}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Purchase", {
        value: Number(order.total) || 0,
        currency: "INR",
        content_ids: (order.items || []).map((i) => String(i.productId || i.id || i.name || "")).filter(Boolean),
        content_type: "product",
        num_items: (order.items || []).reduce((n, i) => n + (Number(i.qty) || 1), 0),
      });
    }
  }, [order]);

  async function payNow() {
    if (!order?.code) return;
    setPayErr("");
    setPayBusy(true);
    try {
      const session = await resumeOrderPayment(order.code);
      if (session.alreadyPaid) {
        setOrder(session.order);
        saveLastOrder(session.order);
        return;
      }
      const payload = await openRazorpayCheckout(session.razorpay, session.code || order.code);
      await verifyRazorpayPayment(payload);
      const fresh = await getOrder(order.code);
      setOrder(fresh);
      saveLastOrder(fresh);
    } catch (e) {
      if (order?.code) {
        try {
          await cancelRazorpayPayment(order.code, e.message || "Payment failed");
        } catch {
          /* ignore */
        }
      }
      setPayErr(e.message || "Payment could not be completed");
    } finally {
      setPayBusy(false);
    }
  }

  if (!order) {
    return <div className="py-24 text-center text-mute">Loading…</div>;
  }

  const firstName = order.customer?.name?.split(" ")[0] || "there";
  const pendingPay = order.status === "pending_payment";
  const paid =
    order.paymentStatus === "paid" ||
    String(order.payment || "").toLowerCase() === "paid";
  const isCod =
    String(order.payment || "").toLowerCase() === "cod" ||
    order.paymentStatus === "cod";

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-wash to-white pb-16 pt-8 sm:pt-12">
      <div className="mx-auto max-w-2xl px-4 lg:px-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-white px-5 py-10 text-center shadow-sm sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-tss/8" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-off/10" />

          <div
            className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${
              pendingPay ? "bg-mute shadow-mute/20" : "bg-gradient-to-br from-off to-off/85 shadow-off/25"
            }`}
          >
            {pendingPay ? (
              <span className="font-display text-3xl font-extrabold text-white">!</span>
            ) : (
              <svg className="h-11 w-11 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>

          <p className="relative mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-off">
            {pendingPay ? "Almost there" : "Order Confirmation"}
          </p>
          <h1 className="font-display relative mt-2 text-3xl font-extrabold uppercase leading-tight text-ink sm:text-4xl">
            {pendingPay ? "Complete payment" : `Thank you, ${firstName}!`}
          </h1>
          <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-mute">
            {pendingPay
              ? "Your order is reserved. Pay now to confirm — we’ll start packing right away."
              : paid
                ? "Payment received. We’re packing your order and will ship it soon."
                : isCod
                  ? "Your COD order is confirmed. Pay when your pair arrives at your door."
                  : "Your order is confirmed. We’ll keep you updated on email & SMS."}
          </p>

          {!pendingPay && (
            <p className="relative mt-5 text-xs text-mute">
              Confirmation sent to <span className="font-semibold text-ink">{order.customer?.email}</span>
            </p>
          )}

          {order.createdAt && (
            <p className="relative mt-3 text-sm font-semibold text-ink">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          )}

          {pendingPay && (
            <div className="relative mt-6">
              <button
                type="button"
                disabled={payBusy}
                onClick={payNow}
                className="w-full max-w-sm bg-tss px-6 py-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-tss-dark disabled:opacity-60 sm:w-auto"
              >
                {payBusy ? "Opening Razorpay…" : "Pay now · Razorpay"}
              </button>
              {payErr && <p className="mt-3 text-xs font-semibold text-tss">{payErr}</p>}
            </div>
          )}
        </div>

        {/* Order ID highlight */}
        <div className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-mute">Your order ID</p>
              <p className="font-display mt-1 text-2xl font-extrabold tracking-wide text-ink">{order.code}</p>
              {order.createdAt && (
                <p className="mt-1 text-xs font-semibold text-ink">
                  {new Date(order.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
              <p className="mt-1 text-xs text-mute">Save this to track your delivery</p>
            </div>
            <Link
              to={`/track?code=${encodeURIComponent(order.code)}`}
              className="shrink-0 bg-ink px-5 py-3 text-[11px] font-bold uppercase text-white hover:bg-black"
            >
              Track order
            </Link>
          </div>
          {(order.awb || order.shipStatus || order.courierName) && (
            <div className="mt-4 border-t border-line pt-4 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mute">Shipment</p>
              {order.awb && <p className="mt-1 font-semibold">AWB: {order.awb}</p>}
              {order.courierName && <p className="text-mute">Courier: {order.courierName}</p>}
              {order.shipStatus && <p className="text-mute">Status: {order.shipStatus}</p>}
            </div>
          )}
        </div>

        {paid && order.prepaidDiscount > 0 && (
          <div className="mt-4 rounded-xl border border-off/25 bg-off/5 px-4 py-3 text-sm">
            <p className="font-bold uppercase text-off">Prepaid discount applied</p>
            <p className="mt-0.5 text-mute">
              {site?.prepaidPercent || 5}% off on online payment · You saved {inr(order.prepaidDiscount)}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="border-b border-line bg-wash/50 px-5 py-3">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-mute">Order summary</h2>
          </div>
          <ul className="divide-y divide-line">
            {(order.items || []).map((i, idx) => (
              <li key={idx} className="flex gap-3 px-5 py-4">
                <img
                  src={mediaUrl(i.image)}
                  alt=""
                  className="h-16 w-16 shrink-0 bg-wash object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold text-ink">{i.name}</p>
                  <p className="mt-0.5 text-xs text-mute">
                    UK {i.size}
                    {i.color ? ` · ${i.color}` : ""} × {i.qty}
                  </p>
                  <p className="mt-1 font-bold text-tss">{inr((i.price || 0) * (i.qty || 1))}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-line bg-wash/30 px-5 py-4 text-sm">
            {order.discount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-mute">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span className="font-semibold text-off">−{inr(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-mute">Shipping</span>
              <span className="font-semibold">{order.shipping ? inr(order.shipping) : "FREE"}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-line/80 pt-2 text-base">
              <span className="font-bold">Total</span>
              <span className="font-display font-extrabold text-tss">{inr(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-mute">Delivering to</h2>
          <p className="mt-2 font-bold text-ink">{order.customer?.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-mute">
            {[order.customer?.address, order.customer?.city, order.customer?.state, order.customer?.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="mt-2 text-sm text-mute">{order.customer?.phone}</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/shop"
            className="border border-ink bg-white px-8 py-3.5 text-center text-xs font-bold uppercase tracking-wide hover:bg-wash"
          >
            Continue shopping
          </Link>
          <Link
            to="/"
            className="bg-tss px-8 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-white hover:bg-tss-dark"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
