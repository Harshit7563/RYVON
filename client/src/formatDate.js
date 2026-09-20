/** Consistent India date + time for orders (admin + customer). */
export function formatOrderDateTime(value, { withSeconds = false } = {}) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const opts = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  if (withSeconds) opts.second = "2-digit";
  return d.toLocaleString("en-IN", opts);
}
