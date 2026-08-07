import Razorpay from "razorpay";
import crypto from "crypto";

function env(name) {
  return String(process.env[name] || "").trim();
}

export function razorpayConfigured() {
  return Boolean(env("RAZORPAY_KEY_ID") && env("RAZORPAY_KEY_SECRET"));
}

export function getRazorpayPublic() {
  const keyId = env("RAZORPAY_KEY_ID");
  return {
    enabled: razorpayConfigured(),
    keyId: razorpayConfigured() ? keyId : "",
    methods: ["card", "upi", "netbanking", "emi", "wallet", "paylater", "international"],
  };
}

let client = null;
let clientKey = "";

function getClient() {
  if (!razorpayConfigured()) return null;
  const keyId = env("RAZORPAY_KEY_ID");
  const keySecret = env("RAZORPAY_KEY_SECRET");
  if (!client || clientKey !== `${keyId}:${keySecret}`) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    clientKey = `${keyId}:${keySecret}`;
  }
  return client;
}

/** Amount in paise (INR). Min 100. */
export async function createRazorpayOrder({ amountPaise, receipt, notes = {}, currency = "INR" }) {
  const rzp = getClient();
  if (!rzp) {
    const err = new Error("Razorpay is not configured");
    err.status = 503;
    throw err;
  }
  const amount = Math.round(Number(amountPaise));
  if (!Number.isFinite(amount) || amount < 100) {
    const err = new Error("Amount must be at least 100 paise (₹1)");
    err.status = 400;
    throw err;
  }
  try {
    return await rzp.orders.create({
      amount,
      currency: currency || "INR",
      receipt: String(receipt || `rcpt_${Date.now()}`).slice(0, 40),
      notes,
      payment_capture: 1,
    });
  } catch (e) {
    const status = e?.statusCode || e?.status || 500;
    const message = e?.error?.description || e?.message || "Razorpay order create failed";
    const err = new Error(message);
    err.status = status === 401 ? 401 : 500;
    throw err;
  }
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const keySecret = env("RAZORPAY_KEY_SECRET");
  if (!keySecret || !orderId || !paymentId || !signature) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = env("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature || ""));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
