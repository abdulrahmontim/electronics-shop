"use client";

import { useState } from "react";
import Image from "next/image";
import { BandArt } from "./BandArt";

export function ProductImage({
  slug,
  name,
  imageUrl,
}: {
  slug: string;
  name: string;
  imageUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return <BandArt slug={slug} />;
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      sizes="(max-width: 800px) 100vw, (max-width: 1200px) 50vw, 25vw"
      className="tile-image"
      onError={() => setFailed(true)}
    />
  );
}