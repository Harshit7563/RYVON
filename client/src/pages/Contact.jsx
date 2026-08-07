import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSite, sendContact } from "../api";

const TOPICS = [
  "Order status / tracking",
  "Size exchange or return",
  "Wrong / damaged product",
  "Payment & refunds",
  "Product / sizing help",
  "Wholesale / collab",
  "Other",
];

const QUICK = [
  ["Shipping timelines", "/shipping"],
  ["Returns & exchanges", "/returns"],
  ["Cancellation", "/cancellation"],
  ["FAQs", "/faqs"],
];

const field =
  "w-full border border-line bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-tss sm:text-sm";

function formatPhoneDisplay(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export default function Contact() {
  const [site, setSite] = useState(null);
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

  useEffect(() => {
    getSite().then(setSite).catch(() => setSite({ contactEmail: "ryvonsupport@gmail.com" }));
  }, []);

  const channels = useMemo(() => {
    const email = site?.contactEmail || "ryvonsupport@gmail.com";
    const list = [
      {
        label: "Email",
        value: email,
        href: `mailto:${email}`,
        hint: "We reply within 24 hours",
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 7 9-7" />
          </svg>
        ),
      },
    ];
    const wa = String(site?.contactWhatsapp || "").replace(/\D/g, "");
    const phone = site?.contactPhone || "";
    if (phone || wa.length >= 10) {
      const waDigits = wa.length >= 10 ? wa : String(phone).replace(/\D/g, "");
      const intl = waDigits.length === 10 ? `91${waDigits}` : waDigits;
      list.push({
        label: "Phone / WhatsApp",
        value: formatPhoneDisplay(phone || waDigits),
        href: `https://wa.me/${intl}`,
        hint: "Mon–Sat · 10am–7pm IST",
        icon: (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M7 3h4l1 4-2 1a12 12 0 006 6l1-2 4 1v4a2 2 0 01-2 2A15 15 0 015 5a2 2 0 012-2z" />
          </svg>
        ),
      });
    }
    list.push({
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
    });
    return list;
  }, [site]);

  const waLink = useMemo(() => {
    const wa = String(site?.contactWhatsapp || "").replace(/\D/g, "");
    const phone = String(site?.contactPhone || "").replace(/\D/g, "");
    const digits = wa.length >= 10 ? wa : phone;
    if (digits.length < 10) return null;
    const intl = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${intl}?text=${encodeURIComponent("Hi RYVON, I need help with Order ID: ")}`;
  }, [site]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await sendContact(form);
      setOk(true);
      setForm({ name: "", email: "", phone: "", topic: TOPICS[0], message: "" });
    } catch (err) {
      setError(err.message || "Could not send message");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-wash/40">
      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:py-14 lg:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tss">Support</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold uppercase sm:text-4xl">Contact Us</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#555]">
          Order help, size swaps, or wholesale — drop a note and we’ll get back with clear next steps.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {channels.map((c) => {
            const inner = (
              <>
                <span className="text-tss">{c.icon}</span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-mute">{c.label}</p>
                <p className="mt-1 text-sm font-bold text-ink break-all">{c.value}</p>
                <p className="mt-1 text-[12px] text-mute">{c.hint}</p>
              </>
            );
            if (c.href.startsWith("/")) {
              return (
                <Link key={c.label} to={c.href} className="border border-line bg-white p-4 hover:border-tss">
                  {inner}
                </Link>
              );
            }
            return (
              <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="border border-line bg-white p-4 hover:border-tss">
                {inner}
              </a>
            );
          })}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-line bg-white p-5 sm:p-6">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide">Send a message</h2>
            {ok ? (
              <p className="mt-4 text-sm font-semibold text-off">
                Thanks — message received. We’ll reply to your email soon.
              </p>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={field} />
                <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" className={field} />
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={field} />
                <select value={form.topic} onChange={(e) => set("topic", e.target.value)} className={field}>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Tell us what you need help with. Order ID example: RYV-1001"
                  className={field}
                />
                {error && <p className="text-xs font-semibold text-tss">{error}</p>}
                <button type="submit" disabled={busy} className="bg-tss px-6 py-3 text-xs font-bold uppercase text-white disabled:opacity-60">
                  {busy ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-6">
            <div className="border border-line bg-white p-5 sm:p-6">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">Before you write</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mute">
                Many answers are already in our policies. Checking these first often saves you a wait.
              </p>
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {QUICK.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="flex items-center justify-between py-3 text-[13px] font-semibold text-ink hover:text-tss">
                      {label}
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {waLink ? (
              <div className="bg-tss px-5 py-6 text-white sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">Faster help</p>
                <h3 className="font-display mt-1 text-xl font-extrabold uppercase">WhatsApp us</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/85">
                  Share your Order ID and a short note — our support desk replies on business hours.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-ink hover:bg-wash"
                >
                  Chat on WhatsApp
                </a>
              </div>
            ) : (
              <div className="border border-line bg-wash px-5 py-6 sm:px-6">
                <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">Email support</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#555]">
                  WhatsApp number will appear here once configured. Until then, email{" "}
                  <a href={`mailto:${site?.contactEmail || "ryvonsupport@gmail.com"}`} className="font-semibold text-tss">
                    {site?.contactEmail || "ryvonsupport@gmail.com"}
                  </a>
                  .
                </p>
              </div>
            )}

            <div className="border border-line bg-wash px-5 py-5 sm:px-6">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">Fulfilment</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#555]">
                RYVON ships pan-India from our fulfilment hub. For wholesale enquiries, email{" "}
                <a href={`mailto:${site?.contactEmail || "ryvonsupport@gmail.com"}`} className="font-semibold text-tss">
                  {site?.contactEmail || "ryvonsupport@gmail.com"}
                </a>{" "}
                with subject “Wholesale”.
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
