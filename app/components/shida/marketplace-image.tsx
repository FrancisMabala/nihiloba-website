"use client";

import Image from "next/image";
import { useState } from "react";

export function MarketplaceImage({ src, fallbackSrc = null, alt, fallback, sizes = "(max-width: 720px) calc(100vw - 32px), (max-width: 1050px) 50vw, 33vw", preload = false }: { src: string | null; fallbackSrc?: string | null; alt: string; fallback: string; sizes?: string; preload?: boolean }) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);
  const usePrimary = Boolean(src && !primaryFailed);
  const activeSrc = usePrimary ? src : fallbackSrc && !secondaryFailed ? fallbackSrc : null;
  if (!activeSrc) return <div className="marketplace-image-fallback" role="img" aria-label={fallback}>{fallback}</div>;
  const protectedPhoto = activeSrc.startsWith('https://api.nihiloba.com/api/apartments/photos/') || /^\/api\/shida\/employer-photo\/AST_[A-Za-z0-9_-]{1,76}\/$/.test(activeSrc);
  return <Image src={activeSrc} alt={alt} fill sizes={sizes} preload={preload} unoptimized={protectedPhoto} onError={() => usePrimary ? setPrimaryFailed(true) : setSecondaryFailed(true)} />;
}
