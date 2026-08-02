import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 lg:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tss">Ryvon Original</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold uppercase sm:text-4xl">About RYVON</h1>

      <p className="mt-5 text-[15px] leading-relaxed text-[#555]">
        RYVON is a footwear brand built for how India actually moves — crowded metros, monsoon roads,
        college corridors, court sessions, and late-night walks. We design sneakers and everyday shoes
        that look sharp, feel light underfoot, and hold up to real wear without gatekeeping style behind
        impossible price tags.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["50K+", "Happy feet"],
          ["Pan-India", "Delivery"],
          ["7 Day", "Easy returns"],
        ].map(([n, l]) => (
          <div key={l} className="border border-line p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-tss">{n}</p>
            <p className="mt-1 text-xs font-bold uppercase text-mute">{l}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-10 text-sm font-extrabold uppercase tracking-wide">What we stand for</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#555]">
        <li>
          <strong className="text-ink">Fit-first design</strong> — silhouettes tested for Indian foot shapes,
          with clear size guides in UK and CM on every product page.
        </li>
        <li>
          <strong className="text-ink">Honest materials</strong> — leather, suede, mesh, and cushioning chosen
          for daily comfort, not just photoshoot gloss.
        </li>
        <li>
          <strong className="text-ink">Fair pricing</strong> — premium look without luxury markups; prepaid
          extras and free shipping thresholds that actually help.
        </li>
        <li>
          <strong className="text-ink">Customer-first service</strong> — transparent shipping, 7-day returns on
          eligible pairs, and support that replies with Order ID context.
        </li>
      </ul>

      <h2 className="font-display mt-10 text-sm font-extrabold uppercase tracking-wide">Our collections</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[#555]">
        From Air Force classics and Low Dunks to Jordan energy, Travis-inspired drops, Retro runners, and
        Samba street staples — every drop is curated so you can build a rotation that works for office,
        outing, and overtime hustle.
      </p>

      <h2 className="font-display mt-10 text-sm font-extrabold uppercase tracking-wide">Quality promise</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[#555]">
        Every pair sold through official RYVON channels is authentic. If something arrives wrong, damaged,
        or with a manufacturing defect, our Returns policy has a clear path to replacement or refund. Read
        our{" "}
        <Link to="/shipping" className="font-semibold text-tss underline">
          Shipping
        </Link>
        ,{" "}
        <Link to="/returns" className="font-semibold text-tss underline">
          Returns
        </Link>
        , and{" "}
        <Link to="/faqs" className="font-semibold text-tss underline">
          FAQs
        </Link>{" "}
        for full details.
      </p>

      <Link to="/shop" className="mt-10 inline-flex bg-tss px-6 py-3 text-xs font-bold uppercase text-white">
        Shop the Collection
      </Link>
    </div>
  );
}
