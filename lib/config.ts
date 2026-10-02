export const SHOP_NAME = "Bench Supply";

// Shop owner address shown on the privacy page. Set NEXT_PUBLIC_SHOP_CONTACT_EMAIL
// in .env.local and in Vercel before deploying.
export const SHOP_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_SHOP_CONTACT_EMAIL || "YOUR-EMAIL@gmail.com";

export const CATEGORIES = ["Boards", "Parts", "Kits", "Tools", "Sensors"] as const;

export type Category = (typeof CATEGORIES)[number];
