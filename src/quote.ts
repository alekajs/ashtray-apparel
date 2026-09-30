// Prices a cart on the server: the browser only sends sample, size and quantity.
import { MAX_PER_SIZE, getSample, orderLimit, type Sample } from "./data/catalog";
import { findDiscount } from "./data/discounts";
import { SITE } from "./data/settings";
import { COUNTRY_NAMES, HOME_COUNTRY, shippingCents, zoneFor } from "./data/shipping";
import { formatEur } from "./money";

export const MAX_LINES = 20;
export const MAX_QTY = MAX_PER_SIZE;

export type LineState = "ok" | "reduced" | "sold_out" | "unavailable";

export interface QuoteLine {
  sample: string;
  size: string;
  qty: number;
  maxQty: number;
  state: LineState;
  /** Made once enough orders come in (shown as PRE-ORDER in the cart). */
  preorder?: boolean;
  number?: string;
  name?: string;
  colour?: string;
  url?: string;
  image?: string;
  unitCents: number;
  lineCents: number;
}

export interface Quote {
  lines: QuoteLine[];
  units: number;
  subtotalCents: number;
  country: string;
  countryName: string;
  shipping: { zone: string; delivery: string; cents: number } | null;
  discount: { code: string; description: string; kind: "percent" | "free_shipping"; cents: number } | null;
  codeMessage: string | null;
  totalCents: number;
  canCheckout: boolean;
  checkoutMessage: string | null;
}

export class QuoteError extends Error {}

interface RawItem {
  sample: string;
  size: string;
  qty: number;
}

function parseItems(input: unknown): RawItem[] {
  if (!Array.isArray(input)) throw new QuoteError("items must be a list");
  if (input.length > MAX_LINES * 2) throw new QuoteError("too many items");
  const merged = new Map<string, RawItem>();
  for (const entry of input) {
    if (typeof entry !== "object" || entry === null) continue;
    const { sample, size, qty } = entry as Record<string, unknown>;
    if (typeof sample !== "string" || typeof size !== "string") continue;
    const count = typeof qty === "number" && Number.isFinite(qty) ? Math.floor(qty) : 1;
    if (count < 1) continue;
    const key = `${sample}\u0000${size}`;
    const existing = merged.get(key);
    merged.set(key, { sample, size, qty: Math.min(MAX_QTY, (existing?.qty ?? 0) + count) });
  }
  const items = [...merged.values()];
  if (items.length > MAX_LINES) throw new QuoteError("too many items");
  return items;
}

function priceLine(item: RawItem): QuoteLine {
  const sample: Sample | undefined = getSample(item.sample);
  const size = sample?.sizes.find((s) => s.code === item.size);
  if (!sample || !size) {
    return { sample: item.sample, size: item.size, qty: 0, maxQty: 0, state: "unavailable", unitCents: 0, lineCents: 0 };
  }
  const base = {
    sample: sample.slug,
    size: size.code,
    number: sample.number,
    name: sample.name,
    colour: sample.colour,
    url: `/sample/${sample.slug}`,
    image: `/img/samples/${sample.slug}/01-480.webp`,
    unitCents: sample.priceCents,
    preorder: sample.preorder,
    maxQty: orderLimit(sample, size),
  };
  if (base.maxQty <= 0) return { ...base, qty: 0, state: "sold_out", lineCents: 0 };
  const qty = Math.min(item.qty, base.maxQty);
  return { ...base, qty, state: qty < item.qty ? "reduced" : "ok", lineCents: qty * sample.priceCents };
}

export function quote(body: unknown, now: Date = new Date(), options: { discountCodes?: boolean } = {}): Quote {
  const codesOn = options.discountCodes ?? SITE.discountCodes;
  if (typeof body !== "object" || body === null) throw new QuoteError("body must be an object");
  const request = body as Record<string, unknown>;
  const lines = parseItems(request.items).map(priceLine);

  const rawCountry = typeof request.country === "string" ? request.country.trim().toUpperCase() : HOME_COUNTRY;
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : HOME_COUNTRY;
  const zone = zoneFor(country);

  const units = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const shippingBefore = zone ? shippingCents(zone, units) : 0;

  let discount: Quote["discount"] = null;
  let codeMessage: string | null = null;
  // With discount codes switched off (SITE.discountCodes), any code sent is ignored.
  const code = codesOn && typeof request.code === "string" ? request.code.trim().toUpperCase().slice(0, 40) : "";
  if (code) {
    const found = findDiscount(code);
    if (!found || new Date(found.startsAt) > now) {
      codeMessage = "THAT CODE ISN'T VALID.";
    } else if (found.usesLeft !== undefined && found.usesLeft <= 0) {
      codeMessage = "THAT CODE HAS BEEN USED UP.";
    } else if (units === 0) {
      codeMessage = "ADD A SAMPLE TO USE THIS CODE.";
    } else if (found.kind === "percent") {
      if (found.minSubtotalCents && subtotalCents < found.minSubtotalCents) {
        codeMessage = `SPEND ${formatEur(found.minSubtotalCents)} ON SAMPLES TO USE ${found.code}.`;
      } else {
        const cents = Math.round((subtotalCents * (found.percent ?? 0)) / 100);
        discount = { code: found.code, description: found.description, kind: found.kind, cents };
      }
    } else if (found.countries && !found.countries.includes(country)) {
      const places = found.countries.map((c) => COUNTRY_NAMES[c] ?? c).join(", ");
      codeMessage = `${found.code} ONLY WORKS FOR SHIPPING TO ${places}.`;
    } else if (shippingBefore > 0) {
      discount = { code: found.code, description: found.description, kind: found.kind, cents: shippingBefore };
    }
  }

  const totalCents = zone ? subtotalCents + shippingBefore - (discount?.cents ?? 0) : subtotalCents - (discount?.cents ?? 0);
  const canCheckout = SITE.checkoutOpen && Boolean(zone) && units > 0;
  return {
    lines,
    units,
    subtotalCents,
    country,
    countryName: COUNTRY_NAMES[country] ?? country,
    shipping: zone ? { zone: zone.id, delivery: zone.delivery, cents: shippingBefore } : null,
    discount,
    codeMessage,
    totalCents,
    canCheckout,
    checkoutMessage: !zone ? "WE DON'T SHIP TO THAT COUNTRY YET." : canCheckout ? null : SITE.checkoutClosedMessage,
  };
}
