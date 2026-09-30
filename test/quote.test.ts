import { describe, expect, it } from "vitest";
import { MAX_PER_SIZE, orderLimit } from "../src/data/catalog";
import { quote, QuoteError } from "../src/quote";
import { formatEur } from "../src/money";

const NOW = new Date("2026-09-14T12:00:00+03:00");
const mocha = { sample: "basic-mocha", size: "L", qty: 1 };
const crawler = { sample: "crawler", size: "M", qty: 1 };

describe("formatEur", () => {
  it("formats cents", () => {
    expect(formatEur(5500)).toBe("€55");
    expect(formatEur(250)).toBe("€2.50");
    expect(formatEur(320)).toBe("€3.20");
    expect(formatEur(-1050)).toBe("−€10.50");
    expect(formatEur(0)).toBe("€0");
  });
});

describe("quote", () => {
  it("prices the example cart: mocha L + crawler M, FREAKYYAH, Latvia", () => {
    const q = quote({ items: [mocha, crawler], country: "LV", code: "freakyyah" }, NOW);
    expect(q.subtotalCents).toBe(7000);
    expect(q.discount).toEqual({ code: "FREAKYYAH", description: "broke ass", kind: "percent", cents: 1050 });
    expect(q.shipping).toEqual({ zone: "latvia", delivery: "APPROX. 1–3 DAYS", cents: 320 });
    expect(q.totalCents).toBe(6270);
    expect(q.units).toBe(2);
  });

  it("charges base + extra per further item for each zone", () => {
    const two = [mocha, crawler];
    expect(quote({ items: [mocha], country: "LV" }, NOW).shipping?.cents).toBe(250);
    expect(quote({ items: two, country: "EE" }, NOW).shipping?.cents).toBe(600);
    expect(quote({ items: two, country: "LT" }, NOW).shipping?.cents).toBe(600);
    expect(quote({ items: two, country: "FI" }, NOW).shipping?.cents).toBe(1400);
    expect(quote({ items: two, country: "DE" }, NOW).shipping?.cents).toBe(3500);
    expect(quote({ items: [mocha], country: "GB" }, NOW).shipping?.cents).toBe(3000);
  });

  it("refuses FREAKYYAH under €70 of samples (shipping doesn't count)", () => {
    const q = quote({ items: [{ sample: "basic-mocha", size: "M", qty: 1 }], country: "DE", code: "FREAKYYAH" }, NOW);
    expect(q.discount).toBeNull();
    expect(q.codeMessage).toBe("SPEND €70 ON SAMPLES TO USE FREAKYYAH.");
    expect(q.totalCents).toBe(5500 + 3000);
  });

  it("applies percentage codes to samples only", () => {
    const q = quote({ items: [mocha], country: "LV", code: "SWAGG10" }, NOW);
    expect(q.discount?.cents).toBe(550);
    expect(q.totalCents).toBe(5500 - 550 + 250);
    expect(quote({ items: [mocha], country: "LV", code: "eque15" }, NOW).discount?.cents).toBe(825);
  });

  it("gives FREESWAGG free shipping in Latvia only", () => {
    const lv = quote({ items: [mocha, crawler], country: "LV", code: "FREESWAGG" }, NOW);
    expect(lv.discount).toEqual({ code: "FREESWAGG", description: "Free shipping", kind: "free_shipping", cents: 320 });
    expect(lv.totalCents).toBe(7000);
    const ee = quote({ items: [mocha], country: "EE", code: "FREESWAGG" }, NOW);
    expect(ee.discount).toBeNull();
    expect(ee.codeMessage).toBe("FREESWAGG ONLY WORKS FOR SHIPPING TO LATVIA.");
  });

  it("gives one clear message for any valid code on an empty or sold-out-only cart", () => {
    for (const code of ["FREAKYYAH", "SWAGG10", "FREESWAGG"]) {
      expect(quote({ items: [], country: "LV", code }, NOW).codeMessage).toBe("ADD A SAMPLE TO USE THIS CODE.");
      expect(quote({ items: [{ sample: "kiss-tee", size: "M", qty: 1 }], country: "LV", code }, NOW).codeMessage).toBe("ADD A SAMPLE TO USE THIS CODE.");
    }
    expect(quote({ items: [], code: "NOPE" }, NOW).codeMessage).toBe("THAT CODE ISN'T VALID.");
  });

  it("rejects unknown and deleted codes", () => {
    expect(quote({ items: [mocha], code: "SWAGG30" }, NOW).codeMessage).toBe("THAT CODE ISN'T VALID.");
    expect(quote({ items: [mocha], code: "nope" }, NOW).discount).toBeNull();
  });

  it("does not accept codes before their start date", () => {
    const early = new Date("2025-05-01T00:00:00+03:00");
    expect(quote({ items: [mocha], code: "SWAGG10" }, early).codeMessage).toBe("THAT CODE ISN'T VALID.");
  });

  it("marks sold-out sizes and leaves them out of the total", () => {
    const q = quote({ items: [{ sample: "kiss-tee", size: "S", qty: 1 }, mocha], country: "LV" }, NOW);
    expect(q.lines[0]).toMatchObject({ sample: "kiss-tee", state: "sold_out", qty: 0, lineCents: 0 });
    expect(q.subtotalCents).toBe(5500);
    expect(q.units).toBe(1);
  });

  it("lets pre-orders take several of a size, up to the per-size maximum", () => {
    const q = quote({ items: [{ sample: "basic-mocha", size: "L", qty: 3 }], country: "LV" }, NOW);
    expect(q.lines[0]).toMatchObject({ state: "ok", qty: 3, maxQty: MAX_PER_SIZE, preorder: true, lineCents: 16500 });
    const many = quote({ items: [{ sample: "basic-mocha", size: "L", qty: 99 }], country: "LV" }, NOW);
    expect(many.lines[0]).toMatchObject({ qty: MAX_PER_SIZE });
  });

  it("limits in-stock samples to their stock", () => {
    expect(orderLimit({ preorder: false }, { stock: 1 })).toBe(1);
    expect(orderLimit({ preorder: false }, { stock: 0 })).toBe(0);
    expect(orderLimit({ preorder: false }, { stock: 50 })).toBe(MAX_PER_SIZE);
    expect(orderLimit({ preorder: true }, { stock: 0 })).toBe(MAX_PER_SIZE);
    const kiss = quote({ items: [{ sample: "kiss-tee", size: "M", qty: 2 }], country: "LV" }, NOW);
    expect(kiss.lines[0]).toMatchObject({ state: "sold_out", preorder: false, maxQty: 0 });
  });

  it("merges duplicate lines and ignores junk", () => {
    const q = quote({ items: [mocha, { ...mocha }, { sample: 5 }, null, { sample: "crawler", size: "M", qty: 0 }], country: "LV" }, NOW);
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]).toMatchObject({ state: "ok", qty: 2 });
  });

  it("flags unknown samples and sizes", () => {
    const q = quote({ items: [{ sample: "ghost", size: "M", qty: 1 }, { sample: "crawler", size: "XL", qty: 1 }] }, NOW);
    expect(q.lines.map((l) => l.state)).toEqual(["unavailable", "unavailable"]);
    expect(q.subtotalCents).toBe(0);
  });

  it("uses the price from the catalogue, never from the request", () => {
    const q = quote({ items: [{ ...mocha, unitCents: 1, price: 1 }], country: "LV" }, NOW);
    expect(q.subtotalCents).toBe(5500);
  });

  it("does not ship outside the list and keeps checkout closed", () => {
    const q = quote({ items: [mocha], country: "US" }, NOW);
    expect(q.shipping).toBeNull();
    expect(q.canCheckout).toBe(false);
    expect(q.checkoutMessage).toBe("WE DON'T SHIP TO THAT COUNTRY YET.");
    expect(quote({ items: [mocha], country: "LV" }, NOW).checkoutMessage).toMatch(/CHECKOUT OPENS SOON/);
  });

  it("defaults to Latvia for a missing or malformed country", () => {
    expect(quote({ items: [mocha] }, NOW).country).toBe("LV");
    expect(quote({ items: [mocha], country: "latvia" }, NOW).country).toBe("LV");
  });

  it("rejects bodies that aren't carts", () => {
    expect(() => quote(null, NOW)).toThrow(QuoteError);
    expect(() => quote({ items: "x" }, NOW)).toThrow(QuoteError);
    expect(() => quote({ items: Array.from({ length: 50 }, () => mocha) }, NOW)).toThrow(QuoteError);
  });
});
