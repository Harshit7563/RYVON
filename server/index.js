import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { products as seedProducts, categories as seedCategories } from "./data/products.js";
import {
  createRazorpayOrder,
  getRazorpayPublic,
  razorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "./razorpay.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const STORE = path.join(__dirname, "data", "store.json");
const UPLOADS = path.join(__dirname, "uploads");
const PORT = process.env.PORT || 5001;

const PREPAID_PCT = Math.min(50, Math.max(0, Number(process.env.PREPAID_DISCOUNT_PERCENT) || 5));
const SITE = {
  brand: "RYVON",
  contactEmail: process.env.CONTACT_EMAIL || "ryvonsupport@gmail.com",
  contactPhone: String(process.env.CONTACT_PHONE || "").trim(),
  contactWhatsapp: String(process.env.CONTACT_WHATSAPP || process.env.CONTACT_PHONE || "").replace(/\D/g, ""),
  socialInstagram: String(process.env.SOCIAL_INSTAGRAM || "").trim(),
  socialFacebook: String(process.env.SOCIAL_FACEBOOK || "").trim(),
  upiId: String(process.env.UPI_ID || "").trim(),
  prepaidPercent: PREPAID_PCT,
};

const ADMIN = {
  username: process.env.ADMIN_USERNAME || "Karan#7563",
  password: process.env.ADMIN_PASSWORD || "Karan@7563",
  passwordHash: process.env.ADMIN_PASSWORD_HASH || "",
  pin: process.env.ADMIN_PIN || "9784",
  name: process.env.ADMIN_NAME || "Karan",
  email: process.env.ADMIN_EMAIL || "Karan#7563",
};
const TOKEN = process.env.ADMIN_TOKEN || "ryvon-admin-token";

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]?\$/.test(value);
}

function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), 10);
}

function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compareSync(String(plain), stored);
  return stored === String(plain);
}

function verifyAdminPassword(plain) {
  if (ADMIN.passwordHash) return verifyPassword(plain, ADMIN.passwordHash);
  return String(plain) === String(ADMIN.password);
}

function issueUserToken(user) {
  const token = crypto.randomBytes(24).toString("hex");
  user.authToken = token;
  user.authTokenAt = new Date().toISOString();
  return token;
}

function isPrepaidMethod(payment) {
  const p = String(payment || "").toLowerCase();
  return ["upi", "card", "prepaid", "razorpay", "online"].includes(p);
}

function normalizeWishlist(ids) {
  const out = [];
  const seen = new Set();
  for (const raw of ids || []) {
    const id = Number(raw);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.slice(0, 100);
}

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(path.join(UPLOADS, "products"))) fs.mkdirSync(path.join(UPLOADS, "products"), { recursive: true });

const seedBanners = [
  {
    id: 1,
    type: "hero",
    title: "FRESH DROPS",
    subtitle: "New sneakers just landed",
    cta: "Shop Now",
    link: "/shop?sort=newest",
    image: "/products/p1.jpg",
    active: true,
    sort: 1,
  },
  {
    id: 2,
    type: "hero",
    title: "COURT READY",
    subtitle: "Jordan & high tops",
    cta: "Explore",
    link: "/shop?category=jordan",
    image: "/products/p7.jpg",
    active: true,
    sort: 2,
  },
  {
    id: 3,
    type: "hero",
    title: "SALE IS LIVE",
    subtitle: "Up to 40% off selected styles",
    cta: "Shop Sale",
    link: "/shop?sale=1",
    image: "/products/p9.jpg",
    active: true,
    sort: 3,
  },
  {
    id: 4,
    type: "promo",
    title: "Air Force Edit",
    subtitle: "",
    cta: "Shop Now",
    link: "/shop?category=air-force",
    image: "/products/p2.jpg",
    active: true,
    sort: 1,
  },
  {
    id: 5,
    type: "promo",
    title: "Samba Classics",
    subtitle: "",
    cta: "Shop Now",
    link: "/shop?category=samba",
    image: "/products/p11.jpg",
    active: true,
    sort: 2,
  },
];

function defaultStore() {
  return {
    products: structuredClone(seedProducts),
    categories: seedCategories.map((c, i) => ({
      ...c,
      slug: c.id,
      filter: c.to.includes("sale") ? "sale" : (c.to.match(/category=([^&]+)/)?.[1] || c.id),
      active: true,
      sort: i + 1,
    })),
    banners: structuredClone(seedBanners),
    coupons: [],
    orders: [],
    messages: [],
    users: [],
    nextProductId: 100,
    nextOrderId: 1001,
    nextBannerId: 10,
    nextCategoryId: 20,
    nextCouponId: 1,
    nextUserId: 1,
  };
}

function loadStore() {
  try {
    if (fs.existsSync(STORE)) return JSON.parse(fs.readFileSync(STORE, "utf8"));
  } catch (err) {
    console.error("[loadStore]", err.message);
  }
  return defaultStore();
}

function saveStore(data) {
  const dir = path.dirname(STORE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${STORE}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, STORE);
    try {
      fs.chmodSync(STORE, 0o664);
    } catch {}
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
    console.error("[saveStore]", STORE, err.message);
    throw err;
  }
}

/** Merge array records by key so a stale disk reload cannot drop newer in-memory rows. */
function mergeByKey(primary = [], secondary = [], keyFn) {
  const map = new Map();
  for (const row of [...secondary, ...primary]) {
    if (!row) continue;
    const key = keyFn(row);
    if (key == null || key === "") continue;
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()];
}

function reloadStore() {
  try {
    const disk = ensureStore(loadStore());
    const mem = store || disk;
    disk.orders = mergeByKey(mem.orders, disk.orders, (o) => o.code || `id:${o.id}`).sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
    disk.messages = mergeByKey(mem.messages, disk.messages, (m) => m.id).sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
    disk.users = mergeByKey(mem.users, disk.users, (u) => String(u.email || "").toLowerCase());
    // Prefer in-memory rows so a just-added product is never dropped by a stale disk read.
    disk.products = mergeByKey(mem.products, disk.products, (p) => p.id);
    disk.coupons = mergeByKey(mem.coupons, disk.coupons, (c) => c.id);
    disk.banners = mergeByKey(mem.banners, disk.banners, (b) => b.id);
    disk.categories = mergeByKey(mem.categories, disk.categories, (c) => c.id);
    const maxOrderId = disk.orders.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0);
    const maxUserId = disk.users.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
    const maxProductId = disk.products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
    disk.nextOrderId = Math.max(Number(disk.nextOrderId) || 1, Number(mem.nextOrderId) || 1, maxOrderId + 1);
    disk.nextUserId = Math.max(Number(disk.nextUserId) || 1, Number(mem.nextUserId) || 1, maxUserId + 1);
    disk.nextProductId = Math.max(Number(disk.nextProductId) || 1, Number(mem.nextProductId) || 1, maxProductId + 1);
    store = ensureStore(disk);
    // Persist merged view so disk catches up with memory (fixes admin missing orders).
    saveStore(store);
  } catch (err) {
    console.error("[reloadStore]", err.message);
  }
}

function ensureStore(s) {
  const d = defaultStore();
  if (!s.products?.length) s.products = d.products;
  if (!s.categories?.length) s.categories = d.categories;
  if (!s.banners?.length) s.banners = d.banners;
  if (!Array.isArray(s.coupons)) s.coupons = [];
  if (!Array.isArray(s.orders)) s.orders = [];
  if (!Array.isArray(s.messages)) s.messages = [];
  if (!Array.isArray(s.users)) s.users = [];
  s.users.forEach((u) => {
    if (!Array.isArray(u.wishlist)) u.wishlist = [];
  });
  (s.products || []).forEach((p) => {
    if (!p || !Array.isArray(p.sizes)) return;
    if (!p.stock || typeof p.stock !== "object") p.stock = {};
    p.sizes.forEach((sz) => {
      const key = String(sz);
      if (p.stock[key] == null || p.stock[key] === "") p.stock[key] = 10;
      else p.stock[key] = Math.max(0, Number(p.stock[key]) || 0);
    });
  });
  s.nextProductId ||= d.nextProductId;
  s.nextOrderId ||= d.nextOrderId;
  s.nextBannerId ||= d.nextBannerId;
  s.nextCategoryId ||= d.nextCategoryId;
  s.nextCouponId ||= d.nextCouponId;
  s.nextUserId ||= d.nextUserId;
  // Backfill users from past order customers
  (s.orders || []).forEach((o) => {
    const email = String(o.userEmail || o.customer?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (s.users.some((u) => u.email === email)) return;
    s.users.push({
      id: s.nextUserId++,
      name: String(o.customer?.name || email.split("@")[0]).trim(),
      email,
      phone: String(o.customer?.phone || "").trim(),
      picture: null,
      provider: "order",
      password: "",
      active: true,
      createdAt: o.createdAt || new Date().toISOString(),
      lastLoginAt: o.createdAt || new Date().toISOString(),
      source: "order",
    });
  });
  return s;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    picture: u.picture || null,
    provider: u.provider || "email",
    active: u.active !== false,
    wishlist: normalizeWishlist(u.wishlist),
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

function withAuthToken(user) {
  const token = issueUserToken(user);
  return { ...publicUser(user), token };
}

/** Last 10 digits — compares Indian mobiles fairly. */
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function findUserByPhone(phone, exceptId = null) {
  const key = normalizePhone(phone);
  if (key.length < 10) return null;
  return store.users.find(
    (u) => u.id !== exceptId && normalizePhone(u.phone) === key
  ) || null;
}

/** Create or update a storefront user. Never returns password. */
function upsertUser(payload = {}) {
  const email = String(payload.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: "Valid email required" };
  const now = new Date().toISOString();
  const phoneRaw = payload.phone != null ? String(payload.phone).trim() : "";
  const phoneKey = normalizePhone(phoneRaw);
  let user = store.users.find((u) => u.email === email);

  if (!user) {
    if (phoneKey.length >= 10 && findUserByPhone(phoneRaw)) {
      if (payload.source === "order") {
        // Keep order customer linked by email; skip conflicting phone
      } else {
        return { ok: false, error: "Phone number already registered with another account" };
      }
    }
    user = {
      id: store.nextUserId++,
      name: String(payload.name || email.split("@")[0]).trim(),
      email,
      phone: phoneKey.length >= 10 && !findUserByPhone(phoneRaw) ? phoneRaw : "",
      picture: payload.picture || null,
      provider: payload.provider || "email",
      password: payload.password ? hashPassword(payload.password) : "",
      wishlist: normalizeWishlist(payload.wishlist),
      active: true,
      createdAt: now,
      lastLoginAt: now,
      source: payload.source || "auth",
    };
    store.users.unshift(user);
  } else {
    if (user.active === false && payload.source !== "order") {
      return { ok: false, error: "This account is disabled. Contact support." };
    }
    if (payload.name) user.name = String(payload.name).trim();
    if (phoneRaw) {
      const other = findUserByPhone(phoneRaw, user.id);
      if (other) {
        if (payload.source !== "order") {
          return { ok: false, error: "Phone number already registered with another account" };
        }
      } else {
        user.phone = phoneRaw;
      }
    }
    if (payload.picture) user.picture = payload.picture;
    if (payload.provider && payload.provider !== "order") user.provider = payload.provider;
    if (payload.password) user.password = hashPassword(payload.password);
    if (Array.isArray(payload.wishlist)) {
      user.wishlist = normalizeWishlist([...(user.wishlist || []), ...payload.wishlist]);
    }
    if (!Array.isArray(user.wishlist)) user.wishlist = [];
    if (payload.source !== "order") user.lastLoginAt = now;
    if (user.active == null) user.active = true;
  }
  saveStore(store);
  return { ok: true, user };
}

function normalizeCouponCode(code) {
  return String(code || "").trim().toUpperCase();
}

/** Returns { ok, error?, discount, coupon } for a code against subtotal. */
function evaluateCoupon(code, subtotal) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { ok: false, error: "Enter a coupon code" };
  const coupon = store.coupons.find((c) => normalizeCouponCode(c.code) === normalized);
  if (!coupon) return { ok: false, error: "Invalid coupon code" };
  if (coupon.active === false) return { ok: false, error: "This coupon is inactive" };
  if (coupon.expiresAt) {
    const end = new Date(coupon.expiresAt);
    if (!Number.isNaN(end.getTime()) && end < new Date()) {
      return { ok: false, error: "This coupon has expired" };
    }
  }
  const limit = coupon.usageLimit != null ? Number(coupon.usageLimit) : null;
  if (limit != null && limit > 0 && Number(coupon.usedCount || 0) >= limit) {
    return { ok: false, error: "This coupon has reached its usage limit" };
  }
  const minOrder = Number(coupon.minOrder || 0);
  if (subtotal < minOrder) {
    return { ok: false, error: `Minimum order ${minOrder} required for this coupon` };
  }
  let discount = 0;
  const value = Number(coupon.value) || 0;
  if (coupon.type === "percent") {
    discount = Math.round((subtotal * value) / 100);
    const maxDiscount = coupon.maxDiscount != null ? Number(coupon.maxDiscount) : null;
    if (maxDiscount != null && maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  } else {
    discount = Math.round(value);
  }
  discount = Math.max(0, Math.min(discount, subtotal));
  if (discount <= 0) return { ok: false, error: "Coupon gives no discount on this order" };
  return { ok: true, discount, coupon };
}

let store = ensureStore(loadStore());
saveStore(store);

const app = express();
app.use(cors());
app.use((req, res, next) => {
  // Prevent CDN/browser from caching API (was serving stale admin orders).
  if (req.path.startsWith("/api") || req.url.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});
app.use(
  express.json({
    limit: "25mb",
    verify: (req, _res, buf) => {
      if (req.originalUrl?.includes("/payments/razorpay/webhook")) {
        req.rawBody = buf;
      }
    },
  })
);
app.use("/uploads", express.static(UPLOADS));
app.use("/products", express.static(path.join(__dirname, "../client/public/products")));

function authAdmin(req, res, next) {
  const h = req.headers.authorization || "";
  if (h !== `Bearer ${TOKEN}`) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function authUser(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Login required" });
  const user = store.users.find((u) => u.authToken && u.authToken === token);
  if (!user || user.active === false) {
    return res.status(401).json({ error: "Session expired. Please login again." });
  }
  req.user = user;
  next();
}

function resolveOrderLines(rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    return { ok: false, error: "Cart is empty" };
  }
  const lines = [];
  for (const raw of rawItems) {
    const productId = Number(raw.productId ?? raw.id);
    const product = store.products.find((p) => p.id === productId && p.active !== false);
    if (!product) {
      return { ok: false, error: `Product unavailable (id ${productId || "?"})` };
    }
    const sizeKey = String(raw.size ?? "");
    const qty = Math.max(1, Math.min(20, Number(raw.qty) || 1));
    const sizeOk =
      (Array.isArray(product.sizes) && product.sizes.map(Number).includes(Number(sizeKey))) ||
      (product.stock && Object.prototype.hasOwnProperty.call(product.stock, sizeKey));
    if (!sizeOk) {
      return { ok: false, error: `${product.name}: size UK ${sizeKey} not available` };
    }
    const stockQty = product.stock?.[sizeKey];
    if (stockQty != null && Number(stockQty) < qty) {
      return {
        ok: false,
        error: `${product.name} (UK ${sizeKey}) only has ${stockQty} left`,
      };
    }
    lines.push({
      productId: product.id,
      name: product.name,
      image: product.image || (product.images && product.images[0]) || "",
      size: Number(sizeKey) || sizeKey,
      color: raw.color || "",
      price: Number(product.price) || 0,
      qty,
    });
  }
  return { ok: true, lines };
}

function decrementStock(lines) {
  for (const line of lines) {
    const product = store.products.find((p) => p.id === line.productId);
    if (!product) continue;
    if (!product.stock || typeof product.stock !== "object") product.stock = {};
    const key = String(line.size);
    const current = Number(product.stock[key]);
    const base = Number.isFinite(current) ? current : 10;
    product.stock[key] = Math.max(0, base - Number(line.qty));
  }
}

function restoreStock(lines) {
  for (const line of lines || []) {
    const product = store.products.find((p) => p.id === line.productId);
    if (!product) continue;
    if (!product.stock || typeof product.stock !== "object") product.stock = {};
    const key = String(line.size);
    const current = Number(product.stock[key]);
    product.stock[key] = (Number.isFinite(current) ? current : 0) + Number(line.qty || 0);
  }
}

function sortBySort(a, b) {
  return (a.sort || 0) - (b.sort || 0);
}

app.get("/api/site", (_req, res) => {
  const rzp = getRazorpayPublic();
  res.json({
    brand: SITE.brand,
    contactEmail: SITE.contactEmail,
    contactPhone: SITE.contactPhone,
    contactWhatsapp: SITE.contactWhatsapp,
    socialInstagram: SITE.socialInstagram,
    socialFacebook: SITE.socialFacebook,
    upiId: SITE.upiId,
    prepaidPercent: SITE.prepaidPercent,
    guestCheckout: true,
    razorpayEnabled: rzp.enabled,
    razorpayKeyId: rzp.keyId,
    razorpayMethods: rzp.methods,
  });
});

app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    brand: "RYVON",
    pid: process.pid,
    orders: Array.isArray(store?.orders) ? store.orders.length : 0,
    messages: Array.isArray(store?.messages) ? store.messages.length : 0,
    storeFile: STORE,
  })
);

app.get("/api/pincode/:pin", async (req, res) => {
  const pin = String(req.params.pin || "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: "Valid 6-digit pincode required", city: "", state: "" });
  }
  try {
    const upstream = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const data = await upstream.json();
    const row = Array.isArray(data) ? data[0] : null;
    const office = row?.Status === "Success" && row.PostOffice?.[0];
    if (!office) {
      return res.status(404).json({ error: "Invalid pincode", city: "", state: "" });
    }
    const city = String(office.District || office.Block || office.Name || "").trim();
    const state = String(office.State || "").trim();
    res.json({
      pincode: pin,
      city,
      state,
      district: office.District || "",
      country: office.Country || "India",
    });
  } catch (err) {
    console.error("[pincode]", err.message);
    res.status(502).json({ error: "Pincode lookup failed", city: "", state: "" });
  }
});

app.get("/api/categories", (_req, res) => {
  res.json(
    store.categories
      .filter((c) => c.active !== false)
      .sort(sortBySort)
      .map((c) => ({
        id: c.slug || c.id,
        name: c.name,
        image: c.image,
        to: c.to || (c.filter === "sale" ? "/shop?sale=1" : `/shop?category=${c.filter || c.slug || c.id}`),
        filter: c.filter || c.slug || c.id,
      }))
  );
});

app.get("/api/banners", (req, res) => {
  const type = req.query.type;
  let list = store.banners.filter((b) => b.active !== false);
  if (type) list = list.filter((b) => b.type === type);
  res.json(list.sort(sortBySort));
});

app.get("/api/products", (req, res) => {
  const { category, sort, search, sale, section } = req.query;
  let list = store.products.filter((p) => p.active !== false);

  if (category && category !== "all") list = list.filter((p) => p.category === category);
  if (sale === "1") list = list.filter((p) => p.mrp > p.price);
  if (section === "fresh") list = list.filter((p) => p.badge === "NEW" || p.id > 12);
  if (section === "collab") list = list.filter((p) => ["LIMITED", "HOT"].includes(p.badge) || ["travis-scott", "jordan"].includes(p.category));
  if (section === "bestsellers") list = list.filter((p) => p.badge === "BESTSELLER" || ["air-force", "samba"].includes(p.category)).slice(0, 8);
  if (section === "trail") list = list.filter((p) => ["jordan", "retro", "low-dunk"].includes(p.category));

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.category.includes(q));
  }

  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "newest") list.sort((a, b) => b.id - a.id);

  res.json(list);
});

app.get("/api/products/:id", (req, res) => {
  const p = store.products.find((x) => x.id === Number(req.params.id) && x.active !== false);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

app.get("/api/products/:id/related", (req, res) => {
  const p = store.products.find((x) => x.id === Number(req.params.id));
  if (!p) return res.status(404).json([]);
  const related = store.products
    .filter((x) => x.active !== false && x.id !== p.id && x.category === p.category)
    .slice(0, 8);
  res.json(related.length ? related : store.products.filter((x) => x.active !== false && x.id !== p.id).slice(0, 8));
});

app.post("/api/coupons/validate", (req, res) => {
  const { code, subtotal } = req.body || {};
  const amount = Number(subtotal) || 0;
  const result = evaluateCoupon(code, amount);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({
    ok: true,
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    discount: result.discount,
  });
});

app.post("/api/orders", async (req, res) => {
  const { items, customer, payment, shipping, couponCode } = req.body || {};
  if (!customer?.name || !customer?.phone || !customer?.address) {
    return res.status(400).json({ error: "Missing order details" });
  }
  const email = String(customer.email || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Valid email required for order confirmation" });
  }
  if (!String(customer.city || "").trim() || !String(customer.state || "").trim()) {
    return res.status(400).json({ error: "City and state are required" });
  }
  const pin = String(customer.pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: "Valid 6-digit pincode required" });
  }

  reloadStore();
  const resolved = resolveOrderLines(items);
  if (!resolved.ok) return res.status(400).json({ error: resolved.error });
  const lines = resolved.lines;

  const subtotal = lines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
  const ship = shipping != null ? Number(shipping) : subtotal >= 999 ? 0 : 79;
  const shipFinal = subtotal >= 999 ? 0 : Number.isFinite(ship) ? Math.max(0, ship) : 79;

  let couponDiscount = 0;
  let appliedCode = null;
  let appliedCouponId = null;
  if (couponCode) {
    const result = evaluateCoupon(couponCode, subtotal);
    if (!result.ok) return res.status(400).json({ error: result.error });
    couponDiscount = result.discount;
    appliedCode = result.coupon.code;
    appliedCouponId = result.coupon.id;
  }

  let payMethod = String(payment || "cod").toLowerCase();
  if (["upi", "card", "online", "prepaid"].includes(payMethod)) payMethod = "razorpay";
  const wantsOnline = payMethod === "razorpay";
  if (wantsOnline && !razorpayConfigured()) {
    return res.status(503).json({
      error: "Online payments are not configured yet. Please use Cash on Delivery or try again later.",
    });
  }

  const prepaid = isPrepaidMethod(payMethod);
  const prepaidDiscount = prepaid ? Math.round((subtotal * SITE.prepaidPercent) / 100) : 0;
  const discount = Math.max(0, Math.min(subtotal, couponDiscount + prepaidDiscount));
  const total = Math.max(0, subtotal - discount) + shipFinal;

  for (const line of lines) {
    const product = store.products.find((p) => p.id === line.productId);
    const key = String(line.size);
    const left = product?.stock?.[key];
    if (left != null && Number(left) < line.qty) {
      return res.status(400).json({
        error: `${product.name} (UK ${key}) only has ${left} left`,
      });
    }
  }

  decrementStock(lines);

  const order = {
    id: store.nextOrderId++,
    code: `RYV${Date.now().toString().slice(-8)}`,
    status: wantsOnline ? "pending_payment" : "placed",
    payment: wantsOnline ? "razorpay" : payMethod || "cod",
    paymentStatus: wantsOnline ? "pending" : "cod",
    customer: { ...customer, email, pincode: pin },
    userEmail: email,
    items: lines,
    subtotal,
    shipping: shipFinal,
    discount,
    couponDiscount,
    prepaidDiscount,
    couponCode: appliedCode,
    total,
    createdAt: new Date().toISOString(),
  };
  if (appliedCouponId != null) {
    const c = store.coupons.find((x) => x.id === appliedCouponId);
    if (c) c.usedCount = Number(c.usedCount || 0) + 1;
  }
  store.orders.unshift(order);
  upsertUser({
    email,
    name: customer.name,
    phone: customer.phone,
    provider: "order",
    source: "order",
  });

  if (!wantsOnline) {
    saveStore(store);
    return res.status(201).json(order);
  }

  try {
    const amountPaise = Math.round(Number(order.total) * 100);
    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      receipt: order.code,
      notes: {
        orderCode: order.code,
        email,
        phone: String(customer.phone || ""),
      },
    });
    order.razorpayOrderId = rzpOrder.id;
    order.razorpayAmount = amountPaise;
    saveStore(store);
    const pub = getRazorpayPublic();
    return res.status(201).json({
      ...order,
      razorpay: {
        keyId: pub.keyId,
        orderId: rzpOrder.id,
        amount: amountPaise,
        currency: "INR",
        name: "RYVON",
        description: `Order ${order.code}`,
        prefill: {
          name: order.customer.name,
          email: order.customer.email,
          contact: String(order.customer.phone || "").replace(/\D/g, "").slice(-10),
        },
      },
    });
  } catch (err) {
    console.error("[razorpay create]", err?.message || err);
    restoreStock(lines);
    store.orders = store.orders.filter((o) => o.code !== order.code);
    saveStore(store);
    return res.status(502).json({ error: err.message || "Could not start online payment" });
  }
});

function markOrderPaid(order, paymentMeta = {}) {
  if (!order) return;
  if (order.paymentStatus === "paid") return order;
  order.status = "placed";
  order.paymentStatus = "paid";
  order.payment = "razorpay";
  order.paidAt = new Date().toISOString();
  if (paymentMeta.razorpayPaymentId) order.razorpayPaymentId = paymentMeta.razorpayPaymentId;
  if (paymentMeta.razorpayOrderId) order.razorpayOrderId = paymentMeta.razorpayOrderId;
  if (paymentMeta.method) order.razorpayMethod = paymentMeta.method;
  return order;
}

app.post("/api/payments/razorpay/verify", (req, res) => {
  const {
    orderCode,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body || {};

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  const ok = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!ok) return res.status(400).json({ error: "Invalid payment signature" });

  reloadStore();
  let order = null;
  if (orderCode) {
    order = store.orders.find((o) => o.code === orderCode);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ error: "Razorpay order mismatch" });
    }
  } else {
    order = store.orders.find((o) => o.razorpayOrderId === razorpayOrderId);
  }

  if (order) {
    markOrderPaid(order, { razorpayOrderId, razorpayPaymentId });
    saveStore(store);
    return res.json({ success: true, verified: true, order });
  }

  res.json({ success: true, verified: true });
});

/** Spec alias: POST /api/create-order — { amount (paise), currency?, receipt? } */
app.post("/api/create-order", async (req, res) => {
  try {
    if (!razorpayConfigured()) {
      return res.status(503).json({ error: "Razorpay is not configured" });
    }
    const amount = Math.round(Number(req.body?.amount));
    const currency = String(req.body?.currency || "INR").toUpperCase();
    const receipt = String(req.body?.receipt || `rcpt_${Date.now()}`).slice(0, 40);
    if (!Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({ error: "Amount must be at least 100 paise" });
    }
    const rzpOrder = await createRazorpayOrder({
      amountPaise: amount,
      currency,
      receipt,
      notes: req.body?.notes || {},
    });
    const pub = getRazorpayPublic();
    res.status(201).json({
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: pub.keyId,
      receipt: rzpOrder.receipt,
    });
  } catch (err) {
    const status = err.status || 500;
    if (status === 401) return res.status(401).json({ error: err.message || "Razorpay auth failed" });
    if (status === 400) return res.status(400).json({ error: err.message });
    console.error("[create-order]", err.message);
    res.status(500).json({ error: err.message || "Could not create Razorpay order" });
  }
});

/** Spec alias: POST /api/verify-payment */
app.post("/api/verify-payment", (req, res) => {
  const razorpayOrderId = req.body?.razorpay_order_id || req.body?.order_id;
  const razorpayPaymentId = req.body?.razorpay_payment_id || req.body?.payment_id;
  const razorpaySignature = req.body?.razorpay_signature || req.body?.signature;
  const orderCode = req.body?.orderCode || req.body?.order_code;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "Missing razorpay_order_id, razorpay_payment_id or razorpay_signature" });
  }

  const ok = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!ok) {
    return res.status(400).json({ success: false, error: "Invalid payment signature" });
  }

  reloadStore();
  let order = null;
  if (orderCode) order = store.orders.find((o) => o.code === orderCode);
  if (!order) order = store.orders.find((o) => o.razorpayOrderId === razorpayOrderId);
  if (order) {
    markOrderPaid(order, { razorpayOrderId, razorpayPaymentId });
    saveStore(store);
  }

  res.json({
    success: true,
    verified: true,
    order_id: razorpayOrderId,
    payment_id: razorpayPaymentId,
    order: order || undefined,
  });
});

app.post("/api/payments/razorpay/cancel", (req, res) => {
  const { orderCode } = req.body || {};
  if (!orderCode) return res.status(400).json({ error: "Order code required" });
  reloadStore();
  const order = store.orders.find((o) => o.code === orderCode);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentStatus === "paid") {
    return res.status(400).json({ error: "Paid order cannot be cancelled this way" });
  }
  if (order.status !== "pending_payment") {
    return res.status(400).json({ error: "Order is not awaiting payment" });
  }
  restoreStock(order.items);
  order.status = "cancelled";
  order.paymentStatus = "cancelled";
  order.cancelledAt = new Date().toISOString();
  saveStore(store);
  res.json({ ok: true, order });
});

app.post("/api/payments/razorpay/webhook", (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    if (!verifyWebhookSignature(raw, signature)) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }
    const payload = typeof req.body === "object" && req.body ? req.body : JSON.parse(raw.toString("utf8"));
    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    if (event === "payment.captured" && paymentEntity) {
      reloadStore();
      const rzpOrderId = paymentEntity.order_id;
      const order =
        store.orders.find((o) => o.razorpayOrderId === rzpOrderId) ||
        store.orders.find((o) => o.code === paymentEntity.notes?.orderCode);
      if (order && order.paymentStatus !== "paid") {
        markOrderPaid(order, {
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: paymentEntity.id,
          method: paymentEntity.method,
        });
        saveStore(store);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[razorpay webhook]", err.message);
    res.status(500).json({ error: "Webhook failed" });
  }
});

app.get("/api/my-orders", (req, res) => {
  reloadStore();
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required" });
  const list = store.orders.filter((o) => {
    const oe = String(o.userEmail || o.customer?.email || "").trim().toLowerCase();
    return oe && oe === email;
  });
  res.json(list);
});

app.get("/api/orders/:code", (req, res) => {
  reloadStore();
  const o = store.orders.find((x) => x.code === req.params.code || String(x.id) === req.params.code);
  if (!o) return res.status(404).json({ error: "Order not found" });
  res.json(o);
});

app.post("/api/contact", (req, res) => {
  const { name, email, phone, message, topic } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
  const text = topic ? `[${topic}]\n\n${message}` : message;
  const msg = {
    id: Date.now(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone || "",
    topic: topic || "",
    message: text,
    createdAt: new Date().toISOString(),
    read: false,
  };
  reloadStore();
  store.messages.unshift(msg);
  saveStore(store);
  res.status(201).json({ ok: true, id: msg.id });
});

/* Storefront auth — persist users for admin */
app.post("/api/auth/register", (req, res) => {
  const b = req.body || {};
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const password = String(b.password || "");
  if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });
  if (!name) return res.status(400).json({ error: "Name required" });
  if (normalizePhone(phone).length < 10) return res.status(400).json({ error: "Valid phone required" });
  if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  if (store.users.some((u) => u.email === email)) {
    return res.status(400).json({ error: "Email already registered. Please login." });
  }
  if (findUserByPhone(phone)) {
    return res.status(400).json({ error: "Phone number already registered. Please login." });
  }
  const result = upsertUser({
    name,
    email,
    phone,
    password,
    wishlist: b.wishlist,
    provider: "email",
    source: "register",
  });
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.status(201).json(withAuthToken(result.user));
  setImmediate(() => {
    try {
      saveStore(store);
    } catch (err) {
      console.error("[auth/register save]", err.message);
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const b = req.body || {};
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });
  if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  const user = store.users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "No account with this email. Please register." });
  }
  if (user.active === false) {
    return res.status(403).json({ error: "This account is disabled. Contact support." });
  }
  if (!user.password) {
    return res.status(401).json({ error: "This account uses Google sign-in. Continue with Google." });
  }
  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  // Migrate legacy plaintext passwords to bcrypt
  if (!isBcryptHash(user.password)) {
    user.password = hashPassword(password);
  }
  if (Array.isArray(b.wishlist) && b.wishlist.length) {
    user.wishlist = normalizeWishlist([...(user.wishlist || []), ...b.wishlist]);
  }
  if (!Array.isArray(user.wishlist)) user.wishlist = [];
  user.lastLoginAt = new Date().toISOString();
  const payload = withAuthToken(user);
  res.json(payload);
  setImmediate(() => {
    try {
      saveStore(store);
    } catch (err) {
      console.error("[auth/login save]", err.message);
    }
  });
});

app.post("/api/auth/google", (req, res) => {
  const b = req.body || {};
  const email = String(b.email || "").trim().toLowerCase();
  if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });
  const existing = store.users.find((u) => u.email === email);
  if (existing && existing.active === false) {
    return res.status(403).json({ error: "This account is disabled. Contact support." });
  }
  const result = upsertUser({
    email,
    name: b.name,
    picture: b.picture,
    phone: b.phone,
    wishlist: b.wishlist,
    provider: "google",
    source: "google",
  });
  if (!result.ok) return res.status(400).json({ error: result.error });
  const payload = withAuthToken(result.user);
  res.json(payload);
  setImmediate(() => {
    try {
      saveStore(store);
    } catch (err) {
      console.error("[auth/google save]", err.message);
    }
  });
});

app.get("/api/me/wishlist", authUser, (req, res) => {
  if (!Array.isArray(req.user.wishlist)) req.user.wishlist = [];
  res.json({ ids: normalizeWishlist(req.user.wishlist) });
});

app.put("/api/me/wishlist", authUser, (req, res) => {
  const ids = normalizeWishlist(req.body?.ids);
  req.user.wishlist = ids;
  saveStore(store);
  res.json({ ids });
});

/* ——— Admin ——— */
app.post("/api/admin/login", (req, res) => {
  const { email, username, password, pin } = req.body || {};
  const user = String(username || email || "").trim();
  if (String(pin || "").trim() !== String(ADMIN.pin)) {
    return res.status(401).json({ error: "Invalid PIN" });
  }
  if (user === ADMIN.username && verifyAdminPassword(password)) {
    return res.json({ token: TOKEN, admin: { name: ADMIN.name, email: ADMIN.email } });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/admin/upload", authAdmin, (req, res) => {
  const { dataUrl, filename } = req.body || {};
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "Image file required (any image type)" });
  }
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: "Invalid image data" });
  const mime = match[1].toLowerCase();

  const EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/pjpeg": "jpg",
    "image/png": "png",
    "image/x-png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/x-ms-bmp": "bmp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/tiff": "tiff",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  };
  let ext = EXT[mime];
  if (!ext) {
    const fromName = String(filename || "").match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    ext = fromName && /^[a-z0-9]{2,5}$/.test(fromName) ? fromName : "img";
  }

  const safe = String(filename || "upload")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, 40);
  const name = `${Date.now()}-${safe || "image"}.${ext}`;
  const filePath = path.join(UPLOADS, "products", name);
  try {
    fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
  } catch {
    return res.status(500).json({ error: "Could not save image" });
  }
  const url = `/uploads/products/${name}`;
  res.status(201).json({ url, mime });
});

app.get("/api/admin/stats", authAdmin, (_req, res) => {
  reloadStore();
  const revenue = store.orders.reduce(
    (s, o) => s + (o.status !== "cancelled" && o.status !== "pending_payment" ? o.total : 0),
    0
  );
  const openOrders = store.orders.filter((o) => o.status === "placed" || o.status === "pending_payment").length;
  const unreadMessages = store.messages.filter((m) => !m.read).length;
  res.json({
    products: store.products.length,
    categories: store.categories.length,
    banners: store.banners.length,
    coupons: store.coupons.length,
    users: store.users.length,
    orders: store.orders.length,
    messages: unreadMessages,
    revenue,
    recentOrders: store.orders.slice(0, 5),
    badges: {
      orders: openOrders,
      messages: unreadMessages,
      users: store.users.filter((u) => {
        const t = Date.parse(u.createdAt || u.lastLoginAt || "");
        return Number.isFinite(t) && Date.now() - t < 7 * 24 * 60 * 60 * 1000;
      }).length,
      products: store.products.filter((p) => {
        const t = Date.parse(p.createdAt || p.updatedAt || "");
        return Number.isFinite(t) && Date.now() - t < 7 * 24 * 60 * 60 * 1000;
      }).length,
      categories: store.categories.length,
      banners: store.banners.filter((b) => b.active !== false).length,
      coupons: store.coupons.filter((c) => c.active !== false).length,
      dashboard: openOrders + unreadMessages,
    },
  });
});

app.get("/api/admin/users", authAdmin, (_req, res) => {
  const list = [...store.users]
    .sort((a, b) => String(b.lastLoginAt || b.createdAt || "").localeCompare(String(a.lastLoginAt || a.createdAt || "")))
    .map((u) => {
      const email = u.email;
      const orderCount = store.orders.filter(
        (o) => String(o.userEmail || o.customer?.email || "").toLowerCase() === email
      ).length;
      const spent = store.orders
        .filter((o) => String(o.userEmail || o.customer?.email || "").toLowerCase() === email && o.status !== "cancelled")
        .reduce((s, o) => s + (Number(o.total) || 0), 0);
      return { ...publicUser(u), orderCount, spent };
    });
  res.json(list);
});

app.get("/api/admin/users/:id/orders", authAdmin, (req, res) => {
  const user = store.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  const email = String(user.email || "").toLowerCase();
  const orders = store.orders.filter(
    (o) => String(o.userEmail || o.customer?.email || "").toLowerCase() === email
  );
  res.json(orders);
});

app.patch("/api/admin/users/:id", authAdmin, (req, res) => {
  const user = store.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Not found" });
  if (req.body?.active !== undefined) user.active = !!req.body.active;
  saveStore(store);
  const email = user.email;
  const orderCount = store.orders.filter(
    (o) => String(o.userEmail || o.customer?.email || "").toLowerCase() === email
  ).length;
  const spent = store.orders
    .filter((o) => String(o.userEmail || o.customer?.email || "").toLowerCase() === email && o.status !== "cancelled")
    .reduce((s, o) => s + (Number(o.total) || 0), 0);
  res.json({ ...publicUser(user), orderCount, spent });
});

/* Products */
app.get("/api/admin/products", authAdmin, (_req, res) => {
  reloadStore();
  res.json(Array.isArray(store.products) ? store.products : []);
});

app.post("/api/admin/products", authAdmin, (req, res) => {
  reloadStore();
  const b = req.body || {};
  if (!b.name || !b.price) return res.status(400).json({ error: "Name and price required" });
  const sizes = Array.isArray(b.sizes) && b.sizes.length
    ? b.sizes.map(Number).filter((n) => !Number.isNaN(n))
    : [7, 8, 9, 10, 11];
  const stock = {};
  sizes.forEach((s) => {
    const key = String(s);
    stock[key] = b.stock && b.stock[key] != null ? Number(b.stock[key]) : 10;
  });
  const images = Array.isArray(b.images) && b.images.length ? b.images : [b.image || "/products/p1.jpg"];
  const now = new Date().toISOString();
  const product = {
    id: store.nextProductId++,
    name: b.name,
    type: b.type || "Men Shoes",
    category: b.category || "lifestyle",
    price: Number(b.price),
    mrp: Number(b.mrp || b.price),
    badge: b.badge || null,
    active: b.active !== false,
    colors: Array.isArray(b.colorOptions) && b.colorOptions.length
      ? b.colorOptions.length
      : Number(b.colors || 2),
    colorOptions: Array.isArray(b.colorOptions) && b.colorOptions.length
      ? b.colorOptions.map((c) =>
          typeof c === "string"
            ? { name: c, hex: c }
            : { name: String(c.name || "Color"), hex: String(c.hex || "#111111") }
        )
      : [
          { name: "Black", hex: "#111111" },
          { name: "White", hex: "#f5f5f5" },
        ],
    sizes,
    stock,
    image: images[0],
    images,
    description: b.description || "",
    features: Array.isArray(b.features) ? b.features : (b.features ? String(b.features).split("|").map((s) => s.trim()).filter(Boolean) : ["Premium build", "Everyday comfort"]),
    createdAt: now,
    updatedAt: now,
  };
  store.products.unshift(product);
  saveStore(store);
  res.status(201).json(product);
});

app.put("/api/admin/products/:id", authAdmin, (req, res) => {
  // Avoid reload-first race that dropped freshly added products (404 on edit).
  const idKey = String(req.params.id);
  let idx = store.products.findIndex((p) => String(p.id) === idKey);
  if (idx < 0) {
    reloadStore();
    idx = store.products.findIndex((p) => String(p.id) === idKey);
  }
  if (idx < 0) return res.status(404).json({ error: "Product not found. Refresh and try again." });
  const b = req.body || {};
  const prev = store.products[idx];
  const sizes = Array.isArray(b.sizes) && b.sizes.length
    ? b.sizes.map(Number).filter((n) => !Number.isNaN(n))
    : prev.sizes || [7, 8, 9, 10, 11];
  let stock = { ...(prev.stock || {}) };
  if (b.stock && typeof b.stock === "object") {
    Object.entries(b.stock).forEach(([k, v]) => {
      stock[String(k)] = Math.max(0, Number(v) || 0);
    });
  }
  sizes.forEach((s) => {
    const key = String(s);
    if (stock[key] == null) stock[key] = 10;
  });
  Object.keys(stock).forEach((k) => {
    if (!sizes.includes(Number(k))) delete stock[k];
  });
  const images = Array.isArray(b.images) && b.images.length
    ? b.images.filter(Boolean)
    : b.image
      ? [b.image, ...(prev.images || []).filter((u) => u !== b.image).slice(0, 5)]
      : prev.images || [prev.image];

  const next = {
    ...prev,
    name: b.name != null ? String(b.name) : prev.name,
    type: b.type != null ? String(b.type) : prev.type,
    category: b.category != null ? String(b.category) : prev.category,
    price: b.price != null ? Number(b.price) : prev.price,
    mrp: b.mrp != null ? Number(b.mrp) : prev.mrp,
    badge: b.badge !== undefined ? b.badge || null : prev.badge,
    description: b.description != null ? String(b.description) : prev.description,
    active: b.active !== undefined ? b.active !== false : prev.active !== false,
    sizes,
    stock,
    images,
    image: images[0] || prev.image,
    id: prev.id,
    createdAt: prev.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (Array.isArray(b.colorOptions)) {
    next.colorOptions = b.colorOptions.map((c) =>
      typeof c === "string"
        ? { name: c, hex: c }
        : { name: String(c.name || "Color"), hex: String(c.hex || "#111111") }
    );
    next.colors = next.colorOptions.length;
  }
  if (Array.isArray(b.features)) next.features = b.features;
  store.products[idx] = next;
  saveStore(store);
  res.json(store.products[idx]);
});

app.delete("/api/admin/products/:id", authAdmin, (req, res) => {
  const before = store.products.length;
  store.products = store.products.filter((p) => p.id !== Number(req.params.id));
  if (store.products.length === before) return res.status(404).json({ error: "Not found" });
  saveStore(store);
  res.json({ ok: true });
});

/* Categories CRUD */
app.get("/api/admin/categories", authAdmin, (_req, res) => {
  res.json([...store.categories].sort(sortBySort));
});

app.post("/api/admin/categories", authAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: "Name required" });
  const slug = (b.slug || b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (store.categories.some((c) => (c.slug || c.id) === slug)) {
    return res.status(400).json({ error: "Slug already exists" });
  }
  const filter = b.filter || slug;
  const cat = {
    id: store.nextCategoryId++,
    slug,
    name: b.name,
    image: b.image || "/products/p1.jpg",
    filter,
    to: b.to || (filter === "sale" ? "/shop?sale=1" : `/shop?category=${filter}`),
    active: b.active !== false,
    sort: Number(b.sort ?? store.categories.length + 1),
  };
  store.categories.push(cat);
  saveStore(store);
  res.status(201).json(cat);
});

app.put("/api/admin/categories/:id", authAdmin, (req, res) => {
  const id = req.params.id;
  const idx = store.categories.findIndex((c) => String(c.id) === id || c.slug === id);
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  const b = req.body || {};
  const prev = store.categories[idx];
  const slug = b.slug
    ? String(b.slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : prev.slug || prev.id;
  const filter = b.filter || prev.filter || slug;
  store.categories[idx] = {
    ...prev,
    ...b,
    id: prev.id,
    slug,
    filter,
    to: b.to || (filter === "sale" ? "/shop?sale=1" : `/shop?category=${filter}`),
    active: b.active != null ? !!b.active : prev.active !== false,
    sort: b.sort != null ? Number(b.sort) : prev.sort,
  };
  saveStore(store);
  res.json(store.categories[idx]);
});

app.delete("/api/admin/categories/:id", authAdmin, (req, res) => {
  const id = req.params.id;
  const before = store.categories.length;
  store.categories = store.categories.filter((c) => String(c.id) !== id && c.slug !== id);
  if (store.categories.length === before) return res.status(404).json({ error: "Not found" });
  saveStore(store);
  res.json({ ok: true });
});

/* Banners CRUD */
app.get("/api/admin/banners", authAdmin, (_req, res) => {
  res.json([...store.banners].sort((a, b) => a.type.localeCompare(b.type) || sortBySort(a, b)));
});

app.post("/api/admin/banners", authAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.image) return res.status(400).json({ error: "Title and image required" });
  const banner = {
    id: store.nextBannerId++,
    type: b.type === "promo" ? "promo" : "hero",
    title: b.title,
    subtitle: b.subtitle || "",
    cta: b.cta || "Shop Now",
    link: b.link || "/shop",
    image: b.image,
    active: b.active !== false,
    sort: Number(b.sort ?? 1),
  };
  store.banners.push(banner);
  saveStore(store);
  res.status(201).json(banner);
});

app.put("/api/admin/banners/:id", authAdmin, (req, res) => {
  const idx = store.banners.findIndex((x) => x.id === Number(req.params.id));
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  const b = req.body || {};
  store.banners[idx] = {
    ...store.banners[idx],
    ...b,
    id: store.banners[idx].id,
    type: b.type === "promo" ? "promo" : b.type === "hero" ? "hero" : store.banners[idx].type,
    active: b.active != null ? !!b.active : store.banners[idx].active !== false,
    sort: b.sort != null ? Number(b.sort) : store.banners[idx].sort,
  };
  saveStore(store);
  res.json(store.banners[idx]);
});

app.delete("/api/admin/banners/:id", authAdmin, (req, res) => {
  const before = store.banners.length;
  store.banners = store.banners.filter((x) => x.id !== Number(req.params.id));
  if (store.banners.length === before) return res.status(404).json({ error: "Not found" });
  saveStore(store);
  res.json({ ok: true });
});

app.get("/api/admin/orders", authAdmin, (_req, res) => {
  reloadStore();
  res.json(Array.isArray(store.orders) ? store.orders : []);
});

app.patch("/api/admin/orders/:id", authAdmin, (req, res) => {
  reloadStore();
  const o = store.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: "Not found" });
  const prev = o.status;
  if (req.body?.status) o.status = req.body.status;
  if (prev !== "cancelled" && o.status === "cancelled") {
    restoreStock(o.items);
  }
  saveStore(store);
  res.json(o);
});

app.get("/api/admin/messages", authAdmin, (_req, res) => {
  reloadStore();
  res.json(Array.isArray(store.messages) ? store.messages : []);
});

app.patch("/api/admin/messages/:id", authAdmin, (req, res) => {
  const m = store.messages.find((x) => x.id === Number(req.params.id));
  if (!m) return res.status(404).json({ error: "Not found" });
  m.read = true;
  saveStore(store);
  res.json(m);
});

app.delete("/api/admin/messages/:id", authAdmin, (req, res) => {
  const before = store.messages.length;
  store.messages = store.messages.filter((m) => m.id !== Number(req.params.id));
  if (store.messages.length === before) return res.status(404).json({ error: "Not found" });
  saveStore(store);
  res.json({ ok: true });
});

/* Coupons */
app.get("/api/admin/coupons", authAdmin, (_req, res) => {
  res.json([...store.coupons].sort((a, b) => (b.id || 0) - (a.id || 0)));
});

app.post("/api/admin/coupons", authAdmin, (req, res) => {
  const b = req.body || {};
  const code = normalizeCouponCode(b.code);
  if (!code) return res.status(400).json({ error: "Coupon code required" });
  if (store.coupons.some((c) => normalizeCouponCode(c.code) === code)) {
    return res.status(400).json({ error: "Coupon code already exists" });
  }
  const type = b.type === "percent" ? "percent" : "fixed";
  const value = Number(b.value);
  if (!value || value <= 0) return res.status(400).json({ error: "Discount value must be greater than 0" });
  if (type === "percent" && value > 100) return res.status(400).json({ error: "Percent cannot exceed 100" });
  const coupon = {
    id: store.nextCouponId++,
    code,
    type,
    value,
    minOrder: Math.max(0, Number(b.minOrder) || 0),
    maxDiscount: b.maxDiscount != null && b.maxDiscount !== "" ? Number(b.maxDiscount) : null,
    usageLimit: b.usageLimit != null && b.usageLimit !== "" ? Number(b.usageLimit) : null,
    usedCount: 0,
    expiresAt: b.expiresAt || null,
    active: b.active !== false,
    createdAt: new Date().toISOString(),
  };
  store.coupons.unshift(coupon);
  saveStore(store);
  res.status(201).json(coupon);
});

app.put("/api/admin/coupons/:id", authAdmin, (req, res) => {
  const idx = store.coupons.findIndex((c) => c.id === Number(req.params.id));
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  const prev = store.coupons[idx];
  const b = req.body || {};
  const code = b.code != null ? normalizeCouponCode(b.code) : prev.code;
  if (!code) return res.status(400).json({ error: "Coupon code required" });
  if (store.coupons.some((c) => c.id !== prev.id && normalizeCouponCode(c.code) === code)) {
    return res.status(400).json({ error: "Coupon code already exists" });
  }
  const type = b.type === "percent" ? "percent" : b.type === "fixed" ? "fixed" : prev.type;
  const value = b.value != null ? Number(b.value) : prev.value;
  if (!value || value <= 0) return res.status(400).json({ error: "Discount value must be greater than 0" });
  if (type === "percent" && value > 100) return res.status(400).json({ error: "Percent cannot exceed 100" });
  store.coupons[idx] = {
    ...prev,
    code,
    type,
    value,
    minOrder: b.minOrder != null ? Math.max(0, Number(b.minOrder) || 0) : prev.minOrder,
    maxDiscount:
      b.maxDiscount !== undefined
        ? b.maxDiscount != null && b.maxDiscount !== ""
          ? Number(b.maxDiscount)
          : null
        : prev.maxDiscount,
    usageLimit:
      b.usageLimit !== undefined
        ? b.usageLimit != null && b.usageLimit !== ""
          ? Number(b.usageLimit)
          : null
        : prev.usageLimit,
    expiresAt: b.expiresAt !== undefined ? b.expiresAt || null : prev.expiresAt,
    active: b.active !== undefined ? b.active !== false : prev.active !== false,
  };
  saveStore(store);
  res.json(store.coupons[idx]);
});

app.delete("/api/admin/coupons/:id", authAdmin, (req, res) => {
  const before = store.coupons.length;
  store.coupons = store.coupons.filter((c) => c.id !== Number(req.params.id));
  if (store.coupons.length === before) return res.status(404).json({ error: "Not found" });
  saveStore(store);
  res.json({ ok: true });
});

/* Single-instance guard — prevents duplicate APIs (admin missing orders). */
const PIDFILE = path.join(__dirname, "data", "api.pid");
function claimPidFile() {
  const dir = path.dirname(PIDFILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(PIDFILE)) {
    const oldPid = Number(String(fs.readFileSync(PIDFILE, "utf8")).trim());
    if (oldPid && oldPid !== process.pid) {
      try {
        process.kill(oldPid, 0);
        console.error(`[fatal] RYVON API already running as pid ${oldPid}. Kill it first.`);
        process.exit(1);
      } catch {
        /* stale pidfile */
      }
    }
  }
  fs.writeFileSync(PIDFILE, String(process.pid));
  const cleanup = () => {
    try {
      if (String(fs.readFileSync(PIDFILE, "utf8")).trim() === String(process.pid)) {
        fs.unlinkSync(PIDFILE);
      }
    } catch {
      /* ignore */
    }
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}
claimPidFile();

/* Bind IPv4 only — Apache proxies to 127.0.0.1:PORT (avoids :: vs 127.0.0.1 dual listeners). */
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`RYVON API http://127.0.0.1:${PORT} pid=${process.pid} store=${STORE}`);
});
server.on("error", (err) => {
  console.error("[fatal] listen failed:", err.message);
  process.exit(1);
});
