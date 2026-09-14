import { cursor } from "../components";
import { OUR_STORY, type InfoPage } from "../data/pages";
import { SITE } from "../data/settings";
import { html, raw } from "../html";
import { document, menuContent } from "../layout";
import images from "../data/images.json";

const story = (images as { pages: Record<string, { w: number; h: number }> }).pages["our-story"] ?? { w: 2142, h: 2856 };

export function ourStoryPage(origin: string): string {
  const content = html`<div class="prose-page story">
    <div class="prose-page__head">
      <h1 class="display display--xl">OUR<br>STORY.${cursor()}</h1>
    </div>
    <div class="story__body">
      <figure class="fig fig--single">
        <div class="fig__frame"><img src="/img/pages/our-story-960.webp" srcset="/img/pages/our-story-480.webp 480w, /img/pages/our-story-960.webp 960w"
          sizes="(min-width: 1024px) 32vw, 90vw" width="${story.w}" height="${story.h}" alt="The two of us with a vintage Mercedes in an underground car park" decoding="async"></div>
        <figcaption><span>FIG. 01 — RIGA</span></figcaption>
      </figure>
      <div class="prose story__text">${OUR_STORY.paragraphs.map((p) => html`<p>${p}</p>`)}</div>
    </div>
  </div>`;
  return document(
    { title: OUR_STORY.title, description: OUR_STORY.paragraphs[0] ?? "", path: "/our-story", origin, bodyClass: "page-story" },
    content,
  );
}

export function infoPage(origin: string, page: InfoPage): string {
  const content = html`<div class="prose-page">
    <div class="prose-page__head">
      <h1 class="display display--lg">${page.title.toUpperCase()}${cursor()}</h1>
    </div>
    <div class="prose">${raw(page.html)}</div>
  </div>`;
  const plain = page.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return document(
    { title: page.title, description: plain.slice(0, 155), path: `/${page.slug}`, origin, bodyClass: "page-info" },
    content,
  );
}

export function contactPage(origin: string, submitted = false): string {
  const content = html`<div class="prose-page">
    <div class="prose-page__head">
      <h1 class="display display--xl">CONTACT${cursor()}</h1>
      <p class="label">OR DM <a class="link" href="${SITE.instagram.url}" rel="noopener">${SITE.instagram.handle.toUpperCase()} ↗</a></p>
    </div>
    <form class="contact" method="post" action="/contact">
      ${submitted ? html`<p class="notice" role="status">${SITE.contactClosedMessage}</p>` : ""}
      <div class="field"><label class="label" for="contact-name">NAME</label><input class="input" id="contact-name" name="name" autocomplete="name" required maxlength="120"></div>
      <div class="field"><label class="label" for="contact-email">EMAIL</label><input class="input" id="contact-email" name="email" type="email" autocomplete="email" required maxlength="200"></div>
      <div class="field"><label class="label" for="contact-subject">SUBJECT</label><input class="input" id="contact-subject" name="subject" maxlength="200"></div>
      <div class="field"><label class="label" for="contact-message">MESSAGE</label><textarea class="input input--area" id="contact-message" name="message" rows="7" required maxlength="5000"></textarea></div>
      <div class="contact__actions">
        <button class="btn btn--primary btn--auto" type="submit">[ SEND MESSAGE ]</button>
      </div>
    </form>
  </div>`;
  return document(
    { title: "Contact", description: "Get in touch with Ashtray.", path: "/contact", origin, bodyClass: "page-contact" },
    content,
  );
}

export function menuPage(origin: string): string {
  return document(
    { title: "Menu", description: "Ashtray menu.", path: "/menu", origin, noindex: true, bodyClass: "page-menu" },
    html`<div class="menu menu--page">${menuContent("/menu", html`<a class="bar__action" href="/">[ CLOSE ]</a>`)}</div>`,
    { menuPage: true },
  );
}

export function notFoundPage(origin: string, path: string): string {
  const content = html`<div class="notfound">
    <h1 class="display display--xl">NOT FOUND.${cursor()}</h1>
    <p class="label">NOTHING HERE. JUST ASH.</p>
    <a class="btn btn--ghost" href="/">[ BACK TO THE LIBRARY ]</a>
  </div>`;
  return document(
    { title: "Not found", description: "This page doesn't exist.", path, origin, noindex: true, bodyClass: "page-404" },
    content,
  );
}
