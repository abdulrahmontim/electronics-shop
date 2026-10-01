import { hashSlugToBands } from "@/lib/resistor";

export function BandArt({ slug }: { slug: string }) {
  const bands = hashSlugToBands(slug);
  const band1Color = [
    "#7d5e40",
    "#e57373",
    "#ffb74d",
    "#fff176",
    "#aed581",
    "#64b5f6",
    "#ce93d8",
    "#cfd8dc",
    "#fafafa",
  ][Math.max(0, bands.band1 - 1)];
  const band2Color = [
    "#bfbfbf",
    "#7d5e40",
    "#e57373",
    "#ffb74d",
    "#fff176",
    "#aed581",
    "#64b5f6",
    "#ce93d8",
    "#cfd8dc",
    "#fafafa",
  ][bands.band2];
  const multColors = ["#bfbfbf", "#7d5e40", "#e57373", "#ffb74d", "#fff176", "#aed581", "#64b5f6"];
  const multColor = multColors[bands.band3] || "#bfbfbf";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "0.5rem",
        height: "100%",
      }}
    >
      <div style={{ width: "1rem", height: "3rem", background: band1Color }} />
      <div style={{ width: "1rem", height: "3rem", background: band2Color }} />
      <div style={{ width: "1rem", height: "3rem", background: multColor }} />
      <div style={{ width: "1rem", height: "3rem", background: "var(--band-yellow)" }} />
    </div>
  );
}
