# Restaurant Selling / POS correction — 14 October 2026

Status: **Partial, local only.** No deployment, production intake change, commit, or push.

## What changed

- Personal and Organization owner screens enter one **Selling** destination with Counter / takeaway and Table service modes. Assigned Service staff get the same menu and basket interaction inside their exact establishment assignment; payment controls remain tied to the separate payment assignment.
- Counter and Service show the current establishment menu immediately, with search, categories, actual price/currency, availability, optional photo, and a photo fallback. Backend POS and Service workspace projections now include the existing sanitized `image_url` field.
- Business permits only the existing Backend restaurant photo path and the configured Cloudinary image path in its image policy. Selling photo URLs are checked before rendering, and Backend-owned photos bypass the Next image cache.
- Tablet/desktop show the basket beside the menu. The 360 px phone keeps a persistent summary and opens the full basket. Quantities, amount choices, removal, preparation preference, and CDF/USD estimates remain editable. The Backend quote is shown before confirmation.
- Counter still uses canonical counter basket → quote → finalize with explicit handover. Table Service still uses visit/group → assisted basket → quote → submit → preparation → later assisted handover. Submitted orders display and copy the canonical `order_ref`; receipts do too. Visit `group_ref` remains distinct from each round's `order_ref`.
- Closed intake keeps the authorized menu and prior work readable while disabling new writes. Existing immutable operation envelopes handle uncertain responses; current Backend revisions and grants are checked on writes and reads.

## Contract gaps

1. **Mixed currency:** Canonical Restaurant `_calculate` rejects lines with more than one currency and requires the establishment menu currency. Both UIs show separate CDF/USD basket estimates but disable quoting a mixed basket, explain the constraint, and require separate canonical orders. A single mixed-currency quote/order needs an explicit Backend money and receipt contract; no exchange rate or second ledger was invented.
2. **Assigned waiter counter sale:** The Backend has exact `service_work` and separate `payment_record` assignments but no narrow counter-sale assignment. An assigned waiter can submit assisted table rounds only. Giving Service access to `/pos/counter-baskets` would widen authority. A dedicated exact-establishment counter grant, assignment generation, scoped endpoints, and revocation/replay tests are required before waiter counter sales can be enabled.
3. **Permitted drinks:** The Backend menu projection supplies visible/current items, including existing moderation decisions. It does not expose a dedicated non-alcoholic classification to the POS. The UI cannot independently certify an existing drink as permitted by guessing from its name or category; the Backend content policy must remain authoritative.

## Local validation and evidence

- Website typecheck, targeted lint, production build, and focused POS/Service contract tests pass (23 tests). Business typecheck, targeted lint, production build, and mounted POS/Service tests pass (7 tests), including an uncertain counter finalize replay with the same body.
- Website seeded Selling browser checks pass 12/12 at 360, 820 and 1440 px in FR/EN/LN/SW. Business seeded Selling management checks pass 12/12 at those widths and languages. The 360 px captures show the actual phone viewport with the persistent basket; wider captures show the full page. The 48 captures are in [`docs/evidence/restaurant-selling-2026-10-14`](evidence/restaurant-selling-2026-10-14).
- Website counter handover and linked payment browser checks passed at 360, 820 and 1440 px after the phone drawer was closed on successful finalize.
- Backend POS/Service tests on a fresh disposable SQLite database passed 25 tests before an unrelated existing teardown foreign-key failure in `test_pre_purchase_owner_can_use_existing_finances[personal]`. The original local database fails sooner with a Wenze foreign-key mismatch. The broader scoped Backend gate remains red as recorded in [`restaurants-seller-workspace-2026-10-14.md`](restaurants-seller-workspace-2026-10-14.md): 2,763 passed, 58 failed, 21 expected skips. These are separate results; no gate is represented as green.

Physical waiter devices, live authenticated Personal/Organization staging journeys, and native-speaker wording review remain open. The screenshots and order payloads are seeded local evidence.
