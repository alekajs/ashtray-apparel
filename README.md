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

The site runs as the Cloudflare Worker **ashtray-apparel** (`wrangler.jsonc`). Once the Worker is connected to this repository (Workers Builds), every push to `main` checks and deploys the site automatically.

### Switching the existing Worker to this repository (one time)

The Worker was built from the old repo, now renamed **ashtray-apparel-archive**. Switch it over like this:

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

4. Start the first build: **Deployments → Retry / Trigger build**, or push any commit to `main`.
5. When the build log ends with *Deployed*, check `/`, `/sample/basic-mocha`, `/product/basic-mocha` (should forward to the sample page) and `/cart`.

After switching, never use **Rollback** to a version from before the switch, because that would bring back the old copy of the Big Cartel site.

Cloudflare installs the packages from `package-lock.json` before building.

### Custom domain later

When ashtrayapparel.com moves to Cloudflare, add it to `wrangler.jsonc`:
- `"vars": { "SITE_ORIGIN": "https://www.ashtrayapparel.com" }`, so links shared on social media point at the domain;
- the domain under `routes` with `"custom_domain": true`.

Don't set these only in the dashboard: each deploy replaces dashboard variables with what's in `wrangler.jsonc`.

## Design

- **Studio style, turned black:** Courier Prime (self-hosted, OFL licence in `LICENSES/`), tracked uppercase labels, `[ bracketed ]` actions, dotted spec rows, rulers and photo crop marks.
- **Colours:** black `#070707`, off-white `#FAFAF7`, purple `#A45DBB`.
- **Written from scratch:** no theme code or scripts from Big Cartel.
