import { Link } from "react-router-dom";
import { SIZE_CHART } from "../data/sizeChart";

export default function SizeChart() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 lg:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tss">Fit guide</p>
      <h1 className="font-display mt-2 text-2xl font-extrabold uppercase sm:text-3xl">Size Chart</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#555]">
        Find your perfect RYVON fit. Measure your foot from heel to longest toe in centimetres, then match
        the CM column. If you are between sizes, we usually recommend going up.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-tss text-[11px] uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">UK</th>
              <th className="px-4 py-3">US</th>
              <th className="px-4 py-3">EU</th>
              <th className="px-4 py-3">CM</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map((r) => (
              <tr key={r.uk} className="border-t border-line odd:bg-white even:bg-wash/60">
                <td className="px-4 py-3 font-bold">{r.uk}</td>
                <td className="px-4 py-3">{r.us}</td>
                <td className="px-4 py-3">{r.eu}</td>
                <td className="px-4 py-3">{r.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-4 text-[14px] leading-relaxed text-[#555]">
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase text-ink">How to measure</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>Place your foot on paper while standing straight.</li>
            <li>Mark heel and longest toe, then measure the distance in CM.</li>
            <li>Compare with the chart above and pick the closest UK size.</li>
            <li>Between two sizes? Choose the larger UK for sneakers with a snug toe box.</li>
          </ol>
        </div>
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase text-ink">Fit tips</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Most RYVON lifestyles fit true to size.</li>
            <li>High-tops can feel snug on day one and ease after a few wears.</li>
            <li>Wrong size? Easy exchange within 7 days on unused pairs — see Returns.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/shop" className="bg-tss px-5 py-3 text-xs font-bold uppercase text-white">
          Shop shoes
        </Link>
        <Link to="/returns" className="border border-line px-5 py-3 text-xs font-bold uppercase">
          Returns policy
        </Link>
      </div>
    </div>
  );
}
