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
