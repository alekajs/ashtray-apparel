import { cursor, priceTag, studioBox } from "../components";
import { FINAL_NOTE, IN_STOCK_NOTE, fullName, imageSrcset, imageUrl, isSoldOut, orderLimit, shareImageUrl, sizeLabel, type Sample } from "../data/catalog";
import { html } from "../html";
import { document } from "../layout";
import { formatEur } from "../money";
import { sampleLd } from "../seo";

function gallery(sample: Sample) {
  const total = sample.figures.length;
  const title = fullName(sample);
  return html`<section class="gallery" aria-label="Photos of ${title}">
    <div class="gallery__track" data-gallery>
      ${sample.figures.map(
        (figure, i) => html`<figure class="fig" id="fig-${figure.n}">
          <div class="fig__frame"><img src="${imageUrl(sample, figure.n, 960)}" srcset="${imageSrcset(sample, figure.n)}"
            sizes="(min-width: 1024px) ${i === 0 || (i === total - 1 && (i + 1) % 2 === 0) ? "54vw" : "26vw"}, 96vw"
            width="${figure.width}" height="${figure.height}" alt="${title}, ${figure.caption.toLowerCase()}"
            ${i === 0 ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async"></div>
          <figcaption><span>FIG. ${String(figure.n).padStart(2, "0")} — ${figure.caption}</span><span class="fig__count">${figure.n}&nbsp;/&nbsp;${total}</span></figcaption>
        </figure>`,
      )}
    </div>
    ${total > 1
      ? html`<div class="gallery__index" data-gallery-index>
          ${sample.figures.map(
            (figure, i) => html`<a href="#fig-${figure.n}" data-target="fig-${figure.n}"${i === 0 ? html` aria-current="true"` : ""}>${String(figure.n).padStart(2, "0")}<span class="visually-hidden">, photo ${figure.n} of ${total}</span></a>`,
          )}
        </div>`
      : ""}
  </section>`;
}

function buyForm(sample: Sample) {
  const soldOut = isSoldOut(sample);
  const onlyOne = sample.sizes.length === 1;
  const buttonLabel = sample.preorder ? "[ PRE-ORDER ]" : "[ ADD TO CART ]";
  return html`<form class="buy" data-add-to-cart data-sample="${sample.slug}" action="/cart" method="get">
    <fieldset class="sizes">
      <legend class="visually-hidden">Size</legend>
      <div class="sizes__head" aria-hidden="true"><span class="label">SIZE</span>${!sample.preorder && sample.sizes.every((size) => size.stock <= 1) ? html`<span class="label label--faint">1 PIECE PER SIZE</span>` : ""}</div>
      <div class="chips">
        ${sample.sizes.map(
          (size) => {
            const limit = orderLimit(sample, size);
            return html`<label class="chip"><input type="radio" name="size" value="${size.code}" data-stock="${limit}"${limit <= 0 ? html` disabled` : onlyOne ? html` checked` : ""} required><span>${sizeLabel(size.code)}<span class="visually-hidden">${limit <= 0 ? ", sold out" : ""}</span></span></label>`;
          },
        )}
      </div>
    </fieldset>
    ${soldOut
      ? html`<button class="btn btn--primary" type="submit" disabled>[ SOLD OUT ]</button>`
      : html`<button class="btn btn--primary" type="submit" data-add-button data-label="${buttonLabel}">${buttonLabel}</button>`}
    <p class="buy__status label label--faint" role="status" aria-live="polite" data-add-status>${soldOut ? "THIS SAMPLE HAS SOLD OUT." : ""}</p>
    <noscript><p class="label">Adding to the cart needs JavaScript.</p></noscript>
  </form>`;
}

export function samplePage(origin: string, sample: Sample): string {
  const soldOut = isSoldOut(sample);
  const spec = sample.spec;
  const content = html`<nav class="crumbs label" aria-label="Breadcrumb">
      <a href="/">← LIBRARY</a><span aria-hidden="true">/</span><span class="label--ink" aria-current="page">${sample.name} [${sample.number}]</span>
    </nav>
    <div class="sample">
      ${gallery(sample)}
      <section class="panel" aria-labelledby="sample-title">
        <div class="panel__head">
          <p class="label label--accent">SAMPLE [${sample.number}]</p>
          <h1 id="sample-title" class="display">${sample.name}${cursor()}</h1>
          <div class="panel__meta">
            <span class="label">${[
              sample.colour,
              sample.preorder && !soldOut ? html`<span class="label--accent">PRE-ORDER</span>` : "",
              sample.onSale && !soldOut ? html`<span class="label--accent">SALE</span>` : "",
            ]
              .filter(Boolean)
              .map((part, i) => (i ? html` <span class="nowrap"><span class="label--accent">·</span> ${part}</span>` : part))}</span>
            <span class="panel__price">${priceTag(sample)}</span>
          </div>
        </div>
        ${buyForm(sample)}
        ${spec.length
          ? html`<div class="spec">
              <h2 class="spec__head label">SPEC SHEET</h2>
              <dl>${spec.map(([key, value]) => html`<div class="kv"><dt>${key}</dt><dd>${value}</dd></div>`)}</dl>
            </div>`
          : ""}
        <div class="notes">
          ${sample.important ? html`<p><span class="label--accent">* </span>${sample.important}</p>` : ""}
          ${sample.fit.length ? html`<ul class="notes__list muted">${sample.fit.map((line) => html`<li>${line}</li>`)}</ul>` : ""}
          ${sample.preorder ? "" : html`<ul class="notes__list muted"><li>${IN_STOCK_NOTE}</li></ul>`}
          <p class="notes__final">${FINAL_NOTE}</p>
        </div>
        ${studioBox()}
      </section>
    </div>`;
  const specSummary = sample.spec.map(([, value]) => value.toLowerCase()).slice(0, 3).join(", ");
  const described = `${sample.name}${sample.colour ? ` in ${sample.colour.toLowerCase()}` : ""}, sample [${sample.number}] from the Ashtray sample library`;
  return document(
    {
      title: `${fullName(sample)} [${sample.number}]`,
      description: `${described}${specSummary ? `: ${specSummary}` : ""}. ${soldOut ? "Sold out" : `${formatEur(sample.priceCents)}${sample.preorder ? ", pre-order" : ""}`}.`,
      path: `/sample/${sample.slug}`,
      origin,
      image: shareImageUrl(sample),
      ogType: "product",
      jsonLd: sampleLd(origin, sample),
      bodyClass: "page-sample",
    },
    content,
  );
}
