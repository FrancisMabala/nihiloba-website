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

## Final website validation and recovery

Resuming a draft exposes unfinished photo uploads with a cancellation action.
Cancellation uses the existing private revision-checked removal route; it does
not publish the listing or delete the storage responsibility ledger. A browser
regression verifies resume, cancellation and the remaining minimum-photo gate.

Final production Webpack build and TypeScript passed. The combined browser run
passed 34 scenarios, followed by one new abandoned-upload recovery scenario.
Coverage includes four locales, 390/1440 widths, explicit publication, private
reports/interests/owner review and keyboard gallery open/navigation/close/focus.
The initial final run had three test-harness failures (two incomplete accessible
labels and a screenshot racing the wizard's focus frame); corrected and rerun.
French detail, creation review, interest review and owner screenshots were
inspected on desktop and mobile. Illustrative test fixtures are not real listings.

Full website suite: 879 passed, five failed, plus one collection error (116 files).
The five phase2-discovery assertions and services-account-navigation alias error
reproduce on the untouched starting commit 94ba2ac40937b8fbe7446046755c48dada04ee48.
They are recorded as pre-existing; this task does not claim a green full suite.
The task-owned old WhatsApp-publication-link assertion was updated for the web
creation entry and passes. Full logs and the isolated baseline comparison remain
in the task outputs. Changed-file lint and diff checks are required at commit.

Local production-build measurements with mocked API/images: one detail API fetch
per request shared by metadata and rendering; HTML 35,385 bytes; latest focused
rerun: 390px TTFB 26ms, DCL 342.6ms, FCP 528ms; 1440px TTFB 19.7ms, DCL 168.1ms,
FCP 192ms. Both gallery cases passed again after the preload lint correction. These are local
smoke measurements, not production or mobile-network benchmarks. No measured
pre-change timing baseline exists, so no latency improvement percentage is claimed.
The pre-existing React request cache is retained. Primary image preload, bounded
thumbnails and lazy secondary images are used; revocable private-photo delivery
bypasses optimizer caching. Real provider latency remains a release check.

No production migration, push or deployment. Tenant documents, reviewed leases,
electronic signing, general messaging and full Apartment Management remain absent.


## Deployment-readiness followup — 6 November 2026

This supersedes the earlier website test-failure status. All 889 Vitest tests
across 116 files pass. The default test config now resolves the same @ alias as
TypeScript; discovery assertions cover the current approved illustrated headers
and still verify localized public browsing and the Wewa handoff boundary.

Full lint has zero errors and ten pre-existing warnings (image optimization,
ref cleanup and unused test variables). Restaurant review loads update state in
resolved/rejected request callbacks; the CommonJS fixture uses the Node module
loader explicitly. No review authorization, ownership or payment rule changed.
Type checking and the production webpack build pass using the already-installed
Node 24.22.1. Node 22.12.0 is below this repository's declared >=22.13.0 engine;
no runtime or dependencies were installed. Webpack is required locally because
the reused node_modules directory is a junction outside the checkout.

The final Apartments production-build browser run passed all 35 cases, covering
EN/FR/LN/SW at 390/1440 px, private reports, explicit publication, minimal interest,
owner review, interrupted photo recovery and keyboard gallery interaction.
An earlier run stalled and was stopped; a retry exposed a capture-only scroll
race. The screenshot helper now waits for fonts/focus layout and disables scroll
anchoring before positioning the capture; behavioral assertions remain intact.
Final French mobile detail and desktop publication-review screenshots were
visually inspected. Images are controlled illustrative fixtures, not real listings.
One backend detail fetch serves metadata/rendering; measured local fixture HTML
is 35,385 bytes, TTFB 14/11.6 ms and FCP 232/200 ms (390/1440 px). These are not
production performance or before/after measurements.

Gitleaks 8.30.1 scanned all 350 existing commits. Two known fixed test credentials
in the historical isolated restaurant harness have exact commit/file/rule/line
exceptions in .gitleaksignore; no directories or general secret rules are ignored.
The resulting scan has zero findings. The harness disables dotenv and external
network access and creates disposable local data.

Production migrations, pushes/deployment, legal contracts and electronic signatures
remain on hold. Actual non-production storage-provider acceptance and an approved
photo-retention/reconciliation procedure remain release gates. SDK mocks and
browser fixtures do not establish live-provider acceptance. Backend final-suite
results are recorded separately in its modernization report and task outputs.


## Facts-only contract preview — 6 November 2026
The owner authorized a draft preview while reviewed legal materials remain absent.
My properties and requests now offers a preview for shortlisted applicants.
It is labelled in EN/FR/LN/SW as draft, pending legal review, not for signature.
It contains canonical listing facts and advertised rent, with no invented clauses
or assertion of agreed terms. Request/visit acceptance remains separate from
signing; OTPs, passkeys and an agreement click are not rental signatures.
The private gateway allowlists only GET contract-draft; signing/acceptance/execution
paths remain rejected. Backend authorization checks current exact ownership,
listing eligibility and applicant state. No signed/executed state or provider call
exists. Facts-only-v1 is replaceable and generated on demand, not a stored lease
archive, PDF or applicant-sharing workflow.

Pending signing requirements: lawyer-reviewed DRC template and terms, validated
provider, identity and document-version consent checks, signed provider callbacks,
immutable evidence/hash binding, retention/access/deletion policy, and legal and
technical acceptance. No dependency was added. Backend migration/Cloudinary rollout
and production deployment evidence are recorded separately.

Release-check recovery: the approved infrastructure workflow/isolated runner and
network-blocking test setup were present only on the earlier infrastructure
branch eacd8cf. Reused those specific files, preserving the current alias and
using Node 24 as validated locally. No unrelated branch history was imported.
GitHub CI has no production secrets or deployment job.
