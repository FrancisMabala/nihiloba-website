# Counter sales — 21 October 2026

Implements the approved cream/forest/ochre counter-sales design, using actual
restaurant data and French mockup labels with EN/LN/SW alternatives.

- Desktop/tablet menu and basket; focused phone options, basket and payment.
- Merchant-configured portions and extras, immutable quoted options and notes
  on kitchen tickets/order receipts; no independently stocked extra products.
- Server-held, actor-private drafts; resume/requote before confirmation.
- Prepare-before-handover orders, existing canonical money receipts, cash change,
  payment recovery, corrections/refunds and receipt display.
- Per-browser restaurant starting page (Vendre/Aujourd’hui), native fullscreen
  where supported and expanded workspace fallback; no OS kiosk installation.
- Grouped navigation/mobile bottom bar, compact context, actionable Today,
  finance contrast fix; Organization workspace keeps context navigation in a drawer.

Backend dependency: migration 0195 (after 0194), new held-list and prepare routes,
counter_options field and minimum-data kitchen option projections. Production
schema authorization and Backend deployment must precede these frontend releases.
No environment variables or dependencies added; no production data/messages used
for validation. Manual payment records never claim provider verification.

Validation includes Restaurant unit/interaction contracts, exact decimal change,
lint/type checks, production build and Playwright counter journey at 320, 390,
820 and 1440 pixels. Synthetic screenshots are under
`docs/evidence/counter-2026-10-21/` in the local checkout. The final release report
records exact results. Physical-device/printing acceptance and production
deployment remain distinct from fixture checks.

Final local results: 205 Restaurant tests, 4 complete browser journeys, changed-file ESLint and the production build including TypeScript passed. Browser checks include Today pinning and fullscreen fallback. Backend regression results: 266 tests plus a final 50-test menu/counter follow-up passed. Production migration/deployment remain pending explicit live database authorization.
