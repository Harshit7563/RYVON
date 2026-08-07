import { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchWishlist, saveWishlist } from "../api";
import { useAuth } from "./AuthContext";

const WishCtx = createContext(null);
const LOCAL_KEY = "ryvon-wish";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function mergeIds(a = [], b = []) {
  return [...new Set([...a, ...b].map(Number).filter((n) => Number.isFinite(n)))];
}

export function WishlistProvider({ children }) {
  const { user, token } = useAuth();
  const [ids, setIds] = useState(readLocal);
  const syncing = useRef(false);
  const lastUser = useRef(null);

  // Persist guest wishlist locally
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  }, [ids]);

  // On login: merge local + server, then push
  useEffect(() => {
    if (!user || !token) {
      lastUser.current = null;
      return undefined;
    }
    if (lastUser.current === user.email) return undefined;
    lastUser.current = user.email;
    let cancelled = false;
    (async () => {
      try {
        syncing.current = true;
        const remote = await fetchWishlist(token);
        const merged = mergeIds(readLocal(), remote.ids || user.wishlist || []);
        if (cancelled) return;
        setIds(merged);
        await saveWishlist(token, merged);
      } catch (err) {
        console.warn("[wishlist sync]", err.message);
        if (!cancelled && Array.isArray(user.wishlist)) {
          setIds((prev) => mergeIds(prev, user.wishlist));
        }
      } finally {
        syncing.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, token]);

  // Push changes while logged in
  useEffect(() => {
    if (!user || !token || syncing.current) return undefined;
    const timer = setTimeout(() => {
      saveWishlist(token, ids).catch((err) => console.warn("[wishlist save]", err.message));
    }, 400);
    return () => clearTimeout(timer);
  }, [ids, user, token]);

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
