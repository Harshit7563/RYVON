/** Shared RYVON footwear size chart (UK / US / EU / CM) */
export const SIZE_CHART = [
  { uk: 6, us: 7, eu: 40, cm: "24.5" },
  { uk: 7, us: 8, eu: 41, cm: "25.4" },
  { uk: 8, us: 9, eu: 42, cm: "26.2" },
  { uk: 9, us: 10, eu: 43, cm: "27.1" },
  { uk: 10, us: 11, eu: 44, cm: "27.9" },
  { uk: 11, us: 12, eu: 45, cm: "28.8" },
  { uk: 12, us: 13, eu: 46, cm: "29.6" },
];

export const ALL_UK_SIZES = SIZE_CHART.map((r) => r.uk);

export function defaultStock(sizes = ALL_UK_SIZES, qty = 10) {
  const stock = {};
  sizes.forEach((s) => {
    stock[String(s)] = qty;
  });
  return stock;
}
