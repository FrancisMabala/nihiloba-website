# Apartments progressive modernization

## Batch 2: factual safety information and private reporting

Apartment detail renders advertiser declarations separately from unrecorded
identity, property-evidence and independent checks. No property-verification
badge is invented. Reports reuse the Personal session/login provider and existing
support proxy. The bounded form reports actual persistence, errors and rate
limits, and unmounts on account change. No direct advertiser phone is exposed.
LN/SW detail and owner routes now preserve their supported locale.

Validation: 35 focused component/page/gateway tests; changed-file lint and full
TypeScript check; production Webpack build; 8 browser cases covering desktop and
mobile in FR/EN/LN/SW. The first browser run caught the old LN/SW route fallback;
all eight pass after correction. French desktop/mobile screenshots were inspected.
These are the safety-stage baseline, before the Batch 4 property redesign.
Browser records and report writes are isolated fixtures, never production data.

The default Turbopack build cannot resolve this checkout's shared dependency
junction outside its root. `next build --webpack`, documented by the installed
Next version, succeeds with the existing identical-lockfile dependency install.
No packages were installed. Backend migration 0221 is proposed, not deployed.
No push or production release is authorized by this task.

## Batch 3: web publication

`/shida/appartements/publier` and localized routes expose a three-step Personal
wizard: property facts, USD monthly rent/private photos, then review and explicit
publication. Discovery and My Space link to it. The existing Personal login is
reused; signing in precedes draft entry. Server drafts resume without browser
storage of private data. Account switching unmounts draft state and blob previews.
Stale writes show a refresh/retry path. Uploads first save field edits, preventing
rent loss. Failed files retain their retry operation until recovered or refreshed.
The backend also deduplicates repeated content across changed browser operations.

Photos use bounded uploads and authenticated private previews. The public photo
allowlist accepts only the exact Apartment proxy path. It bypasses the image
optimizer cache to preserve revocation. No arbitrary remote image host, external
redirect, identity-document upload or direct advertiser contact is introduced.

Backend revisions 0222/0223 are proposed and required before release. Fields not
supported by the existing rental contract (deposit, fees, lease conditions,
availability date and currency extensions) remain explicitly uncaptured. No legal
validity is asserted. Full privacy/security rollout gates remain to be completed.

Validation: 56 focused gateway/component/page tests, full TypeScript, changed-file
lint and Webpack production build passed. Sixteen browser checks exercise reports
and explicit publication in FR/EN/LN/SW at 390/1440 widths, including five uploads,
rent preservation and an unchecked final confirmation. A label-selector timeout
was corrected to use the select's accessible role. French review screenshots were
inspected; their repeated illustrative image is a browser fixture, not a listing
published to SHIDA. Real backend tests independently reject duplicate images.

## Batch 4 — compact public detail and cards
- Gallery and rent/visit panel now share the first desktop row; mobile stacks them.
- Reused keyboard/swipe/lightbox gallery, responsive sizes, primary preload and
  lazy secondary photos. Protected photos retain no-store delivery.
- Separate factual bedrooms, total rooms, floor area and declared amenities.
  Legacy unknowns remain unknown; no invented deposit, availability date or badge.
- Cards omit long descriptions; public advertiser navigation remains available.
- Existing React request cache keeps metadata and detail on one detail endpoint;
  no collection fetch, private documents, polling or owner-fetch waterfall added.
- 50 focused tests, lint, TypeScript, webpack build and 8 four-language browser
  cases passed. Initial two navigation regressions fixed before commit.
- French desktop/mobile screenshots inspected. Test imagery is an explicitly
  controlled illustration fixture, never an actual listing or production photo.
- Final small breadcrumb spacing adjustment included; final visual pass follows.

## Batch 5 — short private visit-interest form
Uses the existing Personal login, a bounded optional message/preferred timing and
optional occupants. Review precedes explicit submission. Reopening checks the
canonical request; retries cannot create duplicates. WhatsApp remains available.
No occupation, family status, financial documents or personal photos collected.
52 focused tests plus the five-test gateway recheck passed; lint, TypeScript and
webpack build passed. Eight browser cases passed (four languages, two widths).
French mobile review screenshot inspected; desktop/mobile evidence retained.

## Batch 6 — My Activities owner entry
My Activities now opens a private, no-index owner view with paginated properties,
interested people, shortlisting and recorded visit statuses. Scheduling links to
the existing SHIDA WhatsApp selection flow with clear instructions; it does not
claim web scheduling or expose personal phone numbers/addresses. Actual latest
visit status is also shown when an applicant reopens a request.
18 focused navigation/gateway tests, lint and TypeScript passed. The first gateway
fixture reused an already-consumed Response; corrected it to return fresh bodies.
Webpack build and eight owner browser cases passed. French mobile/desktop owner
screenshots inspected. The final applicant status wording change is typechecked;
final combined browser/build validation follows.
