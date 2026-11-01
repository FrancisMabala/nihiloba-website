# Services marketplace and professional storefront — 1 November 2026

## Previous release deployed

Templates backend `878f539e73b4c84874a6e5dd654efc889a88445b` was verified Live before website `142691afecb96443ddf210969b99c0d93f0f8689` was deployed and verified Live in Render. Both main SHAs were verified against the remote. Signed-in Templates loaded successfully without production mutations. GitHub combined-status returned no status entries; this is not a claim that CI passed. No migration was needed; urgent WhatsApp templates were not changed.

## Architecture audit

Services already had a public collection/detail API, canonical professional profiles, safe DTO parsers, service packages, image gallery, public availability, quote entry and provider-level reviews. This change extends that shared architecture rather than adding a parallel catalog, booking engine, identity system or reviews database.

## Phase 1 — shared discovery backend

Backend feature `feature/services-marketplace-20261101` adds `mode=professionals` to the existing collection. Eligible service rows are grouped by canonical profile before counting/paging. Category/text/location filters use the same underlying query as service discovery. A profile is shown once, with its eligible services count and actual provider rating. Invalid modes are rejected. Private fields remain excluded. Conflicting foreign account city and recorded Kinshasa service commune are no longer concatenated in public display.

## Phase 2 — discovery and professional storefront

The compact homepage has no hero photograph. Services and Professionals have distinct results, persistent filters, counts and pagination. The seven canonical categories share a card implementation with category icons and accents; repair/professional services can link to a supported quotation action. Cards show actual prices and duration only. Missing photos use icons/initials. Beauty uses actual treatment imagery when available; legal/general professional services retain neutral scope and identity wording. No category grants a credential or verification claim.

Storefronts group all eligible services under the professional identity, with Services, About and Customer reviews sections. Public workplace details remain consent-controlled. Reviews reuse existing professional-level eligibility and anonymized output, not invented per-service ratings. Loading failure is distinguished from no reviews.

## Phase 3 — service detail and continuity

The actual-image gallery sits beside the booking controls on desktop and stacks on mobile. The existing package selector, selected package reference, duration/price, branch choice and availability panel are reused. The quotation link only appears when the backend enables requests. Appointment links are created from canonical selected slots; stale times fail safely. Flexible services still explain that the provider confirms the requested time. No appointment or payment is inferred from a click.

## Files and components

Changed application files: `app/components/shida/services.tsx`, `services-public.css`, `app/services/shida/public-client.ts`, `app/types/shida-public.ts`. Reused: MarketplaceDiscoveryHeader, MarketplaceBreadcrumb, MarketplaceImage, ImageGallery, ActiveSearchFilters, ServiceOptionSelector, ServiceAvailabilityPanel, ServiceBranchChoice and existing localization/path helpers. Test-only fixture and Playwright configuration changes are not imported by production code.

## Validation

- Backend: 74 public marketplace/privacy/profile/work tests, 157 booking/schedule/calendar tests, and 1 HTTP mode validation test passed.
- Frontend: 35 focused marketplace/quotation gateway/support tests passed.
- Browser: 14 journeys covering widths 360, 390, 768, 1024, 1440; EN/FR/LN/SW; distinct identity results; beauty/legal profiles; empty/error states; selected package references and price/duration; stale slot rejection and valid opaque WhatsApp handoff.
- Production webpack build including TypeScript passed; scoped ESLint and diff checks passed.
- Actual application screenshots were inspected at desktop/mobile widths. Fixture photos are supplied by the browser test from an existing local marketing asset solely to exercise image layout. They are not professional identity data and never enter production.

## Limits and deployment

No schema/migration, new review architecture, new business policy or production fixture records. Location filters retain existing account/Organization city semantics; this task does not invent geocoded service coverage. Professional search uses existing public identity/service/category/area fields, not arbitrary private descriptions. Reviews show the existing bounded first page. Personal capacity, Organization permissions, and exact ownership are unchanged.

The new marketplace release is committed on feature branches, not deployed. The supplied brief requires specific production authorization. Deploy its backend before website after approval. Rollback to Templates backend `878f539e` and website `142691a`; no database rollback required. Live account smoke checks for the new marketplace remain a post-authorization step.
