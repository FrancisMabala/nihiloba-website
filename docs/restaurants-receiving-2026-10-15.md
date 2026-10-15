# Receiving orders — Personal Restaurant and Malewa

Implemented locally on 15 October 2026. Release remains **Partial**. No deploy, production intake change, commit or push. Pre-existing Services changes were left untouched.

## Rules verified and changes

The old configuration response exposed saved preferences and the establishment gate, but not the separate Website gate or effective availability. An enabled preference was insufficient evidence of readiness.

`require_intake` gates customer, counter, assisted/table and guest writers. Website orders additionally require `web_allowed`. No seller toggle overrides SHIDA restrictions; no independent counter/table toggle was added. Pickup and delivery remain separate saved configurations. Existing orders, reservations, bills, receipts, references and payment records remain accessible when new orders close.

The protected `order-configuration` response now adds an advisory `receiving` snapshot: evaluation time, time zone, current hours, in-person state, separate Website/WhatsApp states for each fulfillment method, reason codes and activation blockers. It reuses `counter_items`, `public_items`, `_current_public`, `hours` and `_window_valid`, under existing exact-establishment manager authorization. No private address or customer data is added. All original locked submission, ownership, inventory and availability checks remain authoritative.

The Website shows a prominent overall status and three service summaries, with links to profile, hours or Menu for seller-controlled blockers. Detailed forms appear only on Edit. Saved settings remain visible beside unsaved changes; method-specific Review precedes confirmation. Stale conflicts retain edits but require a fresh review. Uncertain retries retain the original serialized payload/key. Offline saves are disabled; failed saves/rereads never label a draft active. Snapshots become stale after 60 seconds, visibility changes or disconnection. An older Backend response without the new snapshot never produces a green readiness claim. Release the Backend extension before its Website consumer when deployment is later authorized.

There is no global seller pause contract. Paused pickup/delivery preferences do not pause in-person selling; the headline remains available when the counter can sell. If no path is available it says unavailable, without inventing an independent counter pause. Pickup pause uses the existing empty-window preservation path for unchanged/expired dates. Explicit valid period edits can still be saved. Confirmation explains when saved pickup periods are kept. Delivery retains its existing fee, coverage and window contract.

Weekly opening hours and dated fulfillment periods remain separate. New periods start later today and finish no later than tomorrow in the establishment's zone. Ordinary Website/WhatsApp pickup options reject already-started periods; eligible guest pickup retains the existing `allow_started` exception. Local dates, zone, next-day endings, expired/started periods and date bounds are displayed. Unknown hours are not presented as confirmed weekly hours or turned into an invented Backend prohibition.

Guest QR automatic acceptance remains a separate section: it applies to eligible submitted QR orders, subject to stock/confirmation conditions. Scanning does not submit an order, and auto acceptance does not open intake or fulfillment methods.

WhatsApp settings wording now identifies saved preferences and the SHIDA restriction's full scope. If a customer encounters closed intake or unavailable pickup/delivery, the existing conflict screen explains the change and offers recheck, preserving the basket, previous mode and selections. No replacement conversation engine, notification path, permission or payment rule was added.

## Language and visual checks

Titles: EN **Receiving orders**, FR **Recevoir des commandes**, LN **Koyamba bakomande**, SW **Kupokea maagizo**. Copy distinguishes saved preference, availability, submission and acceptance in all four languages. Human/native-speaker acceptance remains open.

The [evidence directory](evidence/restaurant-receiving-2026-10-15) contains twelve before and twelve after closed-gate captures, plus twelve ready/overnight captures: FR/EN/LN/SW at 360/820/1440 px. Automated checks assert no horizontal overflow. Representative phone/tablet/desktop images were visually inspected. Before captures used development; final after captures use the production build. Synthetic identities only. Previous Settings evidence was preserved; rerun Settings screenshots use this batch's directory.

## Exact validation

| Check | Result |
| --- | --- |
| Production build, TypeScript, changed-file ESLint | Pass |
| Focused Website units | 116 passed across six discovered files; execution count, not unique-contract count |
| Final production-preview Chrome | 52 passed in 1.6 minutes |
| Main Backend focus | 246 passed in 347.84 seconds |
| Additional table/assisted/guest and missing-time-zone focus | 7 passed, 84 deselected in 10.68 seconds |
| Changed Python syntax and translation keys | Pass; six touched keys occur once in each language catalog |
| Migration | None added; current sole head `0163` |
| Diff whitespace | Pass |

Backend tests used fresh disposable SQLite databases under Website `tmp/`, `PYTHONDONTWRITEBYTECODE=1`, and `-p no:cacheprovider`. Main files: `test_restaurant_receiving.py`, `test_restaurant_intake_windows.py`, `test_restaurant_intake_rollout.py`. Extra files: receiving, assisted and guest-visits, filtered with `-k 'table_submission or missing_timezone or intake'`. The actual table QR test quotes a basket, closes intake, then rejects submission. Counter/assisted creation, assisted submission, guest entry and four-language in-progress WhatsApp basket/revision preservation are covered. Existing order replay/history/receipt resolution tests remain green.

Final browser command: `npx playwright test -c playwright.restaurant.config.ts restaurant-receiving.browser.ts restaurant-receiving-captures.browser.ts restaurant-settings.browser.ts restaurant-intake-window.browser.ts`, against the local production server. Coverage: rollout closed, missing setup, pickup/delivery ready, expired and overnight windows, exceptional closure, pause, confirmation, stale save/review, identical uncertain retry, offline recovery, failed reread, exact-establishment denial and localized input-error retention.

The exploratory older combined C1-E run was **26 passed / 6 failed**: five cases time out on obsolete `Basic activity` navigation (four localized cases and delivery/statistics); one feed case expects an older literal amount projection. Delivery write assertions completed before its unrelated navigation failure. Those cases were not deleted or skipped; the standalone delivery preservation case passes. Initial implementation failures in handler placement, text selectors and render-time clock lint were corrected before final focused validation.

Full suites were not rerun. The prior Settings handoff records Website **730 passed / 8 failed** and broader Backend **2,763 passed / 58 failed / 21 skips**. These historical red results are not reclassified by this batch.

## Reusable schedule proposal and release gap

The current model suits a deliberately planned daily/pop-up service but is burdensome for a regular solo seller: daily renewal is required, and ordinary customer ordering loses each period once its start passes. A weekly opening schedule cannot substitute for fulfillment times. This remains a release usability gap.

Proposed bounded Backend contract, **not implemented or approved as new product policy**:

1. Independent revisioned pickup/delivery schedules: `{timezone_name, weekly_periods:[{weekday,start_local,end_local,end_day_offset:0|1}], date_overrides:[{local_date,closed,periods}], expected_revision, operation_key}`. Keep current fee/coverage authority. Agree bounds/retention before implementation.
2. Generate concrete dated options server-side with stable opaque references bound to method, schedule revision, zone and start/end. Snapshot selected terms into orders; never rewrite accepted commitments when schedules change.
3. Intersect with SHIDA/Website gates, publication/location, weekly hours, exceptional closures, food/stock and exact access. Explicitly handle ambiguous/nonexistent DST times and overnight dates. Do not equate opening hours with fulfillment schedules.
4. Product decisions still required: lead time/cutoff, selecting an already-started period, advance-order horizon, override precedence and confirmation on activation. Today's future-start rule stays unchanged until those decisions are implemented.
5. Share the resolver and locked submission recheck across Website/WhatsApp, with guest exceptions reviewed explicitly. Add schedule revision/retry, DST, overnight, closure and end-of-day renewal tests plus real solo-seller workday acceptance.

No schedule fields, migration, worker, cron, dependency, environment variable or provider template were introduced.

## Release handoff

Existing trackers remain Partial under `INT01` / pilot evidence `S33`. Open gates: matched authenticated staging, real WhatsApp phone/Meta behavior during closure, physical phones/tablets, keyboard/assistive technology, human FR/EN/LN/SW review, full solo-seller workday, reusable-schedule decisions/implementation and frozen-tree broader checks. Native Excel UI verification is not claimed.

Changed Website files: `restaurant-intake.tsx` and its new CSS; `restaurant-receiving.ts`; `restaurant-work.ts`, work/settings copy; Settings/workspace navigation wiring; the Guest QR explanation; receiving unit/browser tests and affected existing intake/settings/C1-E/guest browser labels. Backend files: `restaurant_order_api_service.py`, `conversation/restaurant_orders.py`, four `app/texts` catalogs and `tests/test_restaurant_receiving.py`. Existing Website Settings/basic-release and Backend basic-release/canonical implementation-status handoffs were appended. Tracker source paths, appended ranges and preservation checks are in [tracker-update.md](evidence/restaurant-receiving-2026-10-15/tracker-update.md). No Business frontend or employee permission file was changed.

Suggested commit message, not executed: `feat(restaurants): clarify receiving orders and effective intake status`.

Current rollout semantics supersede per-establishment admission: see [15 October rollout](restaurants-intake-rollout-2026-10-15.md). Historical test counts describe their original runs.
