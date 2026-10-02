import { hashSlugToBands, BAND_COLORS, MULTIPLIER_COLORS, TOLERANCE_COLOR } from "@/lib/resistor";

export function BandArt({ slug }: { slug: string }) {
  const bands = hashSlugToBands(slug);
  const band1Color = BAND_COLORS[bands.band1]?.color ?? BAND_COLORS[0].color;
  const band2Color = BAND_COLORS[bands.band2]?.color ?? BAND_COLORS[0].color;
  const multColor = MULTIPLIER_COLORS[bands.band3]?.color ?? MULTIPLIER_COLORS[0].color;

  return (
    <div className="band-art">
      <span className="band-art-band" style={{ background: band1Color }} />
      <span className="band-art-band" style={{ background: band2Color }} />
      <span className="band-art-band" style={{ background: multColor }} />
      <span className="band-art-band" style={{ background: TOLERANCE_COLOR }} />
    </div>
  );
}