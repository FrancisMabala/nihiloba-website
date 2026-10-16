# Reusable pickup and delivery schedules

15 October 2026 — **Partial**. Local implementation only. No deployment, production rollout switch, commit or push.

## Before and after

The previous dated pickup/delivery periods required daily renewal and ordinary customer options rejected a period as soon as it started. Opening hours could not substitute for fulfillment settings. The prior [receiving handoff](restaurants-receiving-2026-10-15.md) and its before/after captures are retained.

Receiving orders now offers an independent weekly schedule for each method, split periods and next-day endings. Tomorrow is opt-in; today is the default. Saved schedules, drafts awaiting review, and current server-generated customer choices are separate. Today and tomorrow have separate expandable lists in establishment-local time. Closures and pauses remain visible, and SHIDA restrictions remain prominent even when a seller saves an enabled preference behind a closed rollout gate.

The new [evidence directory](evidence/restaurant-schedules-2026-10-15) contains saved and review screenshots for FR/EN/LN/SW at 360, 820 and 1440 px. Automated overflow checks passed. Representative phone, tablet and desktop views were visually inspected; human language and physical-device acceptance are still open.

## Contract and authority

The existing protected `pickup-intake` and `delivery-intake` PUT APIs accept an optional `schedule`, with `windows: []`. The schedule contains `weekly_periods: [{weekday,start,end}]` (Monday = 0), `minimum_lead_minutes`, `cutoff_minutes` and `allow_tomorrow`. It uses the existing exact-establishment manager authorization, parent lock, `expected_updated_at`, operation-key ledger and transaction boundary. The new `restaurant_schedules` table stores a separate revision and establishment time zone for each method. Saved configuration reads return `schedules`, existing hours/closures and advisory customer windows.

Validation bounds: 1–28 nonoverlapping weekly periods, including Sunday-to-Monday overlap; periods last at least 15 minutes and less than 24 hours. End before start means next day. Lead and cutoff are integer minutes, 0–1440, each shorter than every configured period. No type of establishment determines either value. Delivery coverage, exact fee/currency rules and publication/address checks retain their existing authority.

The resolver offers concrete 15-minute intervals anchored to the service period's start. A customer choice must start strictly after now and at least the chosen lead time from now. Cutoff is measured backwards from the repeating period's end: with a 14:00 end and 30-minute cutoff, new orders stop at 13:30. Started periods continue supplying eligible later intervals. Yesterday's overnight period can contribute today's intervals; only today and explicitly enabled tomorrow may be selected. No daily materialization, worker or cron is needed.

Opaque references bind establishment, method, schedule revision, zone and concrete start. They remain stable between reads; they are looked up against newly generated server choices, never trusted as client-supplied dates. Nonexistent or ambiguous DST endpoints fail closed for that occurrence. A changed establishment time zone requires a fresh schedule save; it cannot silently reinterpret existing weekly settings. Exceptional closures are intersected exactly (including sub-minute boundaries), with existing opening-hours behavior retained: known closed-now hours block new ordering; unknown hours are not an invented prohibition.

Website, WhatsApp and Guest QR use the same resolver. Quote and submission recheck the latest schedule under the establishment lock alongside existing rollout, publication, food/stock, ownership, coverage and quote rules. The Website's authenticated refresh-options endpoint additionally enforces the Website rollout gate. Counter and table gating has no new seller switch.

Submitted terms snapshot the chosen interval, zone, schedule revision, lead time, cutoff and horizon policy inside the existing immutable order terms. Schedule edits and pauses do not rewrite accepted orders or cancel their commitments. Pending recurring orders do not reapply new-booking lead time at acceptance, but still recheck the current schedule revision, pause, opening hours, closures, public pickup address or delivery coverage. Existing response deadline, item validation, stock reservation and acceptance mechanisms remain. A schedule never itself accepts an order. Guest QR auto acceptance continues through its existing setting and reservation path.

WhatsApp choices are paginated to remain within interactive limits. When a selected time disappears, recheck returns to current fulfillment choices with the conversation and food retained. Website quote/submit conflicts refresh the current times and require a new choice while retaining the basket and delivery input. Uncertain submission retries retain the original envelope. Seller save retries retain the identical serialized payload/key; stale revisions retain edits but require refresh and a fresh review.

Legacy dated windows remain usable until a seller explicitly reviews and saves a weekly schedule. There is no automatic recurrence backfill. Old enabled dated writes cannot silently replace an existing weekly schedule. Existing pause paths remain supported. Weekly schedule editing is in the Personal Website workspace; this batch does not add a second WhatsApp seller schedule editor.

## Verification

| Check | Exact result |
| --- | --- |
| Website unit focus: schedule, receiving, checkout, orders | 23 passed across 4 files |
| Production build and TypeScript | Pass |
| Changed-file ESLint | Pass |
| Production browser: intake-window, receiving, schedules | 32 passed in 1.4 minutes |
| Final production browser: schedules and checkout | 16 passed in 39.3 seconds; includes unavailable time, committed disconnect and unreceived submission recovery |
| Backend legacy intake-window regression | 152 passed in 394.64 seconds |
| Backend schedule/receiving/Guest QR combined diagnostic | 61 passed, 1 failed in 256.02 seconds; failure was duplicate migration number, subsequently corrected |
| Migration + HTTP + Website refresh gate + delivery-adapter focused rerun | 7 passed, 52 deselected in 24.27 seconds |
| Final full schedule suite | 37 passed in 140.30 seconds |
| Final acceptance/pause, pickup/delivery commitment and Guest QR focus | 8 passed, 31 deselected in 23.83 seconds |

The migration check caught an existing Services `0164`; only the new Restaurant migration was moved to **0165**, following 0164. Migration tests compile PostgreSQL DDL and apply the additive table to a disposable SQLite schema without backfilling or modifying existing rows. The final sole head is 0165. A full production-like PostgreSQL upgrade and concurrency run remain staging gates.

Other corrected diagnostic issues: the first Website unit test used the wrong validator call signature; the first browser run used an exact label that included helper text (inputs now have explicit accessible names); changed-file lint exposed pre-existing synchronous session restoration in checkout, now deferred with unmount protection. These failures are not hidden or skipped.

Backend tests use the repository venv, `PYTHONDONTWRITEBYTECODE=1`, `-p no:cacheprovider` and disposable databases under Website `tmp/`. The final `fresh.db` filename enables the repository's complete disposable-fixture cleanup. No production database was used. Browser runs use synthetic identities and local production preview; checkout SSR uses the opt-in network-isolated fixture loader.

The simulated solo-seller journey saves lunch and evening/overnight service once, orders during started lunch, checks cutoff and midnight, pauses service, preserves accepted promises, resumes availability on the next day and repeats the following week without another schedule write. The unchanged schedule revision proves daily re-entry is unnecessary. This automated journey is not a claim of a human full-day or real-phone acceptance run.

Full suites were not rerun. Historical broader Website and Backend failures in the receiving/settings handoffs remain unresolved, including obsolete C1-E navigation/amount assertions. Local focused success does not reclassify those gates.

## Migration and release handoff

When deployment is separately authorized: apply existing Services 0164 and additive Restaurant 0165 first; release the Backend model/resolver/API next; then release the Website consumer. Preserve the schedule table on rollback; do not restore old Backend writers after schedules are enabled without a reviewed compatibility plan. There are no new dependencies, environment variables, cron jobs, workers, payment paths, role grants or Meta templates.

Changed Website areas: receiving editor and localization/validation, protected intake contract/types, checkout recovery/local-time display, focused unit/browser checks. Changed Backend areas: order models, additive migration, shared schedule service, protected HTTP/configuration/options, pickup/delivery submission/acceptance adapters, Guest QR options and WhatsApp pagination/reselection. No Business frontend or shared role infrastructure changed.

Release trackers retain **Partial**, under `SCH01` and pilot evidence `S34`. Required open gates: matched authenticated staging, production-like PostgreSQL migration/concurrency, a real WhatsApp phone and Meta delivery behavior, physical phones/tablets, keyboard/assistive-technology acceptance, human FR/EN/LN/SW review, a human full-day solo-seller journey and a frozen-tree broader regression pass.

Suggested commit message (not executed): `feat(restaurants): add reusable pickup and delivery schedules`


## 16 October setup and foreground recovery update

Optional advance-order setup and automatic draft-preserving foreground reads now supersede the stale-only lifecycle described above. Exact behavior and current verification: [return lifecycle handoff](restaurants-return-2026-10-16.md). Historical counts remain evidence of their original runs.
