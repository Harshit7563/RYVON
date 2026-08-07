import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder, cancelRazorpayPayment, getSite, inr, lookupPincode, validateCoupon, verifyRazorpayPayment } from "../api";
import { openRazorpayCheckout } from "../razorpay";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

const RAZORPAY_METHODS = [
  "Cards",
  "UPI / QR",
  "Netbanking",
  "EMI",
  "Wallet",
  "Pay Later",
  "International",
];

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const ship = total >= 999 ? 0 : 79;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState("");
  const [prepaidPct, setPrepaidPct] = useState(5);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    getSite()
      .then((s) => {
        if (s?.prepaidPercent != null) setPrepaidPct(Number(s.prepaidPercent) || 5);
        setRazorpayEnabled(!!s?.razorpayEnabled);
        if (s?.razorpayEnabled && payment === "cod") {
          /* keep default COD */
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: user.email || f.email,
      phone: f.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPincodeStatus("");
      return undefined;
    }
    let cancelled = false;
    setPincodeStatus("Looking up…");
    const timer = setTimeout(async () => {
      try {
        const data = await lookupPincode(pin);
        if (cancelled) return;
        if (!data.city) {
          setPincodeStatus(data.error || "Invalid pincode");
          return;
        }
        const city = String(data.city || "").trim();
        const apiState = String(data.state || "").trim();
        const matchedState =
          INDIAN_STATES.find((s) => s.toLowerCase() === apiState.toLowerCase()) ||
          INDIAN_STATES.find((s) => apiState.toLowerCase().includes(s.toLowerCase())) ||
          apiState;
        setForm((prev) => ({
          ...prev,
          city: city || prev.city,
          state: matchedState || prev.state,
        }));
        setPincodeStatus("City & state filled");
      } catch (err) {
        if (!cancelled) setPincodeStatus(err.message || "Could not fetch city/state");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.pincode]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const discount = applied?.discount || 0;
  const isPrepaid = payment === "razorpay";
  const prepaidDiscount = isPrepaid ? Math.round((total * prepaidPct) / 100) : 0;
  const grand = useMemo(
    () => Math.max(0, total - discount - prepaidDiscount) + ship,
    [total, discount, prepaidDiscount, ship]
  );

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-extrabold uppercase">Nothing to checkout</h1>
        <Link to="/shop" className="mt-4 inline-block text-sm font-bold text-tss underline">Go to shop</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    setCouponMsg("");
    setCouponBusy(true);
    try {
      const res = await validateCoupon(couponInput.trim(), total);
      setApplied(res);
      setCouponMsg(`Applied · you save ${inr(res.discount)}`);
    } catch (err) {
      setApplied(null);
      setCouponMsg(err.message || "Invalid coupon");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCouponInput("");
    setCouponMsg("");
  };

  const place = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      setError("Please fill all delivery details");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Enter a valid email for order updates");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Enter a valid 6-digit pincode");
      return;
    }
    if (payment === "razorpay" && !razorpayEnabled) {
      setError("Online payments are not available right now. Please choose Cash on Delivery.");
      return;
    }
    setBusy(true);
    let createdCode = null;
    let paymentStarted = false;
    try {
      const order = await createOrder({
        payment,
        customer: {
          ...form,
          email: (form.email || user?.email || "").trim().toLowerCase(),
          name: form.name || user?.name || "",
          pincode: form.pincode.trim(),
        },
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          image: i.product.image,
          size: i.size,
          color: i.color,
          qty: i.qty,
        })),
        shipping: ship,
        couponCode: applied?.code || undefined,
      });
      createdCode = order.code;

      if (payment === "razorpay" && order.razorpay) {
        paymentStarted = true;
        const payload = await openRazorpayCheckout(order.razorpay, order.code);
        await verifyRazorpayPayment(payload);
      }

      clear();
      nav(`/order/${order.code}`, { replace: true });
    } catch (err) {
      if (createdCode && payment === "razorpay" && paymentStarted) {
        try {
          await cancelRazorpayPayment(createdCode);
        } catch {
          /* ignore */
        }
      }
      setError(err.message || "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-3 py-6 sm:px-4 sm:py-10 lg:px-6">
      <h1 className="font-display text-xl font-extrabold uppercase sm:text-2xl">Checkout</h1>
      {!user && (
        <p className="mt-2 text-sm text-mute">
          Guest checkout — fill your details below. Have an account? You can still login from the header anytime.
        </p>
      )}
      <form onSubmit={place} className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="border border-line p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider">Delivery Details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Full Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  readOnly={!!user?.email}
                  className={`w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss ${
                    user?.email ? "bg-wash text-mute" : ""
                  }`}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Pincode</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="560001"
                  className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                  required
                />
                {pincodeStatus && (
                  <p
                    className={`mt-1 text-xs ${
                      pincodeStatus === "City & state filled" || pincodeStatus === "Looking up…"
                        ? "text-mute"
                        : "font-semibold text-tss"
                    }`}
                  >
                    {pincodeStatus}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Auto from pincode"
                  className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">State</span>
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className="w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-tss"
                  required
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Address</span>
                <textarea
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={3}
                  className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-tss"
                  required
                />
              </label>
            </div>
          </section>

          <section className="border border-line p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider">Payment</h2>
            <p className="mt-1 text-sm text-mute">Choose how you’d like to pay</p>
            <div className="mt-4 space-y-2.5">
              {[
                {
                  id: "cod",
                  label: "Cash on Delivery",
                  hint: "Pay with cash or UPI when your order arrives",
                  badge: "Popular",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2.5" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                  ),
                },
                razorpayEnabled
                  ? {
                      id: "razorpay",
                      label: "Pay Online · Razorpay",
                      hint: `Extra ${prepaidPct}% off · Cards, UPI/QR, Netbanking, EMI, Wallet, Pay Later & International`,
                      badge: `${prepaidPct}% OFF`,
                      icon: (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <path d="M2 10h20" />
                          <path d="M6 15h4" />
                        </svg>
                      ),
                    }
                  : null,
              ]
                .filter(Boolean)
                .map((opt) => {
                const selected = payment === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`group relative flex cursor-pointer items-start gap-3.5 border px-3.5 py-3.5 transition sm:px-4 ${
                      selected
                        ? "border-tss bg-tss/[0.04] shadow-[inset_3px_0_0_0_#ec1c24]"
                        : "border-line hover:border-[#ccc] hover:bg-wash/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setPayment(opt.id)}
                    />
                    <span
                      className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center border transition ${
                        selected ? "border-tss bg-tss text-white" : "border-line bg-wash text-ink group-hover:border-[#ccc]"
                      }`}
                    >
                      {opt.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{opt.label}</span>
                        {opt.badge && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${
                              selected ? "text-tss" : "text-mute"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-mute">{opt.hint}</span>
                      {opt.id === "razorpay" && selected && (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {RAZORPAY_METHODS.map((m) => (
                            <span
                              key={m}
                              className="border border-line bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute"
                            >
                              {m}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
                        selected ? "border-tss bg-tss" : "border-[#ccc] bg-white"
                      }`}
                      aria-hidden
                    >
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2">
                          <path d="M2 6.5l2.5 2.5L10 3" />
                        </svg>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            {!razorpayEnabled && (
              <p className="mt-3 text-xs text-mute">
                Online payments (Cards / UPI / Netbanking / EMI / Wallet) will appear here once Razorpay keys are added on the server.
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit border border-line p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider">Order Summary</h2>
          <ul className="mt-4 max-h-56 space-y-3 overflow-y-auto text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-mute">{i.product.name} ×{i.qty}</span>
                <span className="shrink-0 font-semibold">{inr(i.product.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-[11px] font-bold uppercase text-mute">Coupon</p>
            {applied ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded border border-off/30 bg-off/5 px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold">{applied.code}</p>
                  <p className="text-[11px] text-mute">−{inr(applied.discount)}</p>
                </div>
                <button type="button" onClick={removeCoupon} className="text-[11px] font-bold uppercase text-tss underline">
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="min-w-0 flex-1 border border-line px-3 py-2.5 text-sm uppercase outline-none focus:border-tss"
                />
                <button
                  type="button"
                  disabled={couponBusy || !couponInput.trim()}
                  onClick={applyCoupon}
                  className="shrink-0 border border-ink px-3 py-2.5 text-[11px] font-bold uppercase disabled:opacity-50"
                >
                  {couponBusy ? "…" : "Apply"}
                </button>
              </div>
            )}
            {couponMsg && !applied && <p className="mt-2 text-xs font-semibold text-tss">{couponMsg}</p>}
            {couponMsg && applied && <p className="mt-2 text-xs font-semibold text-off">{couponMsg}</p>}
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><span className="text-mute">Subtotal</span><span>{inr(total)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-off">
                <span>Coupon ({applied.code})</span>
                <span>−{inr(discount)}</span>
              </div>
            )}
            {prepaidDiscount > 0 && (
              <div className="flex justify-between text-off">
                <span>Prepaid ({prepaidPct}% off)</span>
                <span>−{inr(prepaidDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-mute">Shipping</span><span>{ship ? inr(ship) : "FREE"}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{inr(grand)}</span></div>
          </div>
          {error && <p className="mt-3 text-xs font-semibold text-tss">{error}</p>}
          <button type="submit" disabled={busy} className="mt-5 w-full bg-tss py-3.5 text-xs font-bold uppercase text-white hover:bg-tss-dark disabled:opacity-60">
            {busy ? (payment === "razorpay" ? "Opening payment…" : "Placing…") : payment === "razorpay" ? "Pay & Place Order" : "Place Order"}
          </button>
        </aside>
      </form>
    </div>
  );
}
