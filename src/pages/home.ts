import { sampleTile } from "../components";
import { CATEGORIES, SAMPLES } from "../data/catalog";
import { SITE } from "../data/settings";
import { html } from "../html";
import { document } from "../layout";
import { libraryLd, organizationLd } from "../seo";

/** The library, optionally filtered to one category (/?category=upper). Unknown categories show everything. */
export function homePage(origin: string, category?: string | null): string {
  const active = CATEGORIES.find((c) => c.key === category);
  const samples = active ? SAMPLES.filter((sample) => sample.category === active.key) : SAMPLES;
  const content = html`<section class="library" aria-labelledby="library-title">
    <h1 id="library-title" class="visually-hidden">Ashtray sample library${active ? `: ${active.label.toLowerCase()}` : ""}</h1>
    <div class="library__head">
      <p class="library__intro label">${SITE.libraryIntro}</p>
      <nav class="library__cats" aria-label="Categories">
        ${CATEGORIES.map((c) =>
          c === active
            ? html`<a class="library__cat" href="/" aria-current="true" title="Show all samples">[ ${c.label} ]</a>`
            : html`<a class="library__cat" href="/?category=${c.key}">[ ${c.label} ]</a>`,
        )}
      </nav>
    </div>
    ${samples.length
      ? html`<ul class="grid">${samples.map((sample, i) => sampleTile(sample, i))}</ul>`
      : html`<p class="library__empty label">NOTHING IN ${active?.label ?? "HERE"} YET.</p>`}
  </section>`;
  return document(
    {
      title: active ? `${active.label.charAt(0)}${active.label.slice(1).toLowerCase()} | Sample Library` : "Sample Library",
      description: "The Ashtray sample library: samples from our studio, available to pre-order.",
      path: "/",
      origin,
      jsonLd: [...organizationLd(origin), libraryLd(origin)],
      bodyClass: "page-home",
    },
    content,
  );
}
