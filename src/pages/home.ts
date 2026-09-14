import { sampleTile } from "../components";
import { SAMPLES } from "../data/catalog";
import { html } from "../html";
import { document } from "../layout";
import { libraryLd, organizationLd } from "../seo";

export function homePage(origin: string): string {
  const content = html`<section class="library" aria-labelledby="library-title">
    <h1 id="library-title" class="visually-hidden">Ashtray sample library</h1>
    <ul class="grid">${SAMPLES.map((sample, i) => sampleTile(sample, i))}</ul>
  </section>`;
  return document(
    {
      title: "Sample Library",
      description: "Samples made by Ashtray in Riga: heavyweight tees and zip ups, one piece per size, shipped within Europe.",
      path: "/",
      origin,
      jsonLd: [...organizationLd(origin), libraryLd(origin)],
      bodyClass: "page-home",
    },
    content,
  );
}
