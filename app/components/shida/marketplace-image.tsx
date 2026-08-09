"use client";

import Image from "next/image";
import { useState } from "react";

export function MarketplaceImage({ src, alt, fallback }: { src: string | null; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="marketplace-image-fallback" role="img" aria-label={fallback}>{fallback}</div>;
  return <Image src={src} alt={alt} fill sizes="(max-width: 720px) 100vw, 42vw" onError={() => setFailed(true)} />;
}
