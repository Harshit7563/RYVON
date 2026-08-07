/** Load Razorpay Checkout.js once. */
export function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-ryvon-razorpay]");
    if (existing) {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.ryvonRazorpay = "1";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(script);
  });
}

function publicKey(fallback) {
  return String(import.meta.env.VITE_RAZORPAY_KEY_ID || fallback || "").trim();
}

/**
 * Open Razorpay Standard Checkout.
 * @returns {Promise<object>} verify payload from handler
 */
export async function openRazorpayCheckout(razorpay, orderCode) {
  const RazorpayCtor = await loadRazorpayScript();
  const key = publicKey(razorpay.keyId);
  if (!key) throw new Error("Razorpay key missing");

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: razorpay.amount,
      currency: razorpay.currency || "INR",
      name: razorpay.name || "RYVON",
      description: razorpay.description || `Order ${orderCode}`,
      order_id: razorpay.orderId || razorpay.order_id,
      prefill: razorpay.prefill || {},
      theme: { color: "#ec1c24" },
      // Do not force method flags — Razorpay shows whatever is enabled on the account.
      handler(response) {
        resolve({
          orderCode,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          reject(new Error("Payment cancelled"));
        },
      },
    };
    const rzp = new RazorpayCtor(options);
    rzp.on("payment.failed", (resp) => {
      const msg = resp?.error?.description || resp?.error?.reason || "Payment failed";
      reject(new Error(msg));
    });
    rzp.open();
  });
}
