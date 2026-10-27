# Restaurant management: mobile-first pages — 27 October 2026

## Structure proposed before implementation

- Pickup/delivery editing opens within its service card, visibly focused, with review/save and cancel actions.
- The selected day stacks date, action and local timezone on phones.
- Finances starts with Money received, Expenses, Balance due and Refund owed cards, then one compact table with separate CDF and USD columns.
- Statistics shows readable numbers plus order-status and source tables. Technical explanations are optional.

## Implemented behavior

The intake editor is moved into the selected card, rather than appended after all service information. The card spans the available width while editing. Its heading receives keyboard focus and scrolls into view. Cancel returns focus to its edit button. Existing draft protection, review step, validation, stale-state recovery and identical-request retries remain in place.

Finance receipts are summed using exact integer cents within each currency: the existing corrected cash receipts plus the existing mobile-receipt calculation (recorded net minus corrections). No currency conversion, profit calculation, change to stored records or payment-provider verification is introduced. CDF and USD remain separate everywhere. Due/refund values remain the server's current obligations, not daily receipt totals. Missing opening/count values remain missing. The table retains cash, mobile, expenses, obligations, opening, expected, counted and discrepancy values.

French labels use everyday wording, e.g. Choisir un jour, Reçu en espèces, Voir les opérations, Annuler and Enregistrer. New labels are provided in EN/FR/LN/SW. Statistics methodology, technical timestamps, detailed timing and measurement coverage are under Comprendre les chiffres. The default view keeps unavailable data distinct from zero, and explains that order value is not collected money. The order source table preserves web, WhatsApp, in-person and unknown categories.

No backend changes, production data operations, access-policy changes or WhatsApp messages are involved. Web/WhatsApp distinctions remain in availability details and statistics; login, permissions and destination routing are unchanged.

## Validation

Results and release verification are recorded in the completion report. Checks cover mobile widths starting at 320 px, all four languages, editor focus/cancel, pickup retry and schedule updates, local-day control geometry, financial permission/error states, exact decimal formatting, separate currencies, missing opening values, daily close retries, and statistics tables.

The statistics date selector presents inclusive days (including the chosen last day), while requests retain the API’s exclusive end boundary. Finance tables keep numeric values together and contain horizontal overflow for unusually long amounts.

Validation: production build (including TypeScript) and targeted ESLint passed. The initial 65-case browser run passed 57 cases and found eight editor-scroll timing failures; explicit instant scrolling fixed these. All 29 affected/new cases then passed, including all eight editor cases and corrected receipt totals (66 distinct browser cases validated overall). The final finance table adjustment was checked again in all 16 locale/viewport combinations. All 15 tests in five unit-test files passed and cover finance, receiving, insights and inclusive-date boundaries. Screenshots use fixture data, not production records. Development runs emitted the existing React/CSP debugging warning; CSP was not weakened.

Deployment verification remains separate from local validation: a GitHub push alone does not confirm a Render deployment.
