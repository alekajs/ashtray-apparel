// Minimal HTML templating: every interpolated value is escaped unless it is already an Html instance.

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export class Html {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export type Part = Html | string | number | null | undefined | false | Part[];

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

/** Marks trusted, already-safe markup (only for strings authored in this codebase). */
export function raw(markup: string): Html {
  return new Html(markup);
}

function render(part: Part): string {
  if (part === null || part === undefined || part === false) return "";
  if (part instanceof Html) return part.value;
  if (Array.isArray(part)) return part.map(render).join("");
  return escapeHtml(String(part));
}

export function html(strings: TemplateStringsArray, ...values: Part[]): Html {
  let out = strings[0] ?? "";
  values.forEach((value, i) => {
    out += render(value) + (strings[i + 1] ?? "");
  });
  return new Html(out);
}
