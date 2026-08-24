import crypto from "crypto";

function env(name) {
  return String(process.env[name] || "").trim();
}

const BASE = "https://api-v2.nimbuspost.com";

export function nimbusConfigured() {
  return Boolean(env("NIMBUSPOST_API_KEY") && env("NIMBUSPOST_API_SECRET"));
}

export function nimbusWarehouseId() {
  return env("NIMBUSPOST_WAREHOUSE_ID");
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
    const detail = data?.error?.detail || data?.error?.title || `NimbusPost ${res.status}`;
    const err = new Error(detail);
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.code = data?.error?.code;
    err.raw = data;
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

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeInt(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "").slice(-10);
  const num = Number(digits);
  return Number.isFinite(num) && digits.length === 10 ? num : null;
}

function paymentModeForNimbus(order) {
  const p = String(order?.payment || "").toLowerCase();
  const ps = String(order?.paymentStatus || "").toLowerCase();
  const isCod = p === "cod" || ps === "cod";
  return isCod ? "cod" : "prepaid";
}

function collectableAmountForNimbus(order) {
  if (paymentModeForNimbus(order) !== "cod") return 0;
  return safeNumber(order?.total, 0);
}

function pinAsNumber(pin) {
  const n = Number(String(pin || "").replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function buildShipmentPayload(order) {
  const warehouse_id = nimbusWarehouseId();
  if (!warehouse_id) {
    const err = new Error("NimbusPost warehouse_id is not configured (set NIMBUSPOST_WAREHOUSE_ID)");
    err.status = 503;
    throw err;
  }

  const customer = order?.customer || {};
  const phone = normalizePhone(customer.phone);
  const pincode = pinAsNumber(customer.pincode);
  if (!customer?.name || !customer?.address || !phone || !pincode) {
    const err = new Error("Missing shipping_address fields for NimbusPost (name/address/phone/pincode)");
    err.status = 400;
    throw err;
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) {
    const err = new Error("No items to ship");
    err.status = 400;
    throw err;
  }

  const weight = safeNumber(process.env.NIMBUSPOST_PACKAGE_WEIGHT_KG || 0.5, 0.5);
  const length = safeNumber(process.env.NIMBUSPOST_PACKAGE_LENGTH_CM || 30, 30);
  const width = safeNumber(process.env.NIMBUSPOST_PACKAGE_WIDTH_CM || 20, 20);
  const height = safeNumber(process.env.NIMBUSPOST_PACKAGE_HEIGHT_CM || 12, 12);

  return {
    order_number: String(order?.code || order?.id || "").trim(),
    order_type: "b2c",
    payment_mode: paymentModeForNimbus(order),
    order_collectable_amount: collectableAmountForNimbus(order),
    warehouse_id,
    shipping_address: {
      name: String(customer.name || "").trim(),
      email: String(order?.userEmail || customer?.email || "").trim(),
      address: String(customer.address || "").trim(),
      address_opt: String(customer.address_opt || customer.addressOpt || customer.landmark || "").trim(),
      pincode,
      city: String(customer.city || "").trim(),
      state: String(customer.state || "").trim(),
      country: String(customer.country || "India").trim(),
      phone,
    },
    items: items.slice(0, 25).map((i) => {
      const sku = i?.sku ? String(i.sku) : i?.productId != null ? `RYV-${i.productId}` : "RYV-ITEM";
      return {
        name: String(i?.name || "Item").trim(),
        qty: safeInt(i?.qty, 1),
        price: safeNumber(i?.price, 0),
        sku: sku.trim(),
      };
    }),
    package: { weight, length, width, height },
  };
}

/** Create order only (appears in NimbusPost portal; no AWB yet). */
export async function createNimbusOrder(order) {
  const payload = buildShipmentPayload(order);
  return npFetch("/v2/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Book an already-created NimbusPost order. */
export async function bookNimbusShipment(orderId, courierId) {
  const body = { order_id: String(orderId) };
  if (courierId) body.courier_id = String(courierId);
  return npFetch("/v2/shipments/book", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * One-shot create+book. If book fails (e.g. no serviceable courier),
 * falls back to create-order so the shipment still appears in the NimbusPost portal.
 * Returns { order, booking, createdOnly }.
 */
export async function createAndBookShipment(order) {
  // Already created on Nimbus — try book only.
  if (order?.nimbusOrderId && !order?.awb) {
    try {
      const booking = await bookNimbusShipment(order.nimbusOrderId);
      return { order: { order_id: order.nimbusOrderId }, booking, createdOnly: false };
    } catch (bookErr) {
      return {
        order: { order_id: order.nimbusOrderId },
        booking: null,
        createdOnly: true,
        bookError: bookErr.message,
      };
    }
  }

  const payload = buildShipmentPayload(order);
  try {
    const data = await npFetch("/v2/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      order: data?.order || null,
      booking: data?.booking || null,
      createdOnly: false,
    };
  } catch (bookErr) {
    // Order may still need to land in portal for manual book.
    try {
      const created = await createNimbusOrder(order);
      return {
        order: created || null,
        booking: null,
        createdOnly: true,
        bookError: bookErr.message,
      };
    } catch (createErr) {
      const msg = String(createErr.message || "");
      if (/already|duplicate|exists/i.test(msg) && bookErr.message) {
        throw bookErr;
      }
      throw createErr;
    }
  }
}

/** Apply booking / create result onto a RYVON order object (mutates). */
export function applyNimbusResultToOrder(order, result) {
  if (!order || !result) return order;
  const booking = result.booking || {};
  const npOrder = result.order || {};
  const nimbusOrderId = booking.order_id || npOrder.order_id || npOrder.id || order.nimbusOrderId || "";
  if (nimbusOrderId) order.nimbusOrderId = String(nimbusOrderId);

  if (booking.awb) {
    order.awb = booking.awb;
    order.courierName = booking.courier_name || booking.courierName || order.courierName || "";
    order.shipStatus = booking.order_status || "confirmed";
    if (order.status !== "cancelled" && order.status !== "delivered" && order.status !== "shipped") {
      order.status = "confirmed";
    }
    order.tracking = {
      awb: booking.awb,
      courierName: order.courierName,
      edd: booking.edd || null,
      shipStatus: order.shipStatus,
      eventTime: null,
      location: "",
      message: "Shipment booked on NimbusPost",
      mappedStatus: "confirmed",
      tracking_url: booking.tracking_url || null,
      tracking_short_url: booking.tracking_short_url || null,
      label_url: booking.label_url || null,
      updatedAt: new Date().toISOString(),
    };
    order.nimbusBookingError = "";
  } else if (result.createdOnly) {
    order.nimbusCreatedAt = new Date().toISOString();
    order.nimbusBookingError = result.bookError
      ? `Order created on NimbusPost; book pending: ${result.bookError}`
      : "Order created on NimbusPost; AWB not booked yet";
  }
  return order;
}
