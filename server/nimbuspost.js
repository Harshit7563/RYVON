import crypto from "crypto";

function env(name) {
  return String(process.env[name] || "").trim();
}

const BASE = "https://api-v2.nimbuspost.com";

export function nimbusConfigured() {
  return Boolean(env("NIMBUSPOST_API_KEY") && env("NIMBUSPOST_API_SECRET"));
}

function headers() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-key": env("NIMBUSPOST_API_KEY"),
    "x-api-secret": env("NIMBUSPOST_API_SECRET"),
  };
}

async function npFetch(path, options = {}) {
  if (!nimbusConfigured()) {
    const err = new Error("NimbusPost is not configured");
    err.status = 503;
    throw err;
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const err = new Error(data?.error?.detail || data?.error?.title || `NimbusPost ${res.status}`);
    err.status = res.status === 404 ? 404 : res.status === 401 ? 401 : 502;
    err.code = data?.error?.code;
    throw err;
  }
  return data?.data;
}

export async function trackByAwb(awb) {
  const code = String(awb || "").trim();
  if (!code) {
    const err = new Error("AWB required");
    err.status = 400;
    throw err;
  }
  return npFetch(`/v2/tracking/${encodeURIComponent(code)}`);
}

export async function trackBulk(awbs) {
  const list = [...new Set((awbs || []).map((a) => String(a || "").trim()).filter(Boolean))].slice(0, 100);
  if (!list.length) return { found: [], notFound: [] };
  return npFetch("/v2/tracking/bulk", {
    method: "POST",
    body: JSON.stringify({ awbs: list }),
  });
}

export function verifyNimbusSignature(rawBody, signature) {
  const secret = env("NIMBUSPOST_WEBHOOK_SECRET");
  if (!secret) return true;
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = String(signature).replace(/^sha256=/i, "");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function mapShipStatus(shipStatus) {
  const s = String(shipStatus || "").toLowerCase();
  if (!s) return null;
  if (s.includes("deliver") && !s.includes("undeliver") && !s.includes("fail")) return "delivered";
  if (s.includes("out for delivery") || s.includes("ofd")) return "shipped";
  if (s.includes("transit") || s.includes("shipped") || s.includes("picked") || s.includes("dispatched")) return "shipped";
  if (s.includes("rto") || s.includes("return")) return "shipped";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("book") || s.includes("pending") || s.includes("pickup")) return "confirmed";
  return null;
}

export function summarizeTracking(data) {
  if (!data) return null;
  const latest = data.latest || {};
  const shipment = data.shipment || {};
  return {
    awb: shipment.awb || "",
    courierName: shipment.courierName || "",
    edd: shipment.edd || null,
    pickedAt: shipment.pickedAt || null,
    orderStatus: data.orderStatus || "",
    paymentMode: data.paymentMode || "",
    shipStatus: latest.shipStatus || "",
    statusCode: latest.statusCode || "",
    eventTime: latest.eventTime || null,
    location: latest.location || "",
    message: latest.message || "",
    mappedStatus: mapShipStatus(latest.shipStatus),
    shippingAddress: data.shippingAddress || null,
  };
}
