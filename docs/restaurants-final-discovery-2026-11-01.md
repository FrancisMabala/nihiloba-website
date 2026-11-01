# Restaurants & Malewa final public discovery — 1 November 2026

## Architecture and scope
The existing public restaurants endpoint, server-side dish matching and restaurant menu endpoints remain authoritative. No backend schema, ordering, payment, moderation or notification changes. Urgent WhatsApp templates are unchanged.

Phase 1 adds a compact warm hero with the permanent Lingala slogan from `brand.ts`, a decorative native SVG meal (Fufu, Pondu, grilled fish), and localized supporting copy in EN/FR/LN/SW. The top seller action is replaced by a bottom restaurant/Malewa creation invitation.

Phase 2 combines real menu previews and establishments. Public results retain their restaurant reference; selection is revalidated with the existing single-item endpoint and opens the existing plate-choice dialog. No direct discovery-to-order mutation is introduced. Plate components, quantities, currencies, availability, restaurant-scoped storage, quote validation and idempotent order recovery are preserved. Opening hours are explicitly distinct from ordering availability.

Creation links preselect restaurant or Malewa only after the existing management API grants `create`. They do not grant permissions or create records automatically.

## Reused components and privacy
RestaurantPhoto, RestaurantPrice, RestaurantRevalidation, RestaurantRetry, ActiveSearchFilters, RestaurantGuest and MenuChoice are reused. Public parsers discard unrelated/private fields; general location displays only commune/city. Missing photography uses a neutral icon, never invented food images. No fabricated reviews, counters, favorites or menu categories are added.

## Search and limitations
Establishment search and dish search run independently. Type, city and opening-hours filters apply through existing endpoints. Supported establishment types are retained; unimplemented food taxonomies are not fabricated.
Dish discovery is a bounded selection: four establishments per page and at most three dishes per establishment. Search uses the existing server-side dish match query. Full menus remain available from every result. This is not a new globally ranked or exhaustive dish catalogue. Sections fail independently and expose retry/empty states.

## Validation
Focused unit checks cover parsing, request bounds, privacy, mismatched parent references, partial failures and later-page item selection, plus existing marketplace, menu, guest, seller and checkout regressions. Browser fixtures are isolated from production and cover four locales at 360/390/768/1024/1440 pixels, cross-restaurant basket isolation, plate composition, quantity changes, filters, errors, and authorized/denied creation entry. Existing checkout recovery tests use the current WhatsApp code-entry flow. Production build, TypeScript, targeted lint and whitespace checks are required before push.
Screenshots are generated in `test-results/restaurant-final/`; no fixture records are seeded in production.

## Rollback
Redeploy website commit `160e46c26c8e27ea847d6cd36bb9cb2b97f19085`. No database rollback or migration is required.

Validated: 114 focused unit tests and 33 distinct browser scenarios passed (affected failures corrected and rerun), production build including TypeScript, targeted ESLint, and git diff --check. Reviewed desktop and mobile screenshots; corrected narrow-screen section heading wrapping.
