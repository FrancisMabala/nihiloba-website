# Meda visual refinement — 17 November 2026

This release implements the approved desktop/mobile board using SHIDA's existing
cream/green palette, serif headings, illustrated marketplace hero, invitation-card
pattern, outlined SpaceIcon system, account shell and country-reference API.

## Delivered behavior

- Compact Meda introduction with the constant Lingala slogan, supporting copy in
  FR/EN/LN/SW and the supplied decorative illustration, hidden below 768 px.
- Route search accepts city names or recognizable country names; country selection
  maps to existing API codes. Category chips, available/requested space, departure
  date, active criteria and reset retain real filtering and refresh behavior.
- Listing cards show actual route, departure, capacity, pricing basis and side.
  Unknown capacity/price remain explicit. One sage invitation appears after the
  first result on mobile and alongside the first two cards on desktop.
- Signed-out access, authenticated empty results, unmatched searches and failures
  are distinct. Restricted listing data is never fetched for the signed-out UI.
- Mes annonces retains all filters, counts and its creation action. Four balanced
  creation choices include Meda; owner rows display status and related enquiry
  counts, management/draft actions and enquiry links. Meda has owner pagination.
- Private enquiries use the existing account Messages area. Legacy Meda links
  redirect to the exact listing or conversation without a second private inbox.
  Conversations show a compact journey summary, preserving photos, messages,
  acknowledgements, agreements, read status and actions.
- The homepage includes Meda in a responsive four-column desktop marketplace grid.
  Payment remains arranged between users; the short discovery safety reminder and
  expandable transport/payment/support explanation preserve existing policy.

## Asset and navigation

`public/images/marketplace-heroes/meda.png` is an unchanged copy of the supplied
1536 × 1024 RGBA image. SHA-256:
`2d475937a87ab93b901440c9d944e0908a32b515e111b752ac877b3db1e26d62`.
It preserves aspect ratio/transparency, uses empty alternative text in the shared
decorative art wrapper, and renders approximately 280–320 px wide on larger screens.

`medaDestination` centralizes localized routes:

| Action | Account destination |
| --- | --- |
| Own listings | `shida/space/?view=listings&tab=meda` |
| Create/manage | Same route with `meda_view=create` or `review&ref=…` |
| Enquiries | `shida/space/?view=messages&market=meda&meda_view=enquiries` |
| Conversation | Same messages route with `meda_view=conversation&ref=…` |

Existing notification/WhatsApp URLs remain valid through the legacy redirect.
Authentication keeps the intended destination. Actor-bound remounting, private
gateways and agreement-stage warnings remain in place; login does not grant owner
or participant access. No authentication or WhatsApp delivery policy was changed.

The only backend change is a batched owner-only enquiry count plus owner-list total
in `mine()`. It supports accurate rows/counts without per-listing requests. Counts
include closed enquiries and are absent from public/other-member projections.
Backend release: `f3248d7780f2d8659d3c1f4012fa04330e4e5774`, pushed to main and verified
live on Render deployment `dep-dbuck1jl550s73d9k910` at 21:44:27 UTC.
This visual release adds no database migration. The preceding participation release
already applied `0252_meda_participation`; the later restaurant migration belongs to
its separate release, not this task.

## Validation and evidence

- Production build and TypeScript check passed on the final application sources.
- Focused frontend lint passed without warnings/errors; 71 tests in nine affected
  unit/gateway/navigation/discovery suites passed.
- 42 browser cases passed using synthetic gateway fixtures: FR/EN/LN/SW at 360,
  390, 430, 820 and 1440 px; long routes; access/error/empty states; search/reset/date
  handling; account entry/refresh; exact legacy conversation links; keyboard focus;
  and action reachability in a short viewport. The scroll assertion waits for the
  existing smooth-scroll animation before measuring bottom-navigation clearance.
- Focused backend runner: 25 passed, zero skipped, using isolated SQLite. Report:
  `logs/platform-validation/aa17dc3ba91c4f0a88759c1eed395dbc` in the backend checkout.
  The full backend suite was intentionally not run for this visual task.
- Three real-backend browser cases passed on the final build using disposable local
  SQLite data: two-user photos/agreement/closure/privacy/account switching;
  anonymous access denial; and Mes annonces container draft/back navigation/
  explicit publication. This is separate from mocked visual evidence and does not
  claim PostgreSQL concurrency coverage or real external-provider delivery.

Desktop/mobile screenshots in [evidence/meda-visual](evidence/meda-visual) cover
results, signed-out access, empty/no-match/error states, Mes annonces and homepage.
These use synthetic fixtures; they are not evidence of production listings.
Full-page mobile screenshots show fixed navigation at the capture viewport's edge;
the browser reachability check separately verifies scrolling actions above it.

Physical-device virtual keyboards, human linguistic review and live WhatsApp or
media-provider delivery are not claimed by these browser checks. Sixteen-pixel
mobile inputs and a short-viewport test reduce keyboard/zoom risks. No synthetic
listing or message was created in production.

Existing compatible Node/Python dependencies were reused, without installation or
manifest changes. Validation ran in the existing isolated dependency snapshot
`C:/Users/mabal/AppData/Local/Temp/shida-meda-final-lrezq0u1`, with source hashes
checked against this checkout. The already-public restaurant commit `62e29d37`
was incorporated before the final build; it is not part of this visual task.
The snapshot, screenshots and focused validation logs remain for reuse/evidence.
Unrelated dirty checkouts and unfinished Ecole work were preserved.

Final local logs: `C:/NIHILOBA/meda-visual-release-build.log`,
`meda-visual-release-unit-lint.log`, `meda-visual-release-browser-final.log` and
`meda-visual-backend-tests.log`. Hosted CI and production deployment are reported
separately from these local checks in the release handoff.
