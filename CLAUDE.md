# Ashtray Apparel site: project notes

## What this is
- ashtrayapparel.com as the **Ashtray sample library**: the brand's own samples, sold as pre-orders (or in stock, set per sample). Manufacturing services are sold on ashtraystudio.eu, and every sample page links there.
- Cloudflare Worker `ashtray-apparel`: server-rendered HTML from TypeScript templates (`src/`), static assets from `public/`. No runtime dependencies and no framework.
- The old Big Cartel shop, its archive and all research and planning docs are in the sibling repo `alekajs/ashtray-apparel-archive`, locally `../ashtray-apparel`. Its CLAUDE.md, PLAN.md and BUILD-PLAN.md hold the owner's earlier decisions and the payments/admin plan.

## Status (2026-09-14)
- **Live** at ashtray-apparel.aleksisr7.workers.dev: Workers Builds deploys every push to `main` of this repo (switched 2026-09-14). The archive repo is no longer connected; still don't push its uncommitted wrangler rename without the owner.
- **Built:** library, sample pages, cart (browser storage + server-priced `/api/quote`), menus, Our Story, policies, contact page, 404, redirects from old URLs, sitemap/robots.
- **Next:** Stripe Checkout (test mode first), automatic stock, the contact form email, then the admin panel. Until then `SITE.checkoutOpen` is false, and the contact POST only shows a notice.

## Owner decisions to keep
- **Look:** yeezy.com's quiet-grid mood (never copy its layout or details) plus ashtraystudio.eu's language turned black: Courier Prime, tracked uppercase labels, `[ BRACKETED ]` actions, dotted-leader spec rows, rulers (top everywhere; side ruler on desktop only, pinned to the window like ashtraystudio.eu), crop marks with "FIG. 01" captions.
- **Colours:** `#070707`, `#FAFAF7`, `#A45DBB` (hover `#C191CF`).
- **Minimal chrome on every page:** top bar `[ MENU ]` · logo · `[ CART n ]`, one footer line (Instagram, TikTok, Ashtray Studio; the coupon promo was removed 2026-09-30). The menu opens full screen.
- **Grid (owner, 2026-09-14):** the name on the left and the price on the right, with no colour. Prices are white and turn purple with the name on hover. The sample number `[NN]` sits in grey in the photo's bottom-left corner (cut-outs leave room above it) and turns purple on hover with the name and price. Photos are the owner's transparent cut-outs straight on the black page, with no tile, no hover fade and no fade for sold out. Prices are whole euros without decimals (€15), and amounts with cents keep them (€2.50). Grid order (owner, 2026-09-14): Basic zip up mocha, Basic zip up olive, Molly navy, Molly brown, baggy jeans, Cyber waffle, Cyber tee black, Cyber tee red, Chromatics hoodie, Abstract, Crawler, Kiss. Numbers 01–12 follow that order (the order of SAMPLES in catalog.ts).
- **Domain (owner, 2026-09-14):** the main address is `https://ashtrayapparel.com` without www (`SITE_ORIGIN` in `wrangler.jsonc`). `www.` forwards to it in the Worker, and workers.dev stays on.
- **Copy (owner, 2026-09-30):** the home note is only "These samples are from our studio and can be pre-ordered." Our Story has the owner's new two-paragraph text in lowercase except the brand names Ashtray Studio and Ashtray Apparel, and no photo caption. Product pages have no dispatch/Riga/Europe lines, nothing under the buy button, and no CATALOGUED row. They keep "ALL SALES ARE FINAL!"; "THIS IS NOT A PRE-ORDER" and "1 PIECE PER SIZE" show only on in-stock samples. Page descriptions for search and link previews say pre-order, not "one piece per size" or "shipped from Riga". The cart shows "OMNIVA WITH TRACKING" with no delivery time (the zone `delivery` text in shipping.ts is no longer displayed). Otherwise, policies and product wording stay verbatim from the old shop. "All sales are final", no EU-rule changes, UK still shipped to (owner decision: change nothing there unless asked).
- **Commerce:**
  - shipping zones in `src/data/shipping.ts`
  - four discount codes in `src/data/discounts.ts` (percentages apply to samples only, never shipping). **Switched off (owner, 2026-09-30):** `SITE.discountCodes` is false, so there is no footer promo, no code box in the cart, and the server ignores codes
  - pre-order toggle (owner, 2026-09-30): `preorder` per sample in catalog.ts, to move to the admin panel later. Pre-orders: `[ PRE-ORDER ]` button (no tag next to the colour, owner 2026-09-30), no stock limit (up to `MAX_PER_SIZE` = 10 per size per order), schema.org PreOrder. In stock: `[ ADD TO CART ]`, "THIS IS NOT A PRE-ORDER", limited to `stock` (1 per size), can sell out. All samples are pre-orders except KISS TEE (in stock, 0, sold out); flag that exception to the owner if it comes up
  - the seven samples added 2026-09-14 (the `draft()` entries, folder names as slugs) are placeholders: €50, S/M/L, no spec or fit notes, one cut-out photo; names come from the folder names until the owner supplies real ones
  - categories (owner, 2026-09-14): `[ UPPER ] [ LOWER ] [ ACCESSORIES ]` on the right of the home note, styled like `[ MENU ]`; `/?category=<key>` filters the grid; each sample has `category` in catalog.ts
  - STICKERS [13] (accessories, one size `OS` shown as ONE SIZE, placeholder €50) sits last
  - `[ BUILD YOUR OWN ]` on sample pages opens the studio's Tally form (`SITE.buildYourOwnUrl`); links to other websites open in a new tab
  - contact and order emails later go to ralfs@ashtraystudio.eu

## Rules
- **Clean-room:** don't copy markup, CSS or JS from Big Cartel's Sidecar theme or the archive's `offline-site/` / `source-code/`.
- **No inline styles or scripts:** the CSP is `'self'` only. Put all CSS in `public/assets/css/site.css` and JS in `public/assets/js/`.
- **Escaping:** everything interpolated into HTML goes through `html\`\`` (auto-escaped). Use `raw()` only for strings authored in this repo.
- **Secrets:** never in the repo or in chat. The owner adds them in the Cloudflare dashboard; local ones go in `.dev.vars` (git-ignored).
- **Commits and pushes:** commit as the repo-local identity (alekajs, GitHub noreply email). A push to `main` redeploys the live site once the Worker is connected, so push only when the owner asks.
- **Before committing:** run `npm run check` (tsc + vitest). Workers Builds runs it as the build command too.
- **Config:** SITE_ORIGIN and similar settings belong in `wrangler.jsonc` `vars`, not the dashboard (deploys overwrite dashboard vars).
- **Talking to the owner:** plain, non-technical language.

## Commands
- `npm run dev`: local site at http://localhost:8787
- `npm run check`: type check + tests
- `python scripts/build-images.py ../ashtray-apparel`: rebuild web images from the archive originals (needs Pillow)
