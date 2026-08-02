import { useState } from "react";
import { Link } from "react-router-dom";
import { sendContact } from "../api";

const TOPICS = [
  "Order status / tracking",
  "Size exchange or return",
  "Wrong / damaged product",
  "Payment & refunds",
  "Product / sizing help",
  "Wholesale / collab",
  "Other",
];

const CHANNELS = [
  {
    label: "Email",
    value: "ryvonsupport@gmail.com",
    href: "mailto:ryvonsupport@gmail.com",
    hint: "We reply within 24 hours",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    ),
  },
  {
    label: "Phone / WhatsApp",
    value: "+91 98765 43210",
    href: "https://wa.me/919876543210",
    hint: "Mon–Sat · 10am–7pm IST",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M7 3h4l1 4-2 1a12 12 0 006 6l1-2 4 1v4a2 2 0 01-2 2A15 15 0 015 5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    label: "Track order",
    value: "Use your Order ID",
    href: "/track",
    hint: "Live status in seconds",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 7h11v10H4zM15 10h4l2 3v4h-6" />
        <circle cx="7.5" cy="18.5" r="1.5" />
        <circle cx="17.5" cy="18.5" r="1.5" />
      </svg>
    ),
  },
];

const QUICK = [
  ["Shipping timelines", "/shipping"],
  ["Returns & exchanges", "/returns"],
  ["Cancellation", "/cancellation"],
  ["FAQs", "/faqs"],
];

const field =
  "w-full border border-line bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-tss sm:text-sm";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: TOPICS[0],
    message: "",
  });
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await sendContact({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `[${form.topic}]\n\n${form.message}`,
      });
      setOk(true);
      setForm({ name: "", email: "", phone: "", topic: TOPICS[0], message: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <img
          src="/products/p7.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          onError={(e) => {
            e.currentTarget.src = "/products/p1.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Support</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold uppercase leading-none sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/80 sm:text-[15px]">
            Orders, sizing, returns — we&apos;re here. Most queries get a reply within 24 hours on business days.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12 lg:px-6">
        {/* Channels */}
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {CHANNELS.map((c) => {
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-wash text-ink">{c.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-mute">{c.label}</span>
                  <span className="mt-0.5 block truncate text-[14px] font-bold text-ink sm:text-[15px]">{c.value}</span>
                  <span className="mt-0.5 block text-[12px] text-mute">{c.hint}</span>
                </span>
              </>
            );
            const cls =
              "flex items-start gap-3 border border-line bg-white p-4 transition hover:border-ink";
            return c.href.startsWith("/") ? (
              <Link key={c.label} to={c.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls}>
                {inner}
              </a>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Form */}
          <div>
            <h2 className="font-display text-lg font-extrabold uppercase sm:text-xl">Send a message</h2>
            <p className="mt-1 text-[13px] text-mute">Include your Order ID for faster help on deliveries & returns.</p>

            {ok ? (
              <div className="mt-6 border border-off/25 bg-[#e8f5ec] px-5 py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-off text-2xl text-white">✓</div>
                <p className="font-display mt-4 text-xl font-extrabold uppercase">Message sent</p>
                <p className="mt-2 text-sm text-mute">Thanks — our team will get back to you soon.</p>
                <button
                  type="button"
                  onClick={() => setOk(false)}
                  className="mt-6 text-xs font-bold uppercase tracking-wide text-tss underline underline-offset-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4 border border-line bg-wash/40 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Full name *</span>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Your name"
                      className={field}
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Email *</span>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@email.com"
                      className={field}
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Phone</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className={field}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Topic *</span>
                    <select
                      value={form.topic}
                      onChange={(e) => set("topic", e.target.value)}
                      className={`${field} appearance-none`}
                    >
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-mute">Message *</span>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Tell us what you need help with. Order ID example: RYV-1001"
                    className={`${field} resize-y`}
                  />
                </label>

                {error && (
                  <div className="border border-tss/20 bg-tss/5 px-3 py-2.5 text-[13px] font-semibold text-tss">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-tss py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-tss-dark disabled:opacity-60 sm:w-auto sm:px-10"
                >
                  {busy ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-6">
            <div className="border border-line bg-white p-5 sm:p-6">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">Before you write</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mute">
                Many answers are already in our policies. Checking these first often saves you a wait.
              </p>
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {QUICK.map(([label, to]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="flex items-center justify-between py-3 text-[13px] font-semibold text-ink hover:text-tss"
                    >
                      {label}
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-tss px-5 py-6 text-white sm:px-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">Faster help</p>
              <h3 className="font-display mt-1 text-xl font-extrabold uppercase">WhatsApp us</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/85">
                Share your Order ID and a short note — our support desk replies on business hours.
              </p>
              <a
                href="https://wa.me/919876543210?text=Hi%20RYVON%2C%20I%20need%20help%20with%20Order%20ID%3A%20"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-ink hover:bg-wash"
              >
                Chat on WhatsApp
              </a>
            </div>

            <div className="border border-line bg-wash px-5 py-5 sm:px-6">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">Store & studio</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#555]">
                RYVON ships pan-India from our fulfilment hub. For studio visits or wholesale enquiries,
                email <a href="mailto:ryvonsupport@gmail.com" className="font-semibold text-tss">ryvonsupport@gmail.com</a> with
                subject “Visit” or “Wholesale”.
              </p>
              <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-mute">
                Hours · Mon–Sat · 10:00–19:00 IST
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
