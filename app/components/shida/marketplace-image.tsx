"use client";

import Image from "next/image";
import { useState } from "react";

export function MarketplaceImage({ src, alt, fallback, sizes = "(max-width: 720px) calc(100vw - 32px), (max-width: 1050px) 50vw, 33vw", preload = false }: { src: string | null; alt: string; fallback: string; sizes?: string; preload?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="marketplace-image-fallback" role="img" aria-label={fallback}>{fallback}</div>;
  return <Image src={src} alt={alt} fill sizes={sizes} preload={preload} onError={() => setFailed(true)} />;
}
