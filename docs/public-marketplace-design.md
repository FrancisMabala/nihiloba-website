# Shared public marketplace design

Services, Wenze, Employment, Restaurants & Malewa, Apartments and Hotels use the same public collection design, based on the Services and Wenze references.

## Design and behavior

- `PublicMarketplaceHero` provides the shared split header, serif title, introductory text, discovery link and rounded illustration.
- `public-marketplace.css`, scoped to `.marketplace-public`, provides the cream canvas, consistent width and spacing, search panels, category chips, result headings, cards and closing sections. The layout stacks on phones and uses two or three result columns where space allows.
- Marketplace-specific filters, pagination, detail links, seller links and application flows remain available. Services category selection is also available in the expanded filters; Apartments city search is visible in the primary row.
- Hotels now support keyword and city search over the existing public hotel collection. Values are bounded to 120 characters; matching ignores case and accents. Counts reflect the displayed matches. No new backend search or booking contract is introduced.
- English and French are supported throughout. Restaurants also retain Lingala and Swahili, including their language selector and result-return context.
- The apartment illustration is a 1200-pixel WebP derivative of the existing housing artwork (240,080 bytes, down from 2,249,752 bytes). It is already optimized and served directly; other heroes use the Next image optimizer.

The shared style scope is applied to public collections only. Item, business, employer, provider, owner and private account pages are not redesigned here. Transport has no public collection route and is not introduced by this change.

## Verification

- Production build and TypeScript checks pass.
- Targeted lint checks pass for the shared components, property pages, restaurant collection, hotel routes and hotel search tests.
- Selected marketplace tests: 256 passed, 3 failed out of 259. The same three Wenze shop-detail assertions fail against the committed Wenze implementation: the product-count wording, legacy shop-label class and long-description disclosure expectations. The shop-detail and product implementation is unchanged by this work.
- Browser checks use isolated synthetic public fixtures, with no live bookings, purchases, applications or seller mutations. Desktop and phone checks cover all six collections in English and French; restaurant checks also cover Lingala and Swahili. Search/reset, category selection, apartment pagination context, employment offer types, restaurant language/context retention and empty/unavailable states were inspected.
- The restaurant discovery browser test now checks the responsive shared hero instead of the superseded compact-heading requirement.

## Release

This is a website-only change. No database migrations, new environment variables or backend deployment are required. Hotels collection routes read search parameters dynamically while retaining the existing cached public hotel fetch. Deploy through the normal website build process after release authorization.
