import { useState } from "react";
import { Link } from "react-router-dom";

const COLS = [
  {
    title: "Navigate",
    links: [
      ["About Us", "/about"],
      ["Contact Us", "/contact"],
      ["Stores Near Me", "/contact"],
      ["Track Order", "/track"],
      ["Wishlist", "/wishlist"],
      ["My Account", "/account"],
    ],
  },
  {
    title: "Need Help",
    links: [
      ["FAQ's", "/faqs"],
      ["Size Chart", "/size-chart"],
      ["Returns & Refunds", "/returns"],
      ["Shipping Policy", "/shipping"],
      ["Cancellation Policy", "/cancellation"],
      ["Privacy Policy", "/privacy"],
      ["Terms & Conditions", "/terms"],
    ],
  },
];

function AccordionCol({ title, links, open, onToggle }) {
  return (
    <div className="border-b border-[#ececec] lg:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:py-0"
        onClick={onToggle}
      >
        <h4 className="text-[13px] font-bold uppercase tracking-[0.04em] text-tss">{title}</h4>
        <span className="text-base text-[#999] lg:hidden">{open ? "−" : "+"}</span>
      </button>
      <ul className={`space-y-2.5 pb-4 lg:mt-3.5 lg:block lg:pb-0 ${open ? "block" : "hidden lg:block"}`}>
        {links.map(([label, to]) => (
          <li key={label}>
            <Link
              to={to}
              onClick={() => window.scrollTo(0, 0)}
              className="text-[13px] text-[#555] hover:text-tss"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [open, setOpen] = useState(null);

  return (
    <footer className="border-t border-[#e5e5e5] bg-white pb-mobile-nav">
      <div className="mx-auto max-w-[1280px] px-4 pt-8 pb-6 lg:px-6 lg:pt-12 lg:pb-8">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-4 lg:gap-10">
          {COLS.map((col, i) => (
            <AccordionCol
              key={col.title}
              title={col.title}
              links={col.links}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}

          <div className="border-b border-[#ececec] py-3.5 lg:border-0 lg:py-0">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.04em] text-tss">Follow Us</h4>
            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="transition opacity-90 hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#1877F2" aria-hidden>
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="transition opacity-90 hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                  <defs>
                    <radialGradient id="ryvon-ig" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497" />
                      <stop offset="45%" stopColor="#fd5949" />
                      <stop offset="60%" stopColor="#d6249f" />
                      <stop offset="90%" stopColor="#285AEB" />
                    </radialGradient>
                  </defs>
                  <path
                    fill="url(#ryvon-ig)"
                    d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 3.5A5.5 5.5 0 1 0 17.5 11 5.5 5.5 0 0 0 12 5.5zm0 2A3.5 3.5 0 1 1 8.5 11 3.5 3.5 0 0 1 12 7.5zM17.7 5.3a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2z"
                  />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="transition opacity-90 hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000" aria-hidden>
                  <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="py-3.5 lg:py-0">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.04em] text-tss">
              Experience The RYVON App
            </h4>
            <div className="mt-3 flex flex-col items-start gap-1">
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="block transition hover:opacity-85"
              >
                <img src="/badges/google-play.png" alt="Get it on Google Play" className="h-14 w-auto -ml-2" />
              </a>
              <a
                href="https://apps.apple.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="block transition hover:opacity-85"
              >
                <img src="/badges/app-store.svg" alt="Download on the App Store" className="h-10 w-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e5e5e5]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-1 px-4 py-4 text-center text-[12px] text-[#777] sm:flex-row sm:text-left lg:px-6">
          <p>© The RYVON Store {new Date().getFullYear()}-{String(new Date().getFullYear() + 1).slice(-2)}</p>
          <p className="font-bold uppercase tracking-[0.06em] text-tss">Ryvon Original</p>
        </div>
      </div>
    </footer>
  );
}
