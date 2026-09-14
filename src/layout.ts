import { SAMPLES } from "./data/catalog";
import { INFO_PAGES } from "./data/pages";
import { SITE } from "./data/settings";
import { html, raw, type Html } from "./html";
import images from "./data/images.json";

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  origin: string;
  image?: string;
  ogType?: "website" | "product";
  noindex?: boolean;
  jsonLd?: object[];
  scripts?: string[];
  bodyClass?: string;
}

const logo = (images as { logo: { w: number; h: number } }).logo;

function jsonLdScript(data: object): Html {
  // JSON inside <script> must not be able to close the tag.
  return raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`);
}

function bar(leftAction: Html): Html {
  return html`<header class="bar">
    ${leftAction}
    <a class="bar__logo" href="/" aria-label="Ashtray sample library, home"><img src="/img/brand/logo-white.png" alt="Ashtray" width="${logo.w}" height="${logo.h}"></a>
    <a class="bar__action bar__action--end" href="/cart"><span>[ CART<span data-cart-count></span> ]</span></a>
  </header>`;
}

const rulers = raw('<div class="ruler ruler--top" aria-hidden="true"></div><div class="ruler ruler--side" aria-hidden="true"></div>');

export function menuContent(currentPath: string, closeAction: Html): Html {
  const main = [
    { href: "/", label: "LIBRARY", count: `[${String(SAMPLES.length).padStart(2, "0")}]`, current: currentPath === "/" || currentPath.startsWith("/sample/") },
    { href: "/our-story", label: "OUR STORY", count: "", current: currentPath === "/our-story" },
    { href: "/contact", label: "CONTACT", count: "", current: currentPath === "/contact" },
    { href: "/cart", label: "CART", count: "", current: currentPath === "/cart" },
  ];
  return html`<div class="menu__inner">
    ${rulers}
    ${bar(closeAction)}
    <div class="menu__body">
      <nav class="menu__nav" aria-label="Main">
        ${main.map((item) => html`<a href="${item.href}"${item.current ? raw(' aria-current="page"') : ""}><span>${item.label}</span><span class="label label--faint">${item.href === "/cart" ? raw('<span data-cart-count-bracket></span>') : item.count}</span></a>`)}
      </nav>
      <div class="menu__side">
        <div class="menu__group">
          <p class="menu__group-title label">INFO</p>
          <ul>${INFO_PAGES.map((p) => html`<li><a href="/${p.slug}"${currentPath === `/${p.slug}` ? raw(' aria-current="page"') : ""}>${p.title.toUpperCase()}</a></li>`)}</ul>
        </div>
        <div class="menu__group">
          <p class="menu__group-title label">FOLLOW</p>
          <ul>
            <li><a href="${SITE.instagram.url}" target="_blank" rel="noopener">INSTAGRAM ↗<span class="visually-hidden"> (opens in a new tab)</span></a></li>
            <li><a href="${SITE.tiktok.url}" target="_blank" rel="noopener">TIKTOK ↗<span class="visually-hidden"> (opens in a new tab)</span></a></li>
          </ul>
        </div>
        <a class="menu__studio" href="${SITE.studio.url}" target="_blank" rel="noopener">
          <span class="label label--accent label--strong-accent">ASHTRAY STUDIO ↗</span>
          <span class="menu__studio-text">build your own garment, from 10 units per style.</span><span class="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  </div>`;
}

export function footer(): Html {
  return html`<footer class="foot">
    <p class="foot__promo">${SITE.announcement.text} <strong>${SITE.announcement.code}</strong></p>
    <ul class="foot__links">
      <li><a href="${SITE.instagram.url}" target="_blank" rel="noopener">INSTAGRAM<span class="visually-hidden"> (opens in a new tab)</span></a></li>
      <li><a href="${SITE.tiktok.url}" target="_blank" rel="noopener">TIKTOK<span class="visually-hidden"> (opens in a new tab)</span></a></li>
      <li><a class="foot__studio" href="${SITE.studio.url}" target="_blank" rel="noopener">ASHTRAY STUDIO ↗<span class="visually-hidden"> (opens in a new tab)</span></a></li>
    </ul>
  </footer>`;
}

export function document(meta: PageMeta, content: Html, options: { menuPage?: boolean } = {}): string {
  const title = meta.title ? `${meta.title} | ${SITE.name}` : SITE.name;
  const url = `${meta.origin}${meta.path}`;
  const image = `${meta.origin}${meta.image ?? "/img/brand/share.jpg"}`;
  const menuTrigger = options.menuPage
    ? html`<a class="bar__action" href="/">[ CLOSE ]</a>`
    : html`<a class="bar__action" href="/menu" data-menu-open aria-haspopup="dialog" aria-controls="menu">[ MENU ]</a>`;

  const page = html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${meta.description}">
${meta.noindex ? raw('<meta name="robots" content="noindex">') : ""}
${meta.noindex ? "" : html`<link rel="canonical" href="${url}">`}
<meta property="og:type" content="${meta.ogType ?? "website"}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${meta.title || SITE.name}">
<meta property="og:description" content="${meta.description}">
${meta.noindex ? "" : html`<meta property="og:url" content="${url}">`}
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#070707">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/img/brand/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/courier-prime-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/courier-prime-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/css/site.css">
<script src="/assets/js/site.js" defer></script>
${(meta.scripts ?? []).map((src) => html`<script src="${src}" defer></script>`)}
${(meta.jsonLd ?? []).map(jsonLdScript)}
</head>
<body${meta.bodyClass ? html` class="${meta.bodyClass}"` : ""}>
<a class="skip" href="#main">Skip to content</a>
${options.menuPage ? "" : rulers}
${options.menuPage ? "" : bar(menuTrigger)}
<main id="main">
${content}
</main>
${options.menuPage ? "" : footer()}
${options.menuPage ? "" : html`<dialog id="menu" class="menu" aria-label="Menu">${menuContent(meta.path, html`<button class="bar__action" type="button" data-menu-close>[ CLOSE ]</button>`)}</dialog>`}
</body>
</html>
`;
  return page.value;
}
