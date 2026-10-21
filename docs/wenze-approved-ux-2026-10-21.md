# Wenze seller UX — 21 October 2026

Task scope: WNZ-00 seller audit and WNZ-11 usability follow-up, with WNZ-14 release evidence. Separate checkouts preserve unpublished Services and Ecole changes.

## Result
Six primary sections group existing seller capabilities. Desktop navigation uses Nihiloba green, cream and gold; mobile keeps Today, In-store sales, Orders and Products & stock accessible, with Money and My shop under More. Product details, photos, and options/stock are explicit tabs. Options use existing category-aware backend contracts, including non-fashion products.

Changed drafts use a branded Keep editing / Discard changes dialog. Opening an unchanged form does not block navigation. Native browser unload protection remains. Form alignment, local saving/saved feedback, submission locking, expense reset and refreshed purchase-cost history reduce repeat submissions. A failed refresh after a confirmed write is reported as saved with refresh failure, not an uncertain write.

Inventory separates Stock, Stock history and Reserved stock, with a separate Refresh action. Code lookup normalizes case and an omitted INV- prefix. Unknown codes preserve existing stock after an authorization recheck; revoked access still clears private data.

In-store sale tiles add products directly. Confirmed checkout empties the basket and shows a compact confirmation with View receipt / New sale. Uncertain requests retain retry identity and the basket. Receipt printing (58/80 mm) and PDF download remain; receipt sending is excluded. No backend schema changes or migrations are required.

## Validation and evidence
Both production webpack builds passed. Business: 30 focused Vitest tests across six files. Website focused gateway/product/discovery tests passed. Browser journeys: approved UX in four languages on each frontend (8), existing POS/barcode/uncertain-checkout journeys (4), seller profile/lifecycle journeys (4), Organization ten-screen parity journeys (4). Targeted ESLint and diff checks passed.

`docs/evidence/wenze-approved-ux/` contains real browser captures at 1440px desktop and 390px mobile widths using deterministic mocked API data. These are UI evidence, not proof of production transactions or printer output. Existing historical captures are retained. Tests run EN, FR, LN and SW.

## Release and remaining checks
Commit, remote SHA and deployment results are maintained in the existing SHIDA_Wenze_Implementation_Tracker.xlsx. Do not infer deployment from a passing build or push. WNZ-00 remains open for physical phone/camera, thermal-printer/label-scanner and real-provider acceptance. DGI WNZ-12/13 stay blocked. Receipt sending remains excluded. No unrelated Services or Ecole commits are included.


## Mobile header and dialog correction â€” 21 October 2026

The compact SHIDA/Wenze header now uses a language pill and account initials on phones, retaining the full account name on larger screens. Only one disclosure opens at a time; it closes on repeated activation, an outside pointer/touch, Escape (restoring trigger focus), focus leaving the header, or action selection. Personal language changes preserve the current store/view/product query. Existing session and draft safeguards remain.

The shop selector spans the phone width and long shop names have their own space. Six small icon destinations replace the tall mobile More menu, matching the approved concept. Today has a direct New sale action and icon metrics. The Business surface now loads the same Wenze layout stylesheet as Personal, correcting its missing metric-grid and mobile product-card styling.

Wenze confirmation, leave-draft and sharing dialogs use viewport-centred fixed placement with bounded height and internal scrolling. Native browser unload prompts remain browser-controlled. Stock, sales, category/variant contracts and receipt-print/PDF behaviour are unchanged; no schema migration is required.

Validation: both production webpack builds/type checks pass; eight focused responsive browser journeys cover 320, 390, 820 and 1366px, including real touch events at phone widths, exclusive menus, dismissal, language context retention, horizontal-overflow checks and centred dialogs before/after scrolling. Eight EN/FR/LN/SW seller-flow regressions cover drafts, inventory lookup, checkout, receipt printing and shop settings. Focused Vitest: Business 15 tests, Personal 26 tests. Targeted ESLint has no errors (Business retains two full-page-navigation advisory warnings); full-repository lint remains blocked by existing Restaurant/Services errors outside this batch.

Evidence: `docs/evidence/wenze-mobile-chrome/` contains real browser renders with deterministic API fixtures, including viewport, full-page, catalog and centred-dialog captures. These are responsive browser tests, not physical iPhone/iPad or printer acceptance. Existing evidence and tracker history remain. Deployment/remote commit verification is recorded in the implementation workbook after release.
