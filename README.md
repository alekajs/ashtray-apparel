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
- **Discount codes:** switched off since 30 Sept 2026 (`discountCodes: false` in `src/data/settings.ts`): no promo line, no code box in the cart, and codes are ignored. The four codes are still saved in `src/data/discounts.ts` for when they come back: FREAKYYAH (15% off €70+ of samples), SWAGG10 (10%), EQUE15 (15%, 1 use left), FREESWAGG (free shipping in Latvia).
- **Pre-order or in stock:** each sample has `preorder: true` or `false` in `src/data/catalog.ts`. Pre-orders show a PRE-ORDER tag and a `[ PRE-ORDER ]` button, and any size can be ordered (up to 10 per order). In-stock samples show `[ ADD TO CART ]` and "THIS IS NOT A PRE-ORDER", are limited to their stock (1 per size), and can sell out. Everything is a pre-order except KISS TEE, which is in stock and sold out.
- **Order:** the library shows samples in the order they're listed in `src/data/catalog.ts`, and the numbers follow that order.
- **Categories:** UPPER, LOWER and ACCESSORIES filter the library (`/?category=upper`). Each sample's `category` is set in `src/data/catalog.ts`. One-size items (like stickers) use size `OS`, shown as "ONE SIZE".
- **The seven samples added 14 Sept 2026** (Molly ×2, baggy jeans, cyber waffle, cyber tee ×2, Chromatics hoodie) have a placeholder €50 price, sizes S/M/L and no description yet.
- **Old links still work:** `/product/basic-mocha`, `/products` and similar old addresses redirect to the new ones.

**Not connected yet (next step):**
- **Checkout** shows "checkout opens soon, DM @ashtrayapparel". Stripe payments and automatic stock come next.
- **The contact form** shows the same kind of notice and doesn't store or send anything.

## Where to change things

| To change | Edit |
|---|---|
| Samples: names, prices, sizes, stock, pre-order or in stock, spec sheets | `src/data/catalog.ts` |
| Shipping zones and countries | `src/data/shipping.ts` |
| Discount codes | `src/data/discounts.ts` |
| Discount codes on or off, social links, studio link, the BUILD YOUR OWN form link, the pre-order note, notices | `src/data/settings.ts` |
| Our Story and policy wording | `src/data/pages.ts` |
| Look and layout | `public/assets/css/site.css` |
| Photos | originals in the archive repo, then run `python scripts/build-images.py ../ashtray-apparel` |
| A new sample | put its photos in a new folder `images/products/<name>/` in the archive (a cut-out `01-….png` is enough), add it to `src/data/catalog.ts` with the same `<name>`, then run the photo script |

## Run it on your computer

Needs Node.js 22.12 or newer (Cloudflare builds with Node 24).

```bash
npm install
npm run dev
```

Then open http://localhost:8787. Run `npm run check` for the type check and tests.

## Hosting (Cloudflare Workers)

The site runs as the Cloudflare Worker **ashtray-apparel** (`wrangler.jsonc`). The Worker is connected to this repository (Workers Builds): every push to `main` checks and deploys the site automatically, usually within a minute.

### Switching the existing Worker to this repository (done 14 Sept 2026)

The Worker used to build from the old repo, now renamed **ashtray-apparel-archive**. A renamed GitHub repo keeps its connection, so the switch had to be made by hand. For the record, or if it ever needs redoing:

1. **GitHub** → your profile → **Settings → Applications → Cloudflare Workers and Pages → Configure**. Under *Repository access*, make sure **ashtray-apparel** is included (or "All repositories").
2. **Cloudflare** → **Workers & Pages → ashtray-apparel → Settings → Build**. At *Git repository*, choose **Disconnect**, then **Connect** and pick **alekajs/ashtray-apparel**.
3. Use these build settings:

   | Setting | Value |
   |---|---|
   | Branch | `main` |
   | Build command | `npm run check` (stops the deploy if the type check or tests fail) |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | empty |
   | Builds for non-production branches | off |

4. Start the first build by pushing a commit to `main`. Don't press **Retry** on builds from before the switch: they rebuild the old archive.
5. When the build log ends with *Deployed*, check `/`, `/sample/basic-mocha`, `/product/basic-mocha` (should forward to the sample page) and `/cart`.

After switching, never use **Rollback** to a version from before the switch, because that would bring back the old copy of the Big Cartel site.

Cloudflare installs the packages from `package-lock.json` before building.

### The domain: ashtrayapparel.com (no www)

The main address is **https://ashtrayapparel.com**. `SITE_ORIGIN` in `wrangler.jsonc` sets it for canonical links, the sitemap and share previews. Keep it there and not in the dashboard: each deploy replaces dashboard variables with what's in `wrangler.jsonc`. `www.ashtrayapparel.com` forwards to it, old page addresses included, and the workers.dev address keeps working.

To point the domain at the site (one time):

1. **Cloudflare** → **Add a domain** → `ashtrayapparel.com`, Free plan.
2. **Namecheap** → Domain List → **Manage** → **Nameservers** → **Custom DNS**. Enter the two nameservers Cloudflare shows, then wait until Cloudflare marks the domain **Active** (minutes to a few hours).
3. **Cloudflare → DNS → Records**: delete the imported `www` CNAME (`ashtray.bigcartel.com`) and the root A record (`192.64.119.181`).
4. **Workers & Pages → ashtray-apparel → Settings → Domains & Routes → Add → Custom Domain**: add `ashtrayapparel.com`, then add `www.ashtrayapparel.com` too, so the forwarding works.
5. Open `https://www.ashtrayapparel.com/product/basic-mocha`: it should land on `https://ashtrayapparel.com/sample/basic-mocha`.

Keep auto-renew on at Namecheap (renewal due 5 May 2027).

## Design

- **Studio style, turned black:** Courier Prime (self-hosted, OFL licence in `LICENSES/`), tracked uppercase labels, `[ bracketed ]` actions, dotted spec rows, rulers and photo crop marks.
- **Colours:** black `#070707`, off-white `#FAFAF7`, purple `#A45DBB`.
- **Written from scratch:** no theme code or scripts from Big Cartel.
