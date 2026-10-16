# Wenze boutique and cart presentation

All boutiques use the same compact identity header and product-first catalog. Nihiloba's cream, forest green, gold accents and serif headings are retained. The store story, address and fulfillment information follow the catalog; navigation links provide direct access. Products use portrait imagery, accessible private-favourite hearts and a two-column phone grid. Existing cart eligibility, variants, negotiation, reviews and buyer permissions are preserved.

The cart now has a compact heading, portrait thumbnails, clearer quantity controls, seller subtotals and a responsive order summary. Unselected fulfillment is labelled as calculated in WhatsApp rather than displaying a misleading zero delivery fee. Prices and totals remain backend-authoritative.

Research references: [COS catalog](https://www.cos.com/en-ww/women/view-all) and [Aesop shop](https://www.aesop.com/shop-all/), used as product-led catalog references rather than copied branding.

## Validation

- Production webpack build and TypeScript passed.
- 22 focused unit/gateway/cart tests passed.
- Five Chrome browser checks passed: mobile product prominence, cart quantity/removal and pending delivery, private favourites/follow/reviews, guest sign-in, and stale-cart recovery.
- Desktop and phone screenshots reviewed in `docs/evidence/wenze-premium/`. Cart screenshots intentionally exercise the missing-image fallback.
- Browser API mutations were mocked; the boutique catalog was read from the existing public test boutique. These catalog checks depend on that fixture remaining available.
- Focused ESLint and `git diff --check` run before commit.

## Release

Website-only change; no migration or new environment variable is required. Deploy the website through its normal release process after approval. No push is part of this task.

The public shop schema currently exposes no boutique image. The identity block therefore uses a monogram; adding seller-uploaded boutique imagery requires a separate schema/upload feature. Product images continue to use existing catalog data.
