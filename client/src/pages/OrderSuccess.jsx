import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder, inr } from "../api";

export default function OrderSuccess() {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getOrder(code).then(setOrder).catch((e) => setErr(e.message));
  }, [code]);

  if (err) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-extrabold uppercase">Order not found</h1>
        <Link to="/track" className="mt-4 inline-block text-sm font-bold text-tss underline">Track another order</Link>
      </div>
    );
  }

  if (!order) return <div className="py-20 text-center text-mute">Loading order…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14 lg:px-6">
      <div className="border border-line bg-wash/50 p-6 text-center sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-off text-2xl text-white">✓</div>
        <h1 className="font-display mt-4 text-2xl font-extrabold uppercase">Order Placed!</h1>
        <p className="mt-2 text-sm text-mute">Thanks {order.customer.name}. We’ve got your kicks ready to ship.</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-tss">Order ID</p>
        <p className="font-display text-xl font-extrabold">{order.code}</p>
      </div>

      <div className="mt-6 border border-line p-5">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-mute">Status</span>
          <span className="font-bold uppercase text-tss">{order.status}</span>
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-mute">Payment</span>
          <span className="font-semibold uppercase">{order.payment}</span>
        </div>
        {order.discount > 0 && (
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-mute">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
            <span className="font-semibold text-off">−{inr(order.discount)}</span>
          </div>
        )}
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-mute">Total</span>
          <span className="font-bold">{inr(order.total)}</span>
        </div>
        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-2">
              <span className="text-mute">{i.name} · UK {i.size} ×{i.qty}</span>
              <span className="font-semibold">{inr(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to={`/track?code=${order.code}`} className="bg-ink px-5 py-3 text-xs font-bold uppercase text-white">Track Order</Link>
        <Link to="/shop" className="border border-ink px-5 py-3 text-xs font-bold uppercase">Continue Shopping</Link>
      </div>
    </div>
  );
}
