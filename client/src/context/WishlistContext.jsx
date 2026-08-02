import { createContext, useContext, useEffect, useState } from "react";

const WishCtx = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ryvon-wish") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => localStorage.setItem("ryvon-wish", JSON.stringify(ids)), [ids]);

  const toggle = (id) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const has = (id) => ids.includes(id);
  const clear = () => setIds([]);

  return (
    <WishCtx.Provider value={{ ids, toggle, has, clear, count: ids.length }}>
      {children}
    </WishCtx.Provider>
  );
}

export function useWishlist() {
  const v = useContext(WishCtx);
  if (!v) throw new Error("useWishlist needs provider");
  return v;
}
