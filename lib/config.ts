export const SHOP_NAME = "Bench Supply";

// Replace this placeholder with the real shop owner address before deploying.
export const SHOP_CONTACT_EMAIL = "YOUR-EMAIL@gmail.com";

export const CATEGORIES = ["Boards", "Parts", "Kits", "Tools", "Sensors"] as const;

export type Category = (typeof CATEGORIES)[number];
