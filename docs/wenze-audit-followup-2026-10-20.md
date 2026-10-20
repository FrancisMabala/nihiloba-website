# Wenze seller audit follow-up — 20 October 2026

The four reported regressions were stale test setup/expectations, not a reason to loosen production authorization. Organization discovery fixtures now complete onboarding; new cases prove incomplete/reconfirmation-required organizations remain blocked even with a module grant. Profitability tests exercise Personal pilot enabled and disabled separately. Further expense, schedule and private-cost fixtures now express the intended entitlement/onboarding conditions explicitly. Report navigation expects the current WhatsApp-to-web boundary. Durable photo recovery retains entity binding and accepted upload references while expecting the current quick menu.

Personal web and Business fixes preserve unsaved stock/variant edits on cancelled navigation and imported product text during photo changes. Import mapping participates in the unsaved-work guard. Receipt refresh failure removes stale private details; denied payment settings clear their controls. Shop-sharing failures are handled, denied access clears old sharing data, and confirmation dialogs have unique accessible titles. Existing Nihiloba layout and translations remain in use.

## Validation evidence

- Original regression/Personal pilot suite: 25 passed (includes both pilot states and incomplete-organization denial).
- Expanded backend seller suite: final result recorded in the authoritative Implementation tracker after validation. Covers module grants, profitability, pilot, photo batches, variants/conversion, durable workflow/imports, inventory, private-cost permissions, expenses, reporting and scheduled report authorization.
- Additional backend audit: 120 passed, 7 failed, 1 environment setup error. The seven failures are in unchanged `tests/test_wenze_product_management.py`: legacy routed price/currency, information/negotiation, photo reorder/upload, visibility/archive, private preview and Back/Cancel expectations. They expect old inline WhatsApp management; the current router returns WEB_MANAGEMENT. These failures remain a separate test-maintenance gap; this is not a whole-backend green claim.
- The setup error was Windows access to the global pytest temporary directory. The exact photo migration check passed with a new repository-local `--basetemp`; no production database was accessed.
- Website: 28 Personal browser cases passed, including partial-photo retry, precise photo/revision actions, cancelled unsaved navigation, keyboard dialog focus/Escape at 360/1440 px, daily/partial/unavailable figures, session expiry and four-language responsive pages.
- Business: 30 component tests passed; four EN/FR/LN/SW mobile parity cases passed across the seller destinations. Covers import mapping cancellation and photo edits preserving unsaved text, denied receipt/settings access, sharing fallback errors, stale revisions and context-bound API calls.
- Both Next.js webpack production builds/type checks and targeted ESLint passed. Task diffs pass whitespace checks. Browser fixtures prove software behavior, not a real WhatsApp provider or physical-device session.

## Remaining boundaries

Physical thermal printing, scanner/camera reliability, native OS share dialogs and actual provider-delivered scheduled reports are not certified. Seven legacy WhatsApp product-management tests above and the previously recorded separate webhook fixture remain visible follow-ups. The buyer clear-cart native confirmation remains outside this seller correction. DGI WNZ-12 and WNZ-13 remain blocked; no fiscal issuance or certification is claimed.

No application database migration, environment setting, production data operation or payment-policy change is needed. Deploy the three task commits through the existing main-branch pipeline. Exact commit, remote and Render states are maintained in the existing workbook; pushing alone is not deployment acceptance. Existing unrelated screenshots, generated files, Ecole work and the protected project mirror remain excluded.
