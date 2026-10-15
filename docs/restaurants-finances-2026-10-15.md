# Personal Restaurant & Malewa Finances — 15 October 2026

Status: **Partial, local Website work only.** No deployment, production intake change, Backend source edit, commit, or push.

## Seller workflow

Finances now opens with a selected establishment-local date and separate CDF/USD cards. The daily figures come from the Backend day preview's stored IANA zone and `[start_utc, end_utc)` bounds: corrected cash receipts, restaurant-declared external mobile money receipts, and recorded expenses. The card labels unpaid bill balances and actual refund obligations as **current linked-bill obligations**, distinct from daily money. Opening, expected, counted cash and variance display missing attestations as missing. The detailed review shows actual cash refunds, cash expense effects and genuine cash movements separately.

The Backend's `bill_summary` loops over **all linked service groups** for the establishment and adds each current bill's chargeable order value and allocated money. It is not a local-day revenue measure. Those figures sit in a collapsed “Linked bills: all dates” explanation; older counter sales without a canonical linked group are excluded and remain unbackfilled. No profit, tax, FX, precise stock cost, or provider-verified payment is calculated.

The first actions open one focused task at a time: paid expense and its correction/recovery, genuine cash addition or removal, entries, exact-reference bill recovery, and daily review/close. The existing canonical bill and payment controls still own receipt recording, reversals, actual refunds and uncertain-payment recovery. Method configuration is under secondary settings. A cash-paid expense affects expected cash once; the interface warns against also recording a removal. Stock receiving, waste and count corrections remain independent of expenses.

The Backend still enforces exact-establishment Personal owner and current paid access; the Website retained those authenticated routes. Organization grants and the Business workspace were not changed. The daily client requires confirmed zone state, permits each opening attestation only within that local day, and enables count/final close only after the Backend's local-day end. A missed opening remains incomplete with no zero or carryover. The review exposes discrepancy, due/refund obligations, open orders and stock exceptions before acknowledgement/reason. A new preview resets acknowledgements. Closing does not complete orders, settle bills or verify external money. Stale writes reread the preview. Uncertain close recovery treats an absent report as an absent close, then offers an explicit retry of the identical body and operation key.

## Verification

The Website production build, TypeScript check, changed-file ESLint and diff whitespace checks passed. Focused Restaurant seller/money/daily unit selection passed **99/99**. The full Website unit suite completed **730 passed, 8 failed, 0 skipped**; all eight are the previously red SHIDA public-page assertions, duplicated by the `.s3a-local` source copy. They expect older marketplace copy and are separate from this finance page.

An older combined workflow browser case timed out before reaching Finances because it still navigates to a standalone “Préparation” destination that the current management navigation does not expose. Its two attempted FR cases are not counted as finance passes. The new finance-only browser selection below completed independently.

Seeded production-browser finance checks passed **20/20** at 360, 820 and 1440 px in FR/EN/LN/SW. They cover a solo Malewa day, Restaurant/fast food/café profiles, separate currencies and cash/mobile declarations, partial collections, unpaid and refund obligations, missing opening after midnight, permission denial, loading failure and empty entries, stale revision, and exact uncertain-close retry. Focused Backend money, financial, daily, Personal WhatsApp and restaurant WhatsApp tests passed **336/336** on a disposable local SQLite database in 18:16. Those real Backend journeys cover expense/stock independence, cash movements, day boundaries, actual refunds, correction, stale revision and exact owner/worker access. No authenticated staging, live-provider or physical device run was performed.

Before/after FR captures and the twelve after captures are in [the evidence folder](evidence/restaurant-finances-2026-10-15). The “before” files preserve the previous three finance views. These are synthetic authenticated fixtures, not real account screenshots. WhatsApp completed-order and receipt wording was inspected in FR/EN/LN/SW and still says payment is unverified; no WhatsApp finance detail was added.

## Release tracker handoff

Keep the pilot, WhatsApp and main release trackers **Partial**. Record the Website results and the Backend focused result separately from the red full Website suite and the previously red Backend broad gate (**2,763 passed, 58 failed, 21 expected skips** in the 14 October seller-workspace diagnostic; no frozen final-tree rerun here). The canonical OneDrive workbooks were not writable from this workspace; [tracker delta](evidence/restaurant-finances-2026-10-15/tracker-update.md) contains the exact update to apply after the SharePoint/OneDrive connection is available. The Backend local workbook copies were left untouched.

Remaining gates: authenticated Personal and Organization staging on the deployed Backend/Website pair; real phone and tablet behavior; actual cash/count/payment handling on a physical device; human FR/EN/LN/SW wording acceptance, especially Lingala and Swahili; and a frozen final-tree release gate. Preserve subscription and intake settings until those checks close.

## Backend focused command

`venv\Scripts\python.exe -m pytest -q -p no:cacheprovider tests/test_restaurant_money.py tests/test_restaurant_money_receipt_recovery.py tests/test_restaurant_daily.py tests/test_restaurant_financial.py tests/test_restaurant_personal_whatsapp.py tests/test_restaurant_whatsapp_journey.py` with `DATABASE_URL` pointing to a fresh disposable SQLite file and bytecode disabled: **336 passed in 1096.15 seconds (18:16)**. No Backend code changed.
