# Ashtray Apparel site: project notes

## What this is
- ashtrayapparel.com as the **Ashtray sample library**: the brand's own samples, sold one piece per size. Manufacturing services are sold on ashtraystudio.eu, and every sample page links there.
- Cloudflare Worker `ashtray-apparel`: server-rendered HTML from TypeScript templates (`src/`), static assets from `public/`. No runtime dependencies and no framework.
- The old Big Cartel shop, its archive and all research and planning docs are in the sibling repo `alekajs/ashtray-apparel-archive`, locally `../ashtray-apparel`. Its CLAUDE.md, PLAN.md and BUILD-PLAN.md hold the owner's earlier decisions and the payments/admin plan.

## Status (2026-09-14)
- **Live** at ashtray-apparel.aleksisr7.workers.dev: Workers Builds deploys every push to `main` of this repo (switched 2026-09-14). The archive repo is no longer connected; still don't push its uncommitted wrangler rename without the owner.
- **Built:** library, sample pages, cart (browser storage + server-priced `/api/quote`), menus, Our Story, policies, contact page, 404, redirects from old URLs, sitemap/robots.
- **Next:** Stripe Checkout (test mode first), automatic stock, the contact form email, then the admin panel. Until then `SITE.checkoutOpen` is false, and the contact POST only shows a notice.

## Owner decisions to keep
- **Look:** yeezy.com's quiet-grid mood (never copy its layout or details) plus ashtraystudio.eu's language turned black: Courier Prime, tracked uppercase labels, `[ BRACKETED ]` actions, dotted-leader spec rows, rulers (top everywhere; side ruler on desktop only), crop marks with "FIG. 01" captions.
- **Colours:** `#070707`, `#FAFAF7`, `#A45DBB` (hover `#C191CF`).
- **Minimal chrome on every page:** top bar `[ MENU ]` · logo · `[ CART n ]`, one footer line (promo + Instagram, TikTok, Ashtray Studio). The menu opens full screen.
- **Grid (owner, 2026-09-14):** the name on the left and the price on the right, with no colour. Prices are white and turn purple with the name on hover. The sample number `[NN]` sits in the photo's top-right corner (purple, trial pending the owner's OK). Photos are the owner's transparent cut-outs straight on the black page, with no tile, no hover fade and no fade for sold out. Prices are whole euros without decimals (€15), and amounts with cents keep them (€2.50). Samples are numbered in the order they were made.
- **Domain (owner, 2026-09-14):** the main address is `https://ashtrayapparel.com` without www (`SITE_ORIGIN` in `wrangler.jsonc`). `www.` forwards to it in the Worker, and workers.dev stays on. Keep the "made in Riga" wording and the Our Story caption.
- **Copy:** policies and product wording stay verbatim from the old shop. "All sales are final", no EU-rule changes, UK still shipped to (owner decision: change nothing there unless asked).
- **Commerce:**
  - shipping zones in `src/data/shipping.ts`
  - four discount codes in `src/data/discounts.ts` (percentages apply to samples only, never shipping)
  - stock 1 per size, KISS TEE 0
  - samples [06]–[12] (added 2026-09-14, folder names as slugs) are placeholders: €50, S/M/L, no spec or fit notes, one cut-out photo; names come from the folder names until the owner supplies real ones
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
