/** Formats integer euro cents as "€55.00" (negative amounts as "−€10.50"). */
export function formatEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}€${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
