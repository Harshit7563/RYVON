import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder } from "../api";

const LAST_ORDER_KEY = "ryvon-last-order";

/** Legacy /order/:code → /thank-you (no order id in URL). */
export default function OrderRedirect() {
  const { code } = useParams();
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const order = await getOrder(code);
        if (cancelled) return;
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ order, at: Date.now() }));
        nav("/thank-you", { replace: true, state: { order } });
      } catch {
        if (!cancelled) nav("/track", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, nav]);

  return <div className="py-24 text-center text-mute">Redirecting…</div>;
}
