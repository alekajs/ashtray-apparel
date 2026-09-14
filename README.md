# Ashtray Apparel

The new **ashtrayapparel.com**: the Ashtray sample library. Every garment on the site is one of our own samples, made in Riga. Our manufacturing service lives at [ashtraystudio.eu](https://ashtraystudio.eu).

The old Big Cartel shop is archived separately in **alekajs/ashtray-apparel-archive** (photos, copy, order history, shipping and discount settings).

## What's built

| Page | Address |
|---|---|
| Library (all samples) | `/` |
| Sample page | `/sample/<name>` (e.g. `/sample/basic-mocha`) |
| Cart | `/cart` |
| Menu (without JavaScript) | `/menu` |
| Our Story, Refund / Privacy / Shipping policy | `/our-story`, `/refund-policy`, `/privacy-policy`, `/shipping-policy` |
| Contact | `/contact` |

- **Cart:** kept in the visitor's browser. Prices, shipping and discount codes are always worked out on the server (`/api/quote`), so they can't be changed from the browser.
- **Shipping:** Omniva, the old Big Cartel rates. Latvia €2.50 + €0.70 per extra item; Estonia/Lithuania €5.20 + €0.80; Finland €12 + €2; rest of Europe €30 + €5.
- **Discount codes:** FREAKYYAH (15% off €70+ of samples), SWAGG10 (10%), EQUE15 (15%, 1 use left), FREESWAGG (free shipping in Latvia).
- **Stock:** 1 per size; KISS TEE is sold out.
- **Old links still work:** `/product/basic-mocha`, `/products` and similar old addresses redirect to the new ones.

**Not connected yet (next step):**
- **Checkout** shows "checkout opens soon, DM @ashtrayapparel". Stripe payments and automatic stock come next.
- **The contact form** shows the same kind of notice and doesn't store or send anything.

## Where to change things

| To change | Edit |
|---|---|
| Samples: names, prices, sizes, stock, spec sheets | `src/data/catalog.ts` |
| Shipping zones and countries | `src/data/shipping.ts` |
| Discount codes | `src/data/discounts.ts` |
| Promo line, social links, studio link, notices | `src/data/settings.ts` |
| Our Story and policy wording | `src/data/pages.ts` |
| Look and layout | `public/assets/css/site.css` |
| Photos | originals in the archive repo, then run `python scripts/build-images.py ../ashtray-apparel` |

## Run it on your computer

Needs Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:8787. Run `npm run check` for the type check and tests.

## Hosting (Cloudflare Workers)

The site runs as the Cloudflare Worker **ashtray-apparel** (`wrangler.jsonc`). With the Worker connected to this repository in Cloudflare (Workers Builds), every push to `main` builds and deploys automatically:

| Setting | Value |
|---|---|
| Project name | `ashtray-apparel` |
| Build command | empty |
| Deploy command | `npx wrangler deploy` |
| Root directory | empty |
| Production branch | `main` |

Cloudflare installs the packages from `package-lock.json` before deploying.

**Custom domain later:** set `SITE_ORIGIN` (Worker → Settings → Variables) to `https://www.ashtrayapparel.com`, so links shared on social media point at the domain rather than the workers.dev address.

## Design

- **Studio style, turned black:** Courier Prime (self-hosted, OFL licence in `LICENSES/`), tracked uppercase labels, `[ bracketed ]` actions, dotted spec rows, rulers and photo crop marks.
- **Colours:** black `#070707`, off-white `#FAFAF7`, purple `#A45DBB`.
- **Written from scratch:** no theme code or scripts from Big Cartel.
