import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ryvon-bag") || "[]"); }
    catch { return []; }
  });

  useEffect(() => localStorage.setItem("ryvon-bag", JSON.stringify(items)), [items]);

  const add = (product, size, color) => {
    const key = `${product.id}-${size}-${color}`;
    const maxStock = Math.max(0, Number(product?.stock?.[String(size)]) || 0);
    setItems((prev) => {
      const f = prev.find((i) => i.key === key);
      const nextQty = (f?.qty || 0) + 1;
      if (maxStock > 0 && nextQty > maxStock) return prev;
      if (maxStock <= 0) return prev;
      if (f) return prev.map((i) => (i.key === key ? { ...i, qty: nextQty } : i));
      return [...prev, { key, product, size, color, qty: 1 }];
    });
  };
  const remove = (key) => setItems((p) => p.filter((i) => i.key !== key));
  const setQty = (key, qty) => {
    if (qty < 1) return remove(key);
    setItems((p) =>
      p.map((i) => {
        if (i.key !== key) return i;
        const maxStock = Math.max(0, Number(i.product?.stock?.[String(i.size)]) || 0);
        const capped = maxStock > 0 ? Math.min(qty, maxStock) : 0;
        return { ...i, qty: capped };
      }).filter((i) => i.qty > 0)
    );
  };
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const v = useContext(CartCtx);
  if (!v) throw new Error("useCart needs provider");
  return v;
}
