// Omniva with tracking, copied from the Big Cartel shipping profile (archive TECHNICAL.md → Shipping).
// Price = base for the first item + extra for each further item.

export interface Zone {
  id: string;
  name: string;
  baseCents: number;
  extraCents: number;
  delivery: string;
  countries: string[];
}

export const HOME_COUNTRY = "LV";

export const ZONES: Zone[] = [
  { id: "latvia", name: "Latvia", baseCents: 250, extraCents: 70, delivery: "APPROX. 1–3 DAYS", countries: ["LV"] },
  { id: "baltics", name: "Estonia, Lithuania", baseCents: 520, extraCents: 80, delivery: "APPROX. 3–5 DAYS", countries: ["EE", "LT"] },
  { id: "finland", name: "Finland", baseCents: 1200, extraCents: 200, delivery: "APPROX. 7–14 DAYS", countries: ["FI"] },
  {
    id: "europe",
    name: "Rest of Europe",
    baseCents: 3000,
    extraCents: 500,
    delivery: "APPROX. 7–14 DAYS",
    countries: [
      "NO", "SE", "DK", "IS", "AX", "FO", "GG", "IM", "JE", "SJ",
      "GB", "IE", "FR", "DE", "NL", "BE", "LU", "AT", "CH", "LI", "MC",
      "ES", "PT", "IT", "GR", "MT", "SI", "HR", "BA", "RS", "ME", "MK", "AL", "XK", "AD", "SM", "VA", "GI",
      "PL", "CZ", "SK", "HU", "RO", "BG", "MD", "UA",
    ],
  },
];

export const COUNTRY_NAMES: Record<string, string> = {
  AD: "ANDORRA", AL: "ALBANIA", AT: "AUSTRIA", AX: "ÅLAND ISLANDS", BA: "BOSNIA AND HERZEGOVINA", BE: "BELGIUM",
  BG: "BULGARIA", CH: "SWITZERLAND", CZ: "CZECHIA", DE: "GERMANY", DK: "DENMARK", EE: "ESTONIA", ES: "SPAIN",
  FI: "FINLAND", FO: "FAROE ISLANDS", FR: "FRANCE", GB: "UNITED KINGDOM", GG: "GUERNSEY", GI: "GIBRALTAR",
  GR: "GREECE", HR: "CROATIA", HU: "HUNGARY", IE: "IRELAND", IM: "ISLE OF MAN", IS: "ICELAND", IT: "ITALY",
  JE: "JERSEY", LI: "LIECHTENSTEIN", LT: "LITHUANIA", LU: "LUXEMBOURG", LV: "LATVIA", MC: "MONACO", MD: "MOLDOVA",
  ME: "MONTENEGRO", MK: "NORTH MACEDONIA", MT: "MALTA", NL: "NETHERLANDS", NO: "NORWAY", PL: "POLAND",
  PT: "PORTUGAL", RO: "ROMANIA", RS: "SERBIA", SE: "SWEDEN", SI: "SLOVENIA", SJ: "SVALBARD AND JAN MAYEN",
  SK: "SLOVAKIA", SM: "SAN MARINO", UA: "UKRAINE", VA: "VATICAN CITY", XK: "KOSOVO",
};

export function zoneFor(country: string): Zone | undefined {
  return ZONES.find((zone) => zone.countries.includes(country));
}

export function shippingCents(zone: Zone, units: number): number {
  return units <= 0 ? 0 : zone.baseCents + zone.extraCents * (units - 1);
}

/** Countries for the cart's "ship to" list: home and nearby zones first, then the rest alphabetically. */
export function countryOptions(): { code: string; name: string }[] {
  const first = ["LV", "EE", "LT", "FI"];
  const rest = Object.keys(COUNTRY_NAMES)
    .filter((code) => !first.includes(code) && zoneFor(code))
    .sort((a, b) => (COUNTRY_NAMES[a] ?? a).localeCompare(COUNTRY_NAMES[b] ?? b));
  return [...first, ...rest].map((code) => ({ code, name: COUNTRY_NAMES[code] ?? code }));
}
