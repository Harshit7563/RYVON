import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { adminLogin } from "../../api";

export default function AdminLogin() {
  const nav = useNavigate();
  const existing = localStorage.getItem("ryvon-admin-token");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (existing) return <Navigate to="/admin" replace />;

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await adminLogin(username, password, pin.trim());
      localStorage.setItem("ryvon-admin-token", data.token);
      localStorage.setItem("ryvon-admin", JSON.stringify(data.admin));
      nav("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-tss px-6 py-5 text-white">
          <p className="font-display text-2xl font-extrabold">RYVON Admin</p>
          <p className="mt-1 text-sm text-white/80">Sign in with admin credentials</p>
        </div>

        <form onSubmit={submitLogin} className="space-y-3 p-6">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase text-mute">PIN</span>
            <input
              type="password"
              inputMode="numeric"
              required
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="••••"
              autoComplete="one-time-code"
              className="w-full border border-line px-3 py-3 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-tss"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase text-mute">User</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
              autoComplete="username"
              className="w-full border border-line px-3 py-3 text-sm outline-none focus:border-tss"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase text-mute">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full border border-line px-3 py-3 text-sm outline-none focus:border-tss"
            />
          </label>
          {error && <p className="text-xs font-semibold text-tss">{error}</p>}
          <button type="submit" disabled={busy} className="w-full bg-tss py-3.5 text-xs font-bold uppercase text-white disabled:opacity-60">
            {busy ? "Signing in…" : "Login to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
