"use client";

import { useState } from "react";
import type { PublicImage } from "../../types/shida-public";
import { MarketplaceImage } from "./marketplace-image";

export function ImageGallery({ images, title, fallback, photosLabel }: { images: PublicImage[]; title: string; fallback: string; photosLabel: string }) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return <div className="marketplace-gallery marketplace-gallery-empty"><div className="marketplace-gallery-main"><MarketplaceImage src={null} alt="" fallback={fallback}/></div></div>;
  const activeIndex = Math.min(selected, images.length - 1);
  const active = images[activeIndex];
  return <section className="marketplace-gallery" aria-label={photosLabel}>
    <div className="marketplace-gallery-main">
      <MarketplaceImage src={active.url} alt={active.alt || `${title} — ${activeIndex + 1}`} fallback={fallback} sizes="(max-width: 720px) calc(100vw - 32px), 1180px" preload/>
      {images.length > 1 && <span className="marketplace-image-count" aria-live="polite">{activeIndex + 1} / {images.length}</span>}
    </div>
    {images.length > 1 && <div className="marketplace-thumbnails" aria-label={photosLabel}>
      {images.map((image, index) => <button className={index === activeIndex ? "marketplace-thumbnail marketplace-thumbnail-active" : "marketplace-thumbnail"} type="button" key={`${image.url}-${index}`} onClick={() => setSelected(index)} aria-label={`${index + 1} / ${images.length}`} aria-pressed={index === activeIndex}>
        <MarketplaceImage src={image.url} alt="" fallback={fallback} sizes="120px"/>
      </button>)}
    </div>}
  </section>;
}
