export const SHOP_NAME = ""Bench Supply"";

export const CATEGORIES = [""Boards"", ""Parts"", ""Kits"", ""Tools"", ""Sensors""] as const;

export type Category = (typeof CATEGORIES)[number];
