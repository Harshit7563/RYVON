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
    setItems((prev) => {
      const f = prev.find((i) => i.key === key);
      if (f) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { key, product, size, color, qty: 1 }];
    });
  };
  const remove = (key) => setItems((p) => p.filter((i) => i.key !== key));
  const setQty = (key, qty) => {
    if (qty < 1) return remove(key);
    setItems((p) => p.map((i) => (i.key === key ? { ...i, qty } : i)));
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
