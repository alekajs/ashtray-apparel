import { cursor } from "../components";
import { SITE } from "../data/settings";
import { countryOptions, HOME_COUNTRY } from "../data/shipping";
import { html } from "../html";
import { document } from "../layout";

export function cartPage(origin: string): string {
  const content = html`<div class="page-head">
      <h1 class="display display--xl">CART${cursor()}</h1>
      <span class="label" data-cart-heading-count></span>
    </div>
    <div class="cart" data-cart>
      <section class="ledger" aria-label="Samples in your cart">
        <div class="ledger__head label" aria-hidden="true"><span>SAMPLE</span><span>SIZE</span><span>QTY</span><span>TOTAL</span></div>
        <ul class="ledger__rows" data-cart-rows></ul>
        <div class="cart__empty" data-cart-empty hidden>
          <p class="label label--ink">YOUR CART IS EMPTY.</p>
          <a class="btn btn--ghost" href="/">[ BROWSE THE LIBRARY ]</a>
        </div>
        <noscript><p class="label label--ink">The cart needs JavaScript to work.</p></noscript>
        <a class="link cart__back" href="/">← BACK TO THE LIBRARY</a>
      </section>
      <aside class="summary" aria-labelledby="summary-title">
        <h2 id="summary-title" class="label label--strong">SUMMARY</h2>
        <div class="field">
          <label class="label" for="ship-to">SHIP TO</label>
          <select id="ship-to" class="select select--full" data-country>
            ${countryOptions().map((c) => html`<option value="${c.code}"${c.code === HOME_COUNTRY ? html` selected` : ""}>${c.name}</option>`)}
          </select>
          <p class="label label--faint" data-delivery>OMNIVA WITH TRACKING · <span class="nowrap">APPROX. 1–3 DAYS</span></p>
        </div>
        <form class="field" data-code-form>
          <label class="label" for="discount-code">DISCOUNT CODE</label>
          <div class="code">
            <input id="discount-code" class="input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40">
            <button class="btn btn--ghost" type="submit">[ APPLY ]</button>
          </div>
          <p class="message" role="status" aria-live="polite" data-code-message></p>
        </form>
        <dl class="totals">
          <div class="kv"><dt>SUBTOTAL</dt><dd data-subtotal>€0</dd></div>
          <div class="kv kv--accent" data-discount-row hidden><dt data-discount-label>DISCOUNT</dt><dd data-discount>−€0</dd></div>
          <div class="kv"><dt data-shipping-label>SHIPPING</dt><dd data-shipping>€0</dd></div>
          <div class="totals__total"><dt>TOTAL</dt><dd data-total>€0</dd></div>
        </dl>
        <div class="summary__checkout">
          <button class="btn btn--primary" type="button" data-checkout>[ CHECKOUT ]</button>
          <p class="message message--center" role="status" aria-live="polite" data-checkout-message></p>
          <p class="label label--faint summary__note">${SITE.checkoutOpen ? html`SECURE PAYMENT ON STRIPE · ` : ""}<a class="summary__dm" href="${SITE.instagram.url}" rel="noopener">OR DM&nbsp;${SITE.instagram.handle.toUpperCase()}</a></p>
          <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-cart-announce></p>
        </div>
      </aside>
    </div>`;
  return document(
    {
      title: "Cart",
      description: "Your Ashtray cart.",
      path: "/cart",
      origin,
      noindex: true,
      scripts: ["/assets/js/cart.js"],
      bodyClass: "page-cart",
    },
    content,
  );
}
