export const SITE = {
  name: "Ashtray",
  announcement: { text: "SPEND €70+ AND GET 15% OFF! USE CODE:", code: "FREAKYYAH" },
  instagram: { url: "https://www.instagram.com/ashtrayapparel/", handle: "@ashtrayapparel" },
  tiktok: { url: "https://www.tiktok.com/@ashtrayapparel" },
  studio: { url: "https://ashtraystudio.eu/", label: "ASHTRAYSTUDIO.EU" },
  /** Checkout stays closed until Stripe is connected (next build step). */
  checkoutOpen: false,
  checkoutClosedMessage: "CHECKOUT OPENS SOON. TO ORDER NOW, DM @ASHTRAYAPPAREL ON INSTAGRAM.",
  contactClosedMessage: "THE CONTACT FORM OPENS SOON. UNTIL THEN, DM @ASHTRAYAPPAREL ON INSTAGRAM.",
} as const;
