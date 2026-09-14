// The sample library. Copy comes verbatim from the old shop's product descriptions (archive PRODUCTS.md);
// numbers follow the grid order. Stock: 1 per size that was buyable, 0 for KISS TEE (owner decision).
import images from "./images.json";

export type SizeCode = "S" | "M" | "L" | "XL";

export interface Size {
  code: SizeCode;
  stock: number;
}

export interface Figure {
  n: number;
  caption: string;
  width: number;
  height: number;
}

export interface Sample {
  slug: string;
  number: string;
  name: string;
  colour: string;
  priceCents: number;
  onSale: boolean;
  /** Date the sample was added to the library (shown in the spec sheet); leave out when unknown. */
  catalogued?: string;
  sizes: Size[];
  spec: [string, string][];
  important?: string;
  fit: string[];
  figures: Figure[];
  /** Garment photo with the background removed, used on the library grid. */
  cutout?: { width: number; height: number };
}

const DELIVERY = [
  "THIS IS NOT A PRE-ORDER",
  "WE SHIP FROM OUR BEDROOM IN RIGA. ORDERS DISPATCHED THE FOLLOWING DAY",
  "SHIPPING IS AVAILABLE ONLY WITHIN EUROPE",
];
export const DELIVERY_NOTES = DELIVERY;
export const FINAL_NOTE = "ALL SALES ARE FINAL!";

const TEE_FIT = ["CROPPED/BOXY FIT; SIZE UP FOR AN OVERSIZED FIT", "RALPH IS 6 FT (183 CM) AND WEARS A SIZE M HERE"];
const HOODIE_FIT = ["TRUE TO SIZE - BOXY RELAXED FIT", "RALPH IS 6 FT (183 CM) AND WEARS A SIZE M HERE", "ALICE IS 5′ 4″ (163 CM) AND WEARS A SIZE M HERE"];
const HOODIE_IMPORTANT = "HOODIES ARE NOT PREWASHED. TO GET THEIR TRUE FEEL AND FIT, PLEASE WASH THEM UPON ARRIVAL.";
const HOODIE_SPEC: [string, string][] = [
  ["FABRIC", "100% COTTON FRENCH TERRY"],
  ["WEIGHT", "HEAVYWEIGHT, 500 GSM"],
  ["FINISH", "STONE WASHED"],
  ["ZIPPER", "YKK"],
  ["EMBROIDERY", "RIGHT SLEEVE + BACK"],
  ["FIT", "BOXY RELAXED, TRUE TO SIZE"],
];
const teeSpec = (gsm: number): [string, string][] => [
  ["FABRIC", "100% COTTON"],
  ["WEIGHT", `HEAVYWEIGHT, ${gsm} GSM`],
  ["PRINT", "SCREENPRINT"],
  ["FIT", "CROPPED / BOXY"],
];

type Manifest = {
  samples: Record<string, { n: number; w: number; h: number }[]>;
  cutouts?: Record<string, { w: number; h: number }>;
};
const manifest = images as Manifest;

function cutout(slug: string): Sample["cutout"] {
  const entry = manifest.cutouts?.[slug];
  return entry ? { width: entry.w, height: entry.h } : undefined;
}

function figures(slug: string, captions: string[]): Figure[] {
  const entries = manifest.samples[slug] ?? [];
  return captions.map((caption, i) => {
    const entry = entries[i];
    if (!entry) throw new Error(`missing image ${i + 1} for ${slug}`);
    return { n: entry.n, caption, width: entry.w, height: entry.h };
  });
}

const sizes = (codes: SizeCode[], stock: number): Size[] => codes.map((code) => ({ code, stock }));

/** A newly added sample with no description yet: placeholder price and sizes, one cut-out photo. */
const draft = (slug: string, number: string, name: string, colour = ""): Sample => ({
  slug, number, name, colour, priceCents: 5000, onSale: false,
  sizes: sizes(["S", "M", "L"], 1), spec: [], fit: [],
  figures: figures(slug, ["FLAT"]),
  cutout: cutout(slug),
});

// Listed in the order the owner set for the library grid (2026-09-14); numbers follow this order.
// draft(): added 2026-09-14 with placeholder price, sizes and names until the owner writes the descriptions.
export const SAMPLES: Sample[] = [
  {
    slug: "basic-mocha", number: "01", name: "BASIC ZIP UP", colour: "MOCHA", priceCents: 5500, onSale: false,
    catalogued: "2024-11-18", sizes: sizes(["M", "L", "XL"], 1), spec: HOODIE_SPEC, important: HOODIE_IMPORTANT, fit: HOODIE_FIT,
    figures: figures("basic-mocha", ["FRONT", "BACK", "SLEEVE", "WORN, RALPH", "WORN, ALICE"]),
    cutout: cutout("basic-mocha"),
  },
  {
    slug: "basic-olive", number: "02", name: "BASIC ZIP UP", colour: "OLIVE", priceCents: 5500, onSale: false,
    catalogued: "2024-11-18", sizes: sizes(["M", "L", "XL"], 1), spec: HOODIE_SPEC, important: HOODIE_IMPORTANT, fit: HOODIE_FIT,
    figures: figures("basic-olive", ["FRONT", "BACK", "SLEEVE", "WORN, ALICE", "WORN, RALPH"]),
    cutout: cutout("basic-olive"),
  },
  draft("molly-navy", "03", "MOLLY", "NAVY"),
  draft("molly-brown", "04", "MOLLY", "BROWN"),
  draft("baggy-jeans", "05", "BAGGY JEANS"),
  draft("cyber-waffle-blue", "06", "CYBER WAFFLE", "BLUE"),
  draft("cyber-tee-black", "07", "CYBER TEE", "BLACK"),
  draft("cyber-tee-red", "08", "CYBER TEE", "RED"),
  draft("chromatics-hoodie", "09", "CHROMATICS HOODIE"),
  {
    slug: "abstract-tee", number: "10", name: "ABSTRACT TEE", colour: "NAVY SMOKE", priceCents: 1500, onSale: true,
    catalogued: "2024-09-07", sizes: sizes(["S", "M", "L"], 1), spec: teeSpec(280), fit: TEE_FIT,
    figures: figures("abstract-tee", ["FRONT", "WORN, RALPH"]),
    cutout: cutout("abstract-tee"),
  },
  {
    slug: "crawler", number: "11", name: "CRAWLER TEE", colour: "SAND", priceCents: 1500, onSale: true,
    catalogued: "2024-09-07", sizes: sizes(["S", "M", "L"], 1), spec: teeSpec(280), fit: TEE_FIT,
    figures: figures("crawler", ["FRONT", "WORN, RALPH"]),
    cutout: cutout("crawler"),
  },
  {
    slug: "kiss-tee", number: "12", name: "KISS TEE", colour: "WHITE PEARL", priceCents: 2200, onSale: false,
    catalogued: "2024-10-06", sizes: sizes(["S", "M", "L"], 0), spec: teeSpec(220), fit: TEE_FIT,
    figures: figures("kiss-tee", ["FRONT", "WORN, RALPH"]),
    cutout: cutout("kiss-tee"),
  },
];

/** "CYBER TEE RED", or just the name when there's no colour. */
export function fullName(sample: Sample): string {
  return sample.colour ? `${sample.name} ${sample.colour}` : sample.name;
}

export function getSample(slug: string): Sample | undefined {
  return SAMPLES.find((sample) => sample.slug === slug);
}

export function isSoldOut(sample: Sample): boolean {
  return sample.sizes.every((size) => size.stock <= 0);
}

export const IMAGE_WIDTHS = [480, 960, 1600] as const;

export function imageUrl(sample: Sample, n: number, width: (typeof IMAGE_WIDTHS)[number]): string {
  return `/img/samples/${sample.slug}/${String(n).padStart(2, "0")}-${width}.webp`;
}

export function imageSrcset(sample: Sample, n: number): string {
  return IMAGE_WIDTHS.map((width) => `${imageUrl(sample, n, width)} ${width}w`).join(", ");
}

export const CUTOUT_WIDTHS = [480, 960] as const;

export function cutoutUrl(sample: Sample, width: (typeof CUTOUT_WIDTHS)[number]): string {
  return `/img/samples/${sample.slug}/cutout-${width}.webp`;
}

export function shareImageUrl(sample: Sample): string {
  return `/img/samples/${sample.slug}/share.jpg`;
}

/** "18.11.2024" */
export function formatCatalogued(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}
