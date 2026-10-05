/**
 * Resistor colour code logic, ported unchanged from the web app's
 * lib/resistor.ts so the phone reads exactly the same values and draws the same
 * band art for a given product slug.
 */

export type ResistorBands = {
  band1: number;
  band2: number;
  band3: number;
};

export const BAND_COLORS = [
  { color: '#bfbfbf', label: 'black' },
  { color: '#7d5e40', label: 'brown' },
  { color: '#c43a2f', label: 'red' },
  { color: '#ffb74d', label: 'orange' },
  { color: '#fff176', label: 'yellow' },
  { color: '#aed581', label: 'green' },
  { color: '#64b5f6', label: 'blue' },
  { color: '#ce93d8', label: 'violet' },
  { color: '#9aa1ad', label: 'gray' },
  { color: '#fafafa', label: 'white' },
];

export const MULTIPLIER_COLORS = [
  { color: '#bfbfbf', label: 'black', value: 1 },
  { color: '#7d5e40', label: 'brown', value: 10 },
  { color: '#c43a2f', label: 'red', value: 100 },
  { color: '#ffb74d', label: 'orange', value: 1000 },
  { color: '#fff176', label: 'yellow', value: 10000 },
  { color: '#aed581', label: 'green', value: 100000 },
  { color: '#64b5f6', label: 'blue', value: 1000000 },
];

export const TOLERANCE_COLOR = '#c9a24a';

/**
 * The hero resistor needs the saturated yellow and violet the product art leaves
 * out, so they are overridden here rather than in the shared table.
 */
export const HERO_BAND_COLORS = BAND_COLORS.map((band) => {
  if (band.label === 'yellow') return { ...band, color: '#f2b705' };
  if (band.label === 'violet') return { ...band, color: '#7a4fb5' };
  return band;
});

export const HERO_MULTIPLIER_COLORS = MULTIPLIER_COLORS.map((band) =>
  band.label === 'yellow' ? { ...band, color: '#f2b705' } : band
);

/** ASCII units keep the value easy to read in a test; the hero swaps in symbols. */
export function formatResistorValue(band1: number, band2: number, band3: number): string {
  const d1 = Math.max(1, Math.min(9, band1));
  const d2 = Math.max(0, Math.min(9, band2));
  const mIdx = Math.max(0, Math.min(6, band3));
  const base = d1 * 10 + d2;
  const ohms = base * MULTIPLIER_COLORS[mIdx].value;
  if (ohms >= 1000000) {
    return `${(ohms / 1000000).toFixed(ohms % 1000000 === 0 ? 0 : 1)} MOhms`;
  }
  if (ohms >= 1000) {
    return `${(ohms / 1000).toFixed(ohms % 1000 === 0 ? 0 : 1)} kOhms`;
  }
  return `${ohms} O`;
}

/** The same value with the omega and micro symbols the hero shows. */
export function toDisplayValue(value: string): string {
  return value
    .replace(/MOhms$/, 'M\u03a9')
    .replace(/kOhms$/, 'k\u03a9')
    .replace(/ O$/, ' \u03a9');
}

/**
 * Turns a product slug into a stable set of bands, so every product keeps the
 * same artwork on every device and across reloads.
 */
export function hashSlugToBands(slug: string): ResistorBands {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash);
  return {
    band1: (h % 9) + 1,
    band2: Math.floor(h / 9) % 10,
    band3: Math.floor(h / 90) % 7,
  };
}

/** The four band colours used for product artwork. */
export function slugBandColors(slug: string): string[] {
  const { band1, band2, band3 } = hashSlugToBands(slug);
  return [
    BAND_COLORS[band1].color,
    BAND_COLORS[band2].color,
    MULTIPLIER_COLORS[band3].color,
    TOLERANCE_COLOR,
  ];
}