import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImageGallery, galleryKeyIndex, galleryReducer, gallerySwipeIndex, type GalleryState } from "../app/components/shida/image-gallery";

const portrait = { url: "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/services/portrait.jpg", alt: "Portrait makeup portfolio" };
const landscape = { url: "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/services/landscape.jpg", alt: "Landscape makeup portfolio" };
const initial: GalleryState = { selected: 0, lightboxOpen: false };

function render(images = [portrait, landscape]) {
  return renderToStaticMarkup(<ImageGallery images={images} title="Professional makeup" fallback="Image unavailable" photosLabel="Service photos" variant="portfolio" locale="en"/>);
}

describe("service portfolio image gallery", () => {
  it("renders portrait and landscape images in the isolated, non-cropping portfolio gallery", () => {
    const html = render();
    expect(html).toContain("marketplace-gallery-portfolio");
    expect(html).toContain("marketplace-gallery-backdrop");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("portrait.jpg");
    expect(html).toContain("landscape.jpg");
    expect(html).toContain("Open image in full screen");
  });

  it("keeps a single image useful without redundant navigation", () => {
    const html = render([portrait]);
    expect(html).toContain("1 / 1");
    expect(html).toContain("Open image in full screen");
    expect(html).not.toContain("Previous image");
    expect(html).not.toContain("marketplace-thumbnails");
  });

  it("renders position, thumbnails, and clear previous/next controls for multiple images", () => {
    const html = render();
    expect(html).toContain("1 / 2");
    expect(html).toContain("marketplace-thumbnails");
    expect(html).toContain('aria-label="Previous image"');
    expect(html).toContain('aria-label="Next image"');
    expect(html).toContain('aria-pressed="true"');
  });

  it("can limit initial thumbnails while preserving the full gallery count", () => {
    const images = Array.from({ length: 6 }, (_, index) => ({ ...portrait, url: `${portrait.url}?image=${index}` }));
    const html = renderToStaticMarkup(<ImageGallery images={images} title="Portfolio" fallback="Fallback" photosLabel="Photos" variant="portfolio" thumbnailLimit={4}/>);
    expect(html).toContain("1 / 6");
    expect((html.match(/<button class="marketplace-thumbnail/g) || [])).toHaveLength(4);
  });

  it("selects thumbnails and wraps previous/next navigation", () => {
    const selected = galleryReducer(initial, { type: "select", index: 1, length: 3 });
    expect(selected.selected).toBe(1);
    expect(galleryReducer(initial, { type: "previous", length: 3 }).selected).toBe(2);
    expect(galleryReducer({ ...initial, selected: 2 }, { type: "next", length: 3 }).selected).toBe(0);
  });

  it("supports arrow, Home, and End keyboard navigation", () => {
    expect(galleryKeyIndex("ArrowRight", 0, 3)).toBe(1);
    expect(galleryKeyIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(galleryKeyIndex("Home", 2, 3)).toBe(0);
    expect(galleryKeyIndex("End", 0, 3)).toBe(2);
    expect(galleryKeyIndex("Enter", 0, 3)).toBeNull();
  });

  it("supports mobile swipes while ignoring short accidental movement", () => {
    expect(gallerySwipeIndex(300, 180, 0, 3)).toBe(1);
    expect(gallerySwipeIndex(180, 300, 0, 3)).toBe(2);
    expect(gallerySwipeIndex(300, 280, 1, 3)).toBe(1);
  });

  it("opens and closes the accessible lightbox state", () => {
    const opened = galleryReducer(initial, { type: "open-lightbox" });
    expect(opened.lightboxOpen).toBe(true);
    expect(galleryReducer(opened, { type: "close-lightbox" }).lightboxOpen).toBe(false);
  });

  it("locks the sharp image to contain, uses 4:5 thumbnails, and bounds common viewport heights", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toMatch(/marketplace-gallery-open img[^}]*object-fit:\s*contain/);
    expect(css).toMatch(/marketplace-lightbox-image img[^}]*object-fit:\s*contain/);
    expect(css).toMatch(/marketplace-gallery-portfolio \.marketplace-thumbnail[^}]*aspect-ratio:\s*4\s*\/\s*5/);
    expect(css).toMatch(/height:\s*clamp\(360px,68svh,700px\)/);
    expect(css).toContain("@media (max-width: 720px)");
    expect(css).toContain("@media (max-height: 520px) and (orientation: landscape)");
  });
});
