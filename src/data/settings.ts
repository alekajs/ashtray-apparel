export const SITE = {
  name: "Ashtray",
  instagram: { url: "https://www.instagram.com/ashtrayapparel/", handle: "@ashtrayapparel" },
  tiktok: { url: "https://www.tiktok.com/@ashtrayapparel" },
  studio: { url: "https://ashtraystudio.eu/", label: "ASHTRAYSTUDIO.EU" },
  /** Where [ BUILD YOUR OWN ] on sample pages leads: the studio's enquiry form. */
  buildYourOwnUrl: "https://tally.so/r/mJZLYX",
  /** Short note above the library grid on the home page. */
  libraryIntro: "These samples are from our studio and can be pre-ordered.",
  /** Discount codes (owner, 2026-09-30: off). While false the cart has no code box and the server ignores codes;
   *  the four codes stay in src/data/discounts.ts for when they come back. */
  discountCodes: false,
  /** Checkout stays closed until Stripe is connected (next build step). */
  checkoutOpen: false,
  checkoutClosedMessage: "CHECKOUT OPENS SOON. TO ORDER NOW, DM @ASHTRAYAPPAREL ON INSTAGRAM.",
  contactClosedMessage: "THE CONTACT FORM OPENS SOON. UNTIL THEN, DM @ASHTRAYAPPAREL ON INSTAGRAM.",
} as const;
