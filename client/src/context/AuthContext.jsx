import { createContext, useContext, useEffect, useState } from "react";
import { authGoogle, authLogin, authRegister } from "../api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ryvon-user") || "null");
    } catch {
      return null;
    }
  });
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem("ryvon-user", JSON.stringify(user));
    else localStorage.removeItem("ryvon-user");
  }, [user]);

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  const applyUser = (u) => {
    setUser({
      id: u.id,
      name: u.name?.trim() || u.email.split("@")[0],
      email: u.email.trim().toLowerCase(),
      phone: u.phone ? String(u.phone).trim() : "",
      picture: u.picture || null,
      provider: u.provider || "email",
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
    });
  };

  const register = async ({ name, email, phone, password }) => {
    const u = await authRegister({ name, email, phone, password });
    applyUser(u);
    return u;
  };

  const loginWithEmail = async ({ email, password }) => {
    const u = await authLogin({ email, password });
    applyUser(u);
    return u;
  };

  const loginWithGoogle = async (profile) => {
    const u = await authGoogle(profile);
    applyUser(u);
    return u;
  };

  const logout = () => setUser(null);

  return (
    <AuthCtx.Provider
      value={{
        user,
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
