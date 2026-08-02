const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");

/** Resolve product/banner image paths for both public assets and API uploads. */
export function mediaUrl(src) {
  if (!src) return "/products/p1.jpg";
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/uploads/")) {
    if (import.meta.env.DEV) return src;
    return `${API_ORIGIN}${src}`;
  }
  return src;
}

async function req(url, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  let res;
  try {
    res = await fetch(`${API}${url}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(extraHeaders || {}),
      },
    });
  } catch {
    throw new Error("Server not running. Start API on port 5001.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const getProducts = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return req(`/products${q ? `?${q}` : ""}`);
};
export const getProduct = (id) => req(`/products/${id}`);
export const getRelated = (id) => req(`/products/${id}/related`).catch(() => []);
export const getCategories = () => req("/categories");
export const getBanners = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return req(`/banners${q ? `?${q}` : ""}`);
};
export const createOrder = (body) => req("/orders", { method: "POST", body: JSON.stringify(body) });
export const getOrder = (code) => req(`/orders/${code}`);
export const getMyOrders = (email) =>
  req(`/my-orders?email=${encodeURIComponent(email)}`);
export const lookupPincode = (pin) => req(`/pincode/${pin}`);
export const validateCoupon = (code, subtotal) =>
  req("/coupons/validate", { method: "POST", body: JSON.stringify({ code, subtotal }) });
export const sendContact = (body) => req("/contact", { method: "POST", body: JSON.stringify(body) });

export const authRegister = (body) => req("/auth/register", { method: "POST", body: JSON.stringify(body) });
export const authLogin = (body) => req("/auth/login", { method: "POST", body: JSON.stringify(body) });
export const authGoogle = (body) => req("/auth/google", { method: "POST", body: JSON.stringify(body) });

export const adminLogin = (username, password, pin) =>
  req("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, email: username, password, pin }),
  });

function adminHeaders() {
  const token = localStorage.getItem("ryvon-admin-token");
  return { Authorization: `Bearer ${token}` };
}

export const adminUpload = (dataUrl, filename) =>
  req("/admin/upload", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ dataUrl, filename }),
  });

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export const adminStats = () => req("/admin/stats", { headers: adminHeaders() });
export const adminProducts = () => req("/admin/products", { headers: adminHeaders() });
export const adminCreateProduct = (body) =>
  req("/admin/products", { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminUpdateProduct = (id, body) =>
  req(`/admin/products/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminDeleteProduct = (id) =>
  req(`/admin/products/${id}`, { method: "DELETE", headers: adminHeaders() });

export const adminCategories = () => req("/admin/categories", { headers: adminHeaders() });
export const adminCreateCategory = (body) =>
  req("/admin/categories", { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminUpdateCategory = (id, body) =>
  req(`/admin/categories/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminDeleteCategory = (id) =>
  req(`/admin/categories/${id}`, { method: "DELETE", headers: adminHeaders() });

export const adminBanners = () => req("/admin/banners", { headers: adminHeaders() });
export const adminCreateBanner = (body) =>
  req("/admin/banners", { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminUpdateBanner = (id, body) =>
  req(`/admin/banners/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminDeleteBanner = (id) =>
  req(`/admin/banners/${id}`, { method: "DELETE", headers: adminHeaders() });

export const adminCoupons = () => req("/admin/coupons", { headers: adminHeaders() });
export const adminCreateCoupon = (body) =>
  req("/admin/coupons", { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminUpdateCoupon = (id, body) =>
  req(`/admin/coupons/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(body) });
export const adminDeleteCoupon = (id) =>
  req(`/admin/coupons/${id}`, { method: "DELETE", headers: adminHeaders() });

export const adminUsers = () => req("/admin/users", { headers: adminHeaders() });
export const adminUserOrders = (id) =>
  req(`/admin/users/${id}/orders`, { headers: adminHeaders() });
export const adminUpdateUser = (id, body) =>
  req(`/admin/users/${id}`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify(body) });

export const adminOrders = () => req("/admin/orders", { headers: adminHeaders() });
export const adminUpdateOrder = (id, status) =>
  req(`/admin/orders/${id}`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ status }) });
export const adminMessages = () => req("/admin/messages", { headers: adminHeaders() });
export const adminReadMessage = (id) =>
  req(`/admin/messages/${id}`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({}) });
export const adminDeleteMessage = (id) =>
  req(`/admin/messages/${id}`, { method: "DELETE", headers: adminHeaders() });

export function inr(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
