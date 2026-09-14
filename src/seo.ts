import { SAMPLES, fullName, imageUrl, isSoldOut, sizeLabel, type Sample } from "./data/catalog";
import { INFO_PAGES } from "./data/pages";
import { SITE } from "./data/settings";

export function organizationLd(origin: string): object[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: origin,
      logo: `${origin}/img/brand/icon-192.png`,
      sameAs: [SITE.instagram.url, SITE.tiktok.url],
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: origin },
  ];
}

export function libraryLd(origin: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ashtray sample library",
    itemListElement: SAMPLES.map((sample, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: fullName(sample),
      url: `${origin}/sample/${sample.slug}`,
    })),
  };
}

export function sampleLd(origin: string, sample: Sample): object[] {
  const url = `${origin}/sample/${sample.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: fullName(sample),
      sku: `ASH-S${sample.number}`,
      url,
      image: sample.figures.map((figure) => `${origin}${imageUrl(sample, figure.n, 1600)}`),
      brand: { "@type": "Brand", name: SITE.name },
      offers: sample.sizes.map((size) => ({
        "@type": "Offer",
        sku: `ASH-S${sample.number}-${size.code}`,
        name: `${fullName(sample)} (${sizeLabel(size.code)})`,
        price: (sample.priceCents / 100).toFixed(2),
        priceCurrency: "EUR",
        url,
        availability: size.stock > 0 && !isSoldOut(sample) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Library", item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: `${sample.name} [${sample.number}]`, item: url },
      ],
    },
  ];
}

export function sitemap(origin: string): string {
  const paths = ["/", ...SAMPLES.map((s) => `/sample/${s.slug}`), "/our-story", ...INFO_PAGES.map((p) => `/${p.slug}`), "/contact"];
  const urls = paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robots(origin: string): string {
  return `User-agent: *\nDisallow: /api/\nDisallow: /cart\nDisallow: /menu\n\nSitemap: ${origin}/sitemap.xml\n`;
}
