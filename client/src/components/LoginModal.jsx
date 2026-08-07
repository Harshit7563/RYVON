import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import GoogleSignInButton from "./GoogleSignInButton";

const BENEFITS = ["Track orders live", "Early access drops", "Wishlist sync"];

export default function LoginModal() {
  const { loginOpen, closeLogin, register, loginWithEmail, loginWithGoogle } = useAuth();
  const { ids: wishIds } = useWishlist();
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loginOpen) return;
    const onKey = (e) => e.key === "Escape" && closeLogin();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [loginOpen, closeLogin]);

  useEffect(() => {
    if (!loginOpen) return;
    setError("");
    setPassword("");
    setDone(false);
    setBusy(false);
  }, [loginOpen, tab]);

  if (!loginOpen) return null;

  const finishOk = () => {
    setDone(true);
    setBusy(false);
    setTimeout(() => {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setDone(false);
    }, 280);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (tab === "register" && !name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (tab === "register") {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Enter a valid 10-digit phone number");
        return;
      }
    }
    setBusy(true);
    try {
      if (tab === "register") {
        await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          wishlist: wishIds,
        });
      } else {
        await loginWithEmail({ email: email.trim(), password, wishlist: wishIds });
      }
      finishOk();
    } catch (err) {
      setBusy(false);
      setError(err.message || "Something went wrong");
    }
  };

  const onGoogleSuccess = async (profile) => {
    setBusy(true);
    setError("");
    try {
      await loginWithGoogle({ ...profile, wishlist: wishIds });
      finishOk();
    } catch (err) {
      setBusy(false);
      setError(err.message || "Google login failed");
    }
  };
  const onGoogleError = (msg) => {
    setBusy(false);
    setError(msg || "Google login failed");
  };

  const field =
    "w-full rounded-xl border border-line bg-wash/50 py-3.5 pl-11 pr-3.5 text-[15px] outline-none transition focus:border-tss focus:bg-white sm:text-sm";

  const googleBtnClass =
    "mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white py-3.5 text-[15px] font-semibold transition active:scale-[0.99] hover:border-ink hover:bg-wash disabled:opacity-60 sm:text-sm";

  const googleIcon = (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.4 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l.1.1 6.2 5.2C39.2 37.3 44 32 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center sm:items-center sm:p-5">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
        aria-label="Close login"
        onClick={closeLogin}
      />

      <div className="login-sheet relative z-10 flex h-[100dvh] w-full max-w-[860px] flex-col overflow-hidden bg-white shadow-[0_30px_80px_rgba(0,0,0,.35)] sm:h-auto sm:max-h-[min(92vh,740px)] sm:flex-row sm:rounded-[22px]">
        {/* Desktop left panel */}
        <div className="relative hidden w-[42%] shrink-0 overflow-hidden bg-ink md:block">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-tss/40" />
          <div className="relative z-10 flex h-full flex-col justify-between p-7 text-white">
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight">RYVON</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                Ryvon Original
              </p>
            </div>
            <div>
              <h2 className="font-display text-[28px] font-extrabold uppercase leading-none">
                Step into<br />the drop.
              </h2>
              <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/75">
                Login for faster checkout, order tracking & exclusive collab access.
              </p>
              <ul className="mt-5 space-y-2">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-[13px] text-white/90">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-tss text-[10px] font-bold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile hero header */}
          <div className="relative shrink-0 overflow-hidden md:hidden">
            <div className="relative h-[168px] bg-ink">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-tss/50" />
              <button
                type="button"
                onClick={closeLogin}
                className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-20 grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                aria-label="Close"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
              <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-4 pt-10 text-white">
                <p className="font-display text-[26px] font-extrabold tracking-tight">RYVON</p>
                <p className="mt-0.5 text-[13px] text-white/90">
                  {tab === "login" ? "Welcome back, legend." : "Join the RYVON crew."}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {BENEFITS.map((b) => (
                    <span key={b} className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop close */}
          <button
            type="button"
            onClick={closeLogin}
            className="absolute right-3 top-3 z-20 hidden h-10 w-10 place-items-center rounded-full bg-wash text-ink transition hover:bg-line md:grid"
            aria-label="Close"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:py-7">
            <div className="mb-1 hidden md:block">
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-wide">
                {tab === "login" ? "Welcome back" : "Join RYVON"}
              </h3>
              <p className="mt-1 text-sm text-mute">
                {tab === "login"
                  ? "Login to continue shopping your kicks."
                  : "Register once — shop faster every time."}
              </p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-wash p-1.5">
              {[
                ["login", "Login"],
                ["register", "Register"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-lg py-3 text-[12px] font-bold uppercase tracking-[0.08em] transition sm:py-2.5 sm:text-xs ${
                    tab === id
                      ? "bg-white text-tss shadow-[0_2px_10px_rgba(0,0,0,.08)]"
                      : "text-mute"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {done ? (
              <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-off text-2xl text-white">✓</div>
                <p className="font-display mt-4 text-xl font-extrabold uppercase">
                  {tab === "login" ? "You're in" : "Account ready"}
                </p>
                <p className="mt-1 text-sm text-mute">Taking you back to shopping…</p>
              </div>
            ) : (
              <div className="pb-2">
                <GoogleSignInButton
                  onSuccess={onGoogleSuccess}
                  onError={onGoogleError}
                  onStart={() => {
                    setError("");
                    setBusy(true);
                  }}
                  disabled={busy}
                  className={googleBtnClass}
                >
                  {googleIcon}
                  Continue with Google
                </GoogleSignInButton>

                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-mute">Or use email</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <form onSubmit={submit} className="space-y-3.5">
                  {tab === "register" && (
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Full Name</span>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="3.2" /><path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
                          </svg>
                        </span>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Email</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" />
                        </svg>
                      </span>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={field} autoComplete="email" />
                    </div>
                  </label>

                  {tab === "register" && (
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">
                        Phone
                      </span>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M7 3h4l1 4-2 1a12 12 0 006 6l1-2 4 1v4a2 2 0 01-2 2A15 15 0 015 5a2 2 0 012-2z" />
                          </svg>
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          className={field}
                          inputMode="tel"
                          required
                        />
                      </div>
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Password</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
                        </svg>
                      </span>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 4 characters"
                        className={`${field} pr-14`}
                        autoComplete={tab === "login" ? "current-password" : "new-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide text-tss"
                      >
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>

                  {tab === "login" && (
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-mute">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#ec1c24]" />
                        Remember me
                      </label>
                      <button type="button" className="text-[13px] font-bold text-tss">
                        Forgot?
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-tss/20 bg-tss/5 px-3 py-2.5 text-[13px] font-semibold text-tss">
                      {error}
                    </div>
                  )}

                  {/* Sticky-feel CTA on mobile */}
                  <div className="sticky bottom-0 -mx-4 mt-2 border-t border-line bg-white/95 px-4 pb-1 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-1 sm:backdrop-blur-none">
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full rounded-xl bg-tss py-4 text-[13px] font-bold uppercase tracking-[0.12em] text-white transition active:scale-[0.99] hover:bg-tss-dark disabled:opacity-60 sm:py-3.5 sm:text-xs"
                    >
                      {busy ? "Please wait…" : tab === "login" ? "Login to RYVON" : "Create Account"}
                    </button>
                    <p className="mt-3 text-center text-[11px] leading-relaxed text-mute">
                      By continuing, you agree to our{" "}
                      <Link to="/terms" onClick={closeLogin} className="font-semibold text-ink underline underline-offset-2">Terms</Link>
                      {" "}&{" "}
                      <Link to="/privacy" onClick={closeLogin} className="font-semibold text-ink underline underline-offset-2">Privacy</Link>.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-sheet {
          animation: loginIn .32s cubic-bezier(.22,1,.36,1);
        }
        @keyframes loginIn {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes loginIn {
            from { transform: translateY(20px) scale(.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
