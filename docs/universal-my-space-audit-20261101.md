# Universal My Space: integration audit

## Existing architecture

`AccountSpace` restores the existing Personal session. `usePersonalActivityData`
loads authorized Wenze stores (including archived), restaurant pages, Services
offerings/capabilities and security navigation. Responses are bound to the session;
switching accounts discards stale results. Transactions, Messages and Account are
separate existing components and remain unchanged.

Wenze individual selling uses a private canonical store as a technical container.
That container is **not one advertisement or a boutique**. Listing totals must
come from product data, not store counts. Saved drafts have a separate lifecycle.
Services rows are grouped only by an explicit server-issued Professional Profile
reference. A profile with five offerings is one professional identity.

Security navigation discovers durable ownership for properties, hotel listings,
Wewa drivers and Jobs poster profiles. Its `markets` array reports presence, not
record counts. A poster profile does not establish how many jobs it published.
Never turn these indicators into numeric counters. Organization access is
calculated from active membership, module availability and permissions.

## Canonical entry points

- Boutiques, restaurants and Services retain their existing Personal seller routes.
- Individual listings open My Space `view=listings`; the selling page remains the
  canonical creation entry. Mixed accounts retain My Activities.
- Property publication uses the existing localized apartment-owner WhatsApp
  commands, also used by public discovery. It does not require a Business redirect.
- Hotel organization management belongs to `business.nihiloba.com`; the existing
  hotel-publication conversation handles onboarding. A navigation link grants no
  ownership or activation rights.
- Wewa provider entry uses the existing driver commands (`wewa on`, `chauffeur
  wewa`, `naza wewa`, `mimi ni boda`), never the customer `wewa` request command.
- Personal employment uses the existing employment menu; organizations use the
  shared Business Dashboard. Candidate profiles and applications are not offers.

## Implementation boundaries

Reuse the existing illustration, localization, shared header, account dropdown,
management tools and WhatsApp conversations. Keep unknown counts unknown and
partial failures visible; do not manufacture zero values or new management pages.
No authentication, financial, notification, ownership or enforcement changes are
needed for the navigation/visual phase. Urgent WhatsApp templates remain enabled.

## Remaining dependencies

Exact cross-market counts now use the authenticated `activity_counts` projection
from security navigation. Missing or invalid values remain unknown. Older backend
responses retain the previous known-card fallback, without invented counts.
The product-first four-step selling wizard, per-listing payment preferences/private
handoff and shared WhatsApp creation remain separate unfinished work. This audit
does not claim those features are implemented.

## Previous release

Website `5400f779f18d2cc78657f83ed5e874f48c0068ef` — Integrate individual listings
into account-aware My Space navigation — is verified Live in Render deployment
`dep-dbjphg8473hc73ai8kjg` on 1 November 2026. No backend or migration was deployed
for that checkpoint.

## Validated frontend phase

Adds a compact Overview with the shared Lingala slogan and only nonempty,
known shop/restaurant/professional counts. Individual selling containers are
excluded from boutique counts; offerings sharing an explicit professional
identity form one group. Detailed activity management stays in My Activities.
Existing property/hotel/driver/job presence exposes management links without
fabricated totals. Creation options are secondary for populated accounts.
Shared localized onboarding commands are reused by discovery and My Space.

Validation: 26 focused unit checks; scoped ESLint and TypeScript; production
webpack build; 56 browser scenarios (52 initially passed, four obsolete
single-group assertions corrected and all four rerun successfully). Coverage
includes account isolation, partial failures, pagination, mixed accounts,
four languages and widths 360, 390, 768, 1024 and 1440. Desktop and mobile
screenshots inspected. No production test records or schema changes.

This is the frontend phase, not completion of the outstanding aggregate API or
individual-selling wizard. Previous known-live rollback baseline: 5400f77.

## Canonical totals phase

Backend 7ff35b66 adds exact Personal management totals. Individual products are
separate from boutique containers; saved workflow drafts are excluded from the
product total. Canonical Professional Profiles count once regardless of offering
count. Jobs count actual offer records, never candidate profiles or applications.
Retained/inactive records remain manageable, and organization records are excluded.
The overview hides zero categories and sends categories without loaded cards
directly to their authorized management entry. No financial totals are inferred.

Validation: 22 focused backend checks and 27 browser scenarios passed. Browser
coverage includes exact totals at 390/1440 pixels, older-response fallback in four
languages at five widths, and individual/mixed/property/organization navigation.
Production webpack build passed against the isolated acceptance backend after
public API timeouts prevented the first build. Render will build using its normal
production configuration. No database migration or urgent-template change.
