import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { inr, mediaUrl } from "../api";

export default function Cart() {
  const { items, remove, setQty, clear, total } = useCart();
  const nav = useNavigate();

  if (!items.length) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 text-center sm:py-20 lg:px-6">
        <h1 className="font-display text-xl font-extrabold uppercase sm:text-2xl">Your Cart is Empty</h1>
        <p className="mt-2 text-sm text-mute">Add some kicks and come back.</p>
        <Link to="/shop" className="mt-6 inline-flex bg-tss px-6 py-3 text-xs font-bold uppercase text-white hover:bg-tss-dark">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const ship = total >= 999 ? 0 : 79;

  return (
    <div className="mx-auto max-w-[1280px] px-3 pb-28 pt-5 sm:px-4 sm:pb-10 sm:py-8 lg:px-6 lg:py-10">
      <div className="flex items-end justify-between border-b border-line pb-3 sm:pb-4">
        <h1 className="font-display text-xl font-extrabold uppercase sm:text-2xl">
          Cart ({items.reduce((s, i) => s + i.qty, 0)})
        </h1>
        <button type="button" onClick={clear} className="text-xs font-semibold text-mute underline">
          Clear
        </button>
      </div>

      <div className="mt-5 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-3">
        <div className="divide-y divide-line lg:col-span-2">
          {items.map((item) => (
            <div key={item.key} className="flex gap-3 py-4 sm:gap-4">
              <Link to={`/product/${item.product.id}`} className="shrink-0">
                <img
                  src={mediaUrl(item.product.image)}
                  alt={item.product.name}
                  className="h-24 w-20 bg-wash object-cover sm:h-28 sm:w-24"
                  onError={(e) => { e.currentTarget.src = "/products/p1.jpg"; }}
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/product/${item.product.id}`} className="line-clamp-2 text-[13px] font-bold hover:text-tss sm:text-sm">
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-mute">UK {item.size}</p>
                  </div>
                  <button type="button" onClick={() => remove(item.key)} className="shrink-0 text-xs text-mute">
                    Remove
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex border border-line">
                    <button type="button" className="h-9 w-9" onClick={() => setQty(item.key, item.qty - 1)}>−</button>
                    <span className="grid h-9 w-9 place-items-center text-sm font-bold">{item.qty}</span>
                    <button type="button" className="h-9 w-9" onClick={() => setQty(item.key, item.qty + 1)}>+</button>
                  </div>
                  <span className="text-sm font-bold">{inr(item.product.price * item.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden h-fit border border-line p-5 lg:block">
          <h2 className="text-xs font-bold uppercase tracking-wider">Billing Details</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-mute">Cart Total</span><span className="font-semibold">{inr(total)}</span></div>
            <div className="flex justify-between"><span className="text-mute">Shipping</span><span className="font-semibold">{ship ? inr(ship) : "FREE"}</span></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <span>Total</span><span>{inr(total + ship)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => nav("/checkout")}
            className="mt-5 w-full bg-tss py-3.5 text-xs font-bold uppercase text-white hover:bg-tss-dark"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-40 border-t border-line bg-white p-3 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase text-mute">Total</p>
            <p className="text-base font-bold">{inr(total + ship)}</p>
          </div>
          <button
            type="button"
            onClick={() => nav("/checkout")}
            className="flex-1 bg-tss py-3.5 text-[11px] font-bold uppercase text-white"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
