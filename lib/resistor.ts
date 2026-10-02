export type BandValue = {
  digit?: number;
  multiplier?: number;
  color: string;
  label: string;
};

export type ResistorBands = {
  band1: number;
  band2: number;
  band3: number; // multiplier index 0-6
};

export const BAND_COLORS = [
  { color: "#bfbfbf", label: "black" },
  { color: "#7d5e40", label: "brown" },
  { color: "#c43a2f", label: "red" },
  { color: "#ffb74d", label: "orange" },
  { color: "#fff176", label: "yellow" },
  { color: "#aed581", label: "green" },
  { color: "#64b5f6", label: "blue" },
  { color: "#ce93d8", label: "violet" },
  { color: "#9aa1ad", label: "gray" },
  { color: "#fafafa", label: "white" },
];

export const MULTIPLIER_COLORS = [
  { color: "#bfbfbf", label: "black", value: 1 },
  { color: "#7d5e40", label: "brown", value: 10 },
  { color: "#c43a2f", label: "red", value: 100 },
  { color: "#ffb74d", label: "orange", value: 1000 },
  { color: "#fff176", label: "yellow", value: 10000 },
  { color: "#aed581", label: "green", value: 100000 },
  { color: "#64b5f6", label: "blue", value: 1000000 },
];

export const TOLERANCE_COLOR = "#c9a24a";

export function formatResistorValue(band1: number, band2: number, band3: number): string {
  const d1 = Math.max(1, Math.min(9, band1));
  const d2 = Math.max(0, Math.min(9, band2));
  const mIdx = Math.max(0, Math.min(6, band3));
  const base = d1 * 10 + d2;
  const mult = MULTIPLIER_COLORS[mIdx].value;
  const ohms = base * mult;
  if (ohms >= 1000000) {
    return (ohms / 1000000).toFixed(ohms % 1000000 === 0 ? 0 : 1) + " MOhms";
  }
  if (ohms >= 1000) {
    return (ohms / 1000).toFixed(ohms % 1000 === 0 ? 0 : 1) + " kOhms";
  }
  return ohms + " O";
}

export function hashSlugToBands(slug: string): ResistorBands {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash);
  const band1 = (h % 9) + 1; // 1-9
  const band2 = (Math.floor(h / 9) % 10); // 0-9
  const band3 = (Math.floor(h / 90) % 7); // 0-6
  return { band1, band2, band3 };
}
