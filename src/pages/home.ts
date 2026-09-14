import { sampleTile } from "../components";
import { SAMPLES } from "../data/catalog";
import { SITE } from "../data/settings";
import { html } from "../html";
import { document } from "../layout";
import { libraryLd, organizationLd } from "../seo";

export function homePage(origin: string): string {
  const content = html`<section class="library" aria-labelledby="library-title">
    <h1 id="library-title" class="visually-hidden">Ashtray sample library</h1>
    <p class="library__intro label">${SITE.libraryIntro}</p>
    <ul class="grid">${SAMPLES.map((sample, i) => sampleTile(sample, i))}</ul>
  </section>`;
  return document(
    {
      title: "Sample Library",
      description: "The Ashtray sample library: our own heavyweight tees and zip ups, one piece per size, shipped from Riga within Europe.",
      path: "/",
      origin,
      jsonLd: [...organizationLd(origin), libraryLd(origin)],
      bodyClass: "page-home",
    },
    content,
  );
}
