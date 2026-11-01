# Appartements, Hôtels and Wewa discovery — 1 November 2026

## Scope and audit

Frontend-only refinement of existing public discovery pages, preserving their APIs, detail routes, authentication, permissions and WhatsApp conversations. Previous Jobs release `a3c761464ccf5d8116cf1bea995ff241f82aa6c1` was deployed and verified Live in Render before this implementation.

- Appartements uses `getApartments`, backend pagination/property types, keyword/city/area/rooms/price filters, public locality and availability. The public contract is monthly `rent`, not a general property-sale price. The invitation therefore offers rental publishing; no new sale policy or price period is inferred. Cards visually clamp long titles/descriptions without modifying source text or the full detail page.
- Hotels uses `getHotels`, the existing public room collection, backend area/room-count/rental-period filters and keyword/city search. There is no hotel-type taxonomy or review aggregate in this contract: unsupported type pills, review stars and availability promises are omitted. Room stock is not presented as live availability. Rates stay grouped by currency and period. Hourly rates now retain their translated unit; unknown period text is preserved rather than silently dropped.
- Wewa retains its existing `wewa` WhatsApp request. Only motorcycle/Wewa is represented; no invented car/minibus/truck filters, drivers, fares or bookings. Opening WhatsApp does not send a request. Driver onboarding enters existing `WEWA_DRIVER_ON_COMMANDS`, including its profile and activation checks.
- Inspected existing backend `app/services/conversation/{apartment_conversation,hotel_conversation,wewa_conversation}.py` and `public_marketplace_service.py` in the authorized Jobs backend checkout. Apartment publishing recognizes localized commands. Hotel publishing recognizes `publish hotel`/`publier hôtel` and preserves `active_business_id` and marketplace authorization; it is not a new web signup. LN/SW use the existing recognized English hotel command while displaying localized interface text. Hotel creation remains subject to the existing account context. No production records or WhatsApp messages were created during validation.

## Design and assets

- Shared compact hero and bottom invitation components, with green/purple/blue accents and permanent Lingala slogans in `app/lib/brand.ts` (`lang="ln"` regardless of interface language).
- EN/FR/LN/SW supporting text. Existing search controls and advanced filters retained; redundant cross-market links removed only from these landing pages. Detail breadcrumbs remain.
- Approved artwork extracted losslessly from the user-supplied 1536×1024 reference, not generated or substituted. Source: `codex-clipboard-8d91897f-c4c0-4fb7-bc57-64e5b2059375.png`. Crops (left, top, right, bottom): apartments `(355,62,486,138)`, hotels `(883,62,1000,140)`, transport `(1353,62,1512,141)`. Stored as decorative WebP assets under `public/images/marketplace-heroes/`. These are small original raster illustrations, not vectors; display sizes are restrained to limit enlargement. No screenshot text or sample listing is included in assets.
- Hotels has distinct unpublished, filtered-empty and failed-fetch states, with retry preserving search. Real returned records automatically render populated cards.

## Validation and release

Focused tests cover slogans/assets, real empty/error boundaries, search context, WhatsApp command separation and unlike hotel rate units. Browser fixtures are process-isolated under a random `.fixture.invalid` origin, never imported by the application. Desktop/mobile checks cover 360, 390, 768, 1024 and 1440 pixels and all four locales, including populated properties, populated/empty hotels and failures. Screenshots are written to `test-results/stay-*.png` and visually inspected. No production fixture data, applications, hotel registrations or transport requests are submitted.

Release checks: focused Vitest, scoped ESLint, Next production build and TypeScript, Playwright, and `git diff --check`. The existing external node_modules junction requires `next build --webpack` locally; Render uses its normal clean checkout build. No migration, backend release, secret, access-control or urgent WhatsApp-template change is required.

Deploy the validated website commit only. Correlate Render's Live state with the exact pushed SHA, then inspect all three live pages. Rollback target is the previously verified Jobs commit `a3c761464ccf5d8116cf1bea995ff241f82aa6c1`. Deployment evidence and final check counts are recorded in the task's local release report.
