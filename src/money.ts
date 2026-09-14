/** Formats integer euro cents: whole euros as "€55", others as "€2.50" (negative amounts as "−€10.50"). */
export function formatEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(Math.round(cents));
  const rest = abs % 100;
  return `${sign}€${Math.floor(abs / 100)}${rest ? `.${String(rest).padStart(2, "0")}` : ""}`;
}
