import { CUTOUT_WIDTHS, cutoutUrl, imageSrcset, imageUrl, isSoldOut, type Sample } from "./data/catalog";
import { SITE } from "./data/settings";
import { html, type Html } from "./html";
import { formatEur } from "./money";

export function cursor(): Html {
  return html`<span class="cursor" aria-hidden="true"></span>`;
}

export function priceTag(sample: Sample): Html {
  if (isSoldOut(sample)) return html`<span class="price price--sold">SOLD OUT</span>`;
  return html`<span class="price${sample.onSale ? " price--sale" : ""}">${formatEur(sample.priceCents)}</span>`;
}

export function sampleTile(sample: Sample, index: number): Html {
  const first = sample.figures[0];
  const eager = index < 2;
  const loading = eager ? html`fetchpriority="${index === 0 ? "high" : "auto"}"` : html`loading="lazy"`;
  const sizes = "(min-width: 1200px) 18vw, (min-width: 768px) 30vw, 46vw";
  const num = html`<span class="tile__num" aria-hidden="true">[${sample.number}]</span>`;
  const picture = sample.cutout
    ? html`<span class="tile__img tile__img--cutout"><img src="${cutoutUrl(sample, 480)}"
        srcset="${CUTOUT_WIDTHS.map((width) => `${cutoutUrl(sample, width)} ${width}w`).join(", ")}" sizes="${sizes}"
        width="${sample.cutout.width}" height="${sample.cutout.height}" alt="" ${loading} decoding="async">${num}</span>`
    : html`<span class="tile__img"><img src="${imageUrl(sample, 1, 480)}" srcset="${imageSrcset(sample, 1)}" sizes="${sizes}"
        width="${first?.width ?? 2000}" height="${first?.height ?? 2444}" alt="" ${loading} decoding="async">${num}</span>`;
  return html`<li>
    <a class="tile${isSoldOut(sample) ? " tile--sold" : ""}" href="/sample/${sample.slug}">
      ${picture}
      <span class="tile__cap"><span class="tile__name">${sample.name}${sample.colour ? html`<span class="visually-hidden">, ${sample.colour.toLowerCase()}</span>` : ""}</span>${priceTag(sample)}</span>
    </a>
  </li>`;
}

export function studioBox(): Html {
  return html`<aside class="studio" aria-label="Ashtray Studio">
    <p class="label label--accent">MADE AT ASHTRAY STUDIO</p>
    <p class="studio__text">like this piece? we build your own garment from scratch: fit, fabric, weight, labels. from 10 units per style.</p>
    <div class="studio__actions">
      <a class="btn btn--ghost" href="${SITE.studio.url}" rel="noopener">[ BUILD YOUR OWN ]</a>
      <a class="link" href="${SITE.studio.url}" rel="noopener">${SITE.studio.label} →</a>
    </div>
  </aside>`;
}
