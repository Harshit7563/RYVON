import { createContext, useContext, useEffect, useState } from "react";
import { authGoogle, authLogin, authRegister } from "../api";

const AuthCtx = createContext(null);
const USER_KEY = "ryvon-user";
const TOKEN_KEY = "ryvon-user-token";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  const applyUser = (u) => {
    if (u?.token) setToken(u.token);
    setUser({
      id: u.id,
      name: u.name?.trim() || u.email.split("@")[0],
      email: u.email.trim().toLowerCase(),
      phone: u.phone ? String(u.phone).trim() : "",
      country: u.country ? String(u.country).trim() : "",
      picture: u.picture || null,
      provider: u.provider || "email",
      wishlist: Array.isArray(u.wishlist) ? u.wishlist : [],
    });
    setLoginOpen(false);
  };

  /** Local-only fallback if API is down (keeps UX working). */
  const loginLocal = ({ name, email, picture, provider, phone }) => {
    applyUser({
      name: name?.trim() || email.split("@")[0],
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : "",
      picture: picture || null,
      provider: provider || "email",
      wishlist: [],
    });
  };

  const register = async ({ name, email, phone, country, password, wishlist }) => {
    const u = await authRegister({ name, email, phone, country, password, wishlist });
    applyUser(u);
    return u;
  };

  const loginWithEmail = async ({ email, password, wishlist }) => {
    const u = await authLogin({ email, password, wishlist });
    applyUser(u);
    return u;
  };

  const loginWithGoogle = async (profile) => {
    const u = await authGoogle(profile);
    applyUser(u);
    return u;
  };

  const logout = () => {
    setUser(null);
    setToken("");
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        token,
        login: loginLocal,
        register,
        loginWithEmail,
        loginWithGoogle,
        logout,
        loginOpen,
        openLogin,
        closeLogin,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth needs provider");
  return v;
}
