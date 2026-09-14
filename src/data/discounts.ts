// The four discount codes carried over from Big Cartel (archive TECHNICAL.md → Discount codes).
// Percentage codes discount samples only, never shipping. Usage limits are enforced at checkout (next step);
// usesLeft records EQUE15's remaining use.

export interface Discount {
  code: string;
  /** Shown to customers when the code is applied (as written in Big Cartel). */
  description: string;
  kind: "percent" | "free_shipping";
  percent?: number;
  minSubtotalCents?: number;
  /** For free shipping: destinations it applies to. */
  countries?: string[];
  startsAt: string;
  usesLeft?: number;
}

export const DISCOUNTS: Discount[] = [
  { code: "FREAKYYAH", description: "broke ass", kind: "percent", percent: 15, minSubtotalCents: 7000, startsAt: "2025-04-27T19:33:00+03:00" },
  { code: "SWAGG10", description: "plds", kind: "percent", percent: 10, startsAt: "2025-05-06T12:06:00+03:00" },
  { code: "EQUE15", description: "plds", kind: "percent", percent: 15, startsAt: "2025-05-04T18:16:00+03:00", usesLeft: 1 },
  { code: "FREESWAGG", description: "Free shipping", kind: "free_shipping", countries: ["LV"], startsAt: "2025-05-06T00:16:00+03:00" },
];

export function findDiscount(code: string): Discount | undefined {
  const normalized = code.trim().toUpperCase();
  return DISCOUNTS.find((discount) => discount.code === normalized);
}
