"use client";

import { useEffect, useId, useReducer, useRef, type KeyboardEvent, type TouchEvent } from "react";
import type { PublicImage } from "../../types/shida-public";
import { MarketplaceImage } from "./marketplace-image";

export type GalleryState = { selected: number; lightboxOpen: boolean };
export type GalleryAction =
  | { type: "select"; index: number; length: number }
  | { type: "previous" | "next"; length: number }
  | { type: "open-lightbox" }
  | { type: "close-lightbox" };

export function galleryIndex(current: number, length: number, direction: -1 | 1): number {
  if (length <= 1) return 0;
  return (current + direction + length) % length;
}

export function galleryKeyIndex(key: string, current: number, length: number): number | null {
  if (key === "ArrowLeft") return galleryIndex(current, length, -1);
  if (key === "ArrowRight") return galleryIndex(current, length, 1);
  if (key === "Home") return 0;
  if (key === "End") return Math.max(0, length - 1);
  return null;
}

export function gallerySwipeIndex(startX: number, endX: number, current: number, length: number, threshold = 45): number {
  const distance = startX - endX;
  if (Math.abs(distance) < threshold) return current;
  return galleryIndex(current, length, distance > 0 ? 1 : -1);
}

export function galleryReducer(state: GalleryState, action: GalleryAction): GalleryState {
  if (action.type === "open-lightbox") return { ...state, lightboxOpen: true };
  if (action.type === "close-lightbox") return { ...state, lightboxOpen: false };
  const length = Math.max(0, action.length);
  if (action.type === "select") return { ...state, selected: Math.min(Math.max(0, action.index), Math.max(0, length - 1)) };
  return { ...state, selected: galleryIndex(state.selected, length, action.type === "previous" ? -1 : 1) };
}

const labels = {
  en: { open: "Open image in full screen", close: "Close full-screen image", previous: "Previous image", next: "Next image", dialog: "Full-screen image viewer" },
  fr: { open: "Ouvrir l'image en plein écran", close: "Fermer l'image en plein écran", previous: "Image précédente", next: "Image suivante", dialog: "Visionneuse d'image en plein écran" },
} as const;

type ImageGalleryProps = {
  images: PublicImage[];
  title: string;
  fallback: string;
  photosLabel: string;
  preload?: boolean;
  sizes?: string;
  variant?: "default" | "portfolio";
  locale?: "en" | "fr";
  thumbnailLimit?: number;
};

export function ImageGallery({ images, title, fallback, photosLabel, preload = false, sizes = "(max-width: 720px) calc(100vw - 32px), 1180px", variant = "default", locale = "en", thumbnailLimit }: ImageGalleryProps) {
  const [state, dispatch] = useReducer(galleryReducer, { selected: 0, lightboxOpen: false });
  const touchStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lightboxPanel = useRef<HTMLDivElement>(null);
  const dialogTitleId = useId();
  const portfolio = variant === "portfolio";
  const text = labels[locale];

  useEffect(() => {
    if (!state.lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [state.lightboxOpen]);

  if (!images.length) return <div className="marketplace-gallery marketplace-gallery-empty"><div className="marketplace-gallery-main"><MarketplaceImage src={null} alt="" fallback={fallback}/></div></div>;

  const activeIndex = Math.min(state.selected, images.length - 1);
  const active = images[activeIndex];
  const imageAlt = active.alt || `${title} — ${activeIndex + 1}`;
  const galleryClass = portfolio ? "marketplace-gallery marketplace-gallery-portfolio" : "marketplace-gallery";
  const showPosition = portfolio || images.length > 1;
  const allThumbnailIndexes = images.map((_, index) => index);
  const limitedThumbnailIndexes = thumbnailLimit && thumbnailLimit > 0 && images.length > thumbnailLimit
    ? activeIndex < thumbnailLimit
      ? allThumbnailIndexes.slice(0, thumbnailLimit)
      : [...allThumbnailIndexes.slice(0, Math.max(0, thumbnailLimit - 1)), activeIndex]
    : allThumbnailIndexes;

  function closeLightbox() {
    dispatch({ type: "close-lightbox" });
    requestAnimationFrame(() => openButton.current?.focus());
  }

  function navigate(type: "previous" | "next") {
    dispatch({ type, length: images.length });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const nextIndex = galleryKeyIndex(event.key, activeIndex, images.length);
    if (nextIndex == null) return;
    event.preventDefault();
    dispatch({ type: "select", index: nextIndex, length: images.length });
  }

  function handleLightboxKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); closeLightbox(); return; }
    if (event.key === "Tab") {
      const controls = Array.from(lightboxPanel.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    handleKeyDown(event);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStart.current = event.touches[0]?.clientX ?? null;
    didSwipe.current = false;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStart.current == null) return;
    const nextIndex = gallerySwipeIndex(touchStart.current, event.changedTouches[0]?.clientX ?? touchStart.current, activeIndex, images.length);
    didSwipe.current = nextIndex !== activeIndex;
    touchStart.current = null;
    if (didSwipe.current) dispatch({ type: "select", index: nextIndex, length: images.length });
  }

  function openLightbox() {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    dispatch({ type: "open-lightbox" });
  }

  return <section className={galleryClass} aria-label={photosLabel} onKeyDown={handleKeyDown}>
    <div className="marketplace-gallery-main" onTouchStart={portfolio ? handleTouchStart : undefined} onTouchEnd={portfolio ? handleTouchEnd : undefined}>
      {portfolio ? <>
        <div className="marketplace-gallery-backdrop" aria-hidden="true"><MarketplaceImage src={active.url} alt="" fallback="" sizes={sizes}/></div>
        <button ref={openButton} className="marketplace-gallery-open" type="button" onClick={openLightbox} aria-label={`${text.open}: ${imageAlt}`}>
          <MarketplaceImage src={active.url} alt={imageAlt} fallback={fallback} sizes={sizes} preload={preload}/>
        </button>
      </> : <MarketplaceImage src={active.url} alt={imageAlt} fallback={fallback} sizes={sizes} preload={preload}/>}
      {portfolio && images.length > 1 && <>
        <button className="marketplace-gallery-control marketplace-gallery-previous" type="button" onClick={() => navigate("previous")} aria-label={text.previous}><span aria-hidden="true">‹</span></button>
        <button className="marketplace-gallery-control marketplace-gallery-next" type="button" onClick={() => navigate("next")} aria-label={text.next}><span aria-hidden="true">›</span></button>
      </>}
      {showPosition && <span className="marketplace-image-count" aria-live="polite">{activeIndex + 1} / {images.length}</span>}
    </div>
    {images.length > 1 && <div className="marketplace-thumbnails" aria-label={photosLabel}>
      {limitedThumbnailIndexes.map((index) => { const image=images[index]; return <button className={index === activeIndex ? "marketplace-thumbnail marketplace-thumbnail-active" : "marketplace-thumbnail"} type="button" key={`${image.url}-${index}`} onClick={() => dispatch({ type: "select", index, length: images.length })} aria-label={`${index + 1} / ${images.length}`} aria-pressed={index === activeIndex}>
        <MarketplaceImage src={image.url} alt="" fallback={fallback} sizes="120px"/>
      </button>;})}
    </div>}
    {portfolio && state.lightboxOpen && <div className="marketplace-lightbox" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} onClick={closeLightbox} onKeyDown={handleLightboxKeyDown}>
      <h2 className="sr-only" id={dialogTitleId}>{text.dialog}: {title}</h2>
      <div ref={lightboxPanel} className="marketplace-lightbox-panel" onClick={(event) => event.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="marketplace-lightbox-backdrop" aria-hidden="true"><MarketplaceImage src={active.url} alt="" fallback="" sizes="100vw"/></div>
        <div className="marketplace-lightbox-image"><MarketplaceImage src={active.url} alt={imageAlt} fallback={fallback} sizes="100vw"/></div>
        <button ref={closeButton} className="marketplace-lightbox-close" type="button" onClick={closeLightbox} aria-label={text.close}><span aria-hidden="true">×</span></button>
        {images.length > 1 && <>
          <button className="marketplace-gallery-control marketplace-gallery-previous" type="button" onClick={() => navigate("previous")} aria-label={text.previous}><span aria-hidden="true">‹</span></button>
          <button className="marketplace-gallery-control marketplace-gallery-next" type="button" onClick={() => navigate("next")} aria-label={text.next}><span aria-hidden="true">›</span></button>
        </>}
        <span className="marketplace-image-count" aria-live="polite">{activeIndex + 1} / {images.length}</span>
      </div>
    </div>}
  </section>;
}
