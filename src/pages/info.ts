import { cursor } from "../components";
import { OUR_STORY, type InfoPage } from "../data/pages";
import { SITE } from "../data/settings";
import { html, raw } from "../html";
import { document, menuContent } from "../layout";
import images from "../data/images.json";

const story = (images as { pages: Record<string, { w: number; h: number }> }).pages["our-story"] ?? { w: 2142, h: 2856 };

/** Plain-text summary for meta descriptions, cut at a word boundary. */
export function summarize(markup: string, max = 155): string {
  const plain = markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

export function ourStoryPage(origin: string): string {
  const content = html`<div class="prose-page story">
    <div class="prose-page__head story__head">
      <h1 class="display display--xl">OUR<br>STORY.${cursor()}</h1>
      <figure class="fig fig--single">
        <div class="fig__frame"><img src="/img/pages/our-story-960.webp" srcset="/img/pages/our-story-480.webp 480w, /img/pages/our-story-960.webp 960w"
          sizes="(min-width: 1024px) 340px, 260px" width="${story.w}" height="${story.h}" alt="The two of us with a vintage Mercedes in an underground car park" decoding="async"></div>
      </figure>
    </div>
    <div class="prose story__text">${OUR_STORY.paragraphs.map((p) => html`<p>${p}</p>`)}</div>
  </div>`;
  return document(
    { title: OUR_STORY.title, description: summarize(OUR_STORY.paragraphs[0] ?? ""), path: "/our-story", origin, bodyClass: "page-story" },
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
  return document(
    { title: page.title, description: summarize(page.html), path: `/${page.slug}`, origin, bodyClass: "page-info" },
    content,
  );
}

export interface ContactValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function contactPage(origin: string, submitted?: ContactValues, problem?: string): string {
  const v = submitted ?? { name: "", email: "", subject: "", message: "" };
  const content = html`<div class="prose-page">
    <div class="prose-page__head">
      <h1 class="display display--xl">CONTACT${cursor()}</h1>
      <p class="label">OR DM <a class="link" href="${SITE.instagram.url}" target="_blank" rel="noopener">${SITE.instagram.handle.toUpperCase()}&nbsp;↗<span class="visually-hidden"> (opens in a new tab)</span></a></p>
    </div>
    <form class="contact" method="post" action="/contact">
      ${problem ? html`<p class="notice" role="alert">${problem}</p>` : ""}
      <p class="notice" ${submitted ? html`role="alert"` : html`role="note"`}>${SITE.contactClosedMessage}</p>
      <div class="field"><label class="label" for="contact-name">NAME</label><input class="input" id="contact-name" name="name" autocomplete="name" required maxlength="120" value="${v.name}"></div>
      <div class="field"><label class="label" for="contact-email">EMAIL</label><input class="input" id="contact-email" name="email" type="email" autocomplete="email" required maxlength="200" value="${v.email}"></div>
      <div class="field"><label class="label" for="contact-subject">SUBJECT</label><input class="input" id="contact-subject" name="subject" maxlength="200" value="${v.subject}"></div>
      <div class="field"><label class="label" for="contact-message">MESSAGE</label><textarea class="input input--area" id="contact-message" name="message" rows="7" required maxlength="5000">${v.message}</textarea></div>
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
    html`<div class="menu menu--page"><h1 class="visually-hidden">Menu</h1>${menuContent("/menu", html`<a class="bar__action" href="/">[ CLOSE ]</a>`)}</div>`,
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
