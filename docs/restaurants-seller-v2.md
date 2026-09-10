# Personal Restaurant seller — approved v2 design

Local frontend design batch, 2026-09-10. No deployment, Backend edits or migrations.
The user's explicit v2 approval supersedes the earlier proposal-status wording in
the supplied handoff. Original handoff and previous rollout evidence are preserved.

## Implemented

- Seller shell/sign-in: real shared NIHILOBA header/logo retained; ivory canvas,
  split desktop illustration/content, prominent functional WhatsApp button and
  actual send-message instruction, Personal-account explanation, public browse link.
  Mobile/tablet omit the art rather than download a hidden desktop image.
- Authenticated header: real selected establishment, broad location summary and
  publication state, current signed-in display name and logout/change-account.
  Explicit establishment selection remains required; never select an arbitrary owner.
- Selection loads the first server menu page. Five horizontal sections expose menu,
  dated offerings, hours, profile and sharing; profile retains publication controls.
  Saved preview remains reachable. Changing establishment returns to the existing
  filter/paginated selector, including permitted creation and persisted drafts.
- Menu rows present names, pricing model, exact string amounts/currency, availability,
  hidden state and edit. Categories remain a separate menu management action.
  No client-side subset filter is presented as filtering the entire dataset; the
  mockup's All/Dishes/Components filters were not fabricated. Pagination uses existing
  server parameters. Existing category/item choice loading occurs only when editing.
- Portion form: radio pricing choice, individually editable configured amounts,
  add/remove amount, currency, unit-price support, unknown-price support, visibility,
  availability and explicit save/cancel. Additional fields fold into a disclosure on
  existing items; creation/missing-category forms expose them. The optional desktop
  help panel uses text, not a cropped drawing or invented food slogan.
- Hours, exceptional closures, profile, dated-offering copy/confirmation, preview and
  stable sharing use the same square controls/fine rules. QR is still generated only
  on explicit request. Mobile keeps all five wrapping navigation labels rather than
  hiding profile/sharing behind a new menu implementation.

## Changed files and assets

`app/components/shida/restaurant-seller.tsx`, `restaurant-seller-workspace.tsx`,
`restaurant-seller.css`; `app/lib/restaurant-seller-design-copy.ts`;
`tests/browser/restaurant-seller.browser.ts`; this report;
`public/images/restaurants/{README.md,malewa-comptoir.png,malewa-comptoir-480.webp,malewa-comptoir-800.webp}`.

Source asset copied unchanged from the approved external handoff. Sharp generates
only resized WebP derivatives, not new artwork. The three boards were inspected as
visual references, not shipped as UI images. PNG 2,014,102 B; WebP variants 50,176 B
and 110,380 B. No dependency/package or global header/footer change.

## Preserved contracts

Auth gateway/client state machine and session helpers are untouched, including
proxy-safe Origin, browser binding, HttpOnly cookies, one-time Backend exchange,
uncertain-result recovery, logout/migration and cross-tab isolation. Session checks
and offline same-tab preservation remain. No private persistent/offline storage.
Security/gateway tests continue to cover those existing contracts.

Domain payload construction, exact decimal strings, operation/retry keys, revisions,
child/owner binding, reconciliation, no-store and explicit save remain unchanged.
Unit prices are never inferred from configured amounts; unknown is not zero.
Publication state is not labelled as venue opening/stock status. No Business gate,
ordering, reviews, statistics, paid feature, new API or production fixture data.

All new copy has EN/FR/LN/SW entries. Existing shared chrome's French LN/SW fallback
and native-speaker review remain gaps; this is not site-wide localization completion.

## Verification

Supported Node 22.23.2: 251 unit tests / 23 files passed; typecheck, lint and production
build passed (80 static pages). No warning suppression; the historical unrelated
sandbox fetch warning did not recur. Initial lint warnings on decorative picture
ARIA/unused lint suppression were corrected. The shared-login component itself
has no design/state-machine edits; styling is seller-scoped.

Initial browser pass caught the missing signed-in display name: restored it next to
logout. Existing test navigation was updated to reach Profile from the new menu-first
selection and Sharing from its own tab; unchanged save/retry/CAS/QR assertions retained.
The next development pass completed 37/37 browser scenarios. Final production-build
browser results and measurements follow below after completion.

Browser fixtures are synthetic and block external destinations; no real messages,
accounts, production writes or Backend integration are claimed in this design batch.
Authentication production status remains unverified as recorded in
`personal-whatsapp-rollout.md`; visual acceptance is separate from live login.
Preserve the existing S2-D/S3-A and authentication rollout/rollback guidance.

Suggested commit: `feat(restaurants): redesign Personal seller workspace with approved v2 layout`

### Final browser evidence

Production `next start`, installed headless Chrome, isolated API fixtures: **38 passed**
in 1.1 minutes. Includes all 17 shared-login regressions, 14 existing seller journeys,
six v2 layout/editor cases and server pagination/actual SW locale navigation.
Widths 390/768/1440; keyboard focus, overflow, long names, saved/cancelled and uncertain
edits, current-revision reconciliation, exact price tuples, expired-offering confirmation,
hours, publication, exact QR pixels/destination, logout and account loss all exercised.
No production data, actual Backend or WhatsApp delivery in this design verification.

Final production screenshots captured in ignored local `test-results/`:
`seller-v2-{signin,menu,portion}-{390,768,1440}.png`. Desktop and phone images were
visually inspected against all three v2 boards. Complete counter artwork, real logo,
ivory palette, horizontal navigation, lined rows and focused portion fields retained.
The mockup's optional bowl drawing/slogans, right-hand menu shortcuts and partial-page
filters were intentionally not reproduced; no functional control is faked.

After removing obsolete semicolon-entry help from the portion sidebar, typecheck,
lint and production build passed again and all six v2 browser scenarios passed again.
Screenshots were refreshed. Source PNG hash matches the approved asset exactly.

Latest cold sign-in measurement, same synthetic unauthenticated fixture, production assets:

| Width | Requests | Chrome encoded bytes | Capture interval ms | Artwork requests |
| --- | ---: | ---: | ---: | ---: |
| 390 | 28 | 287,276 | 826 | 0 |
| 768 | 43 | 354,114 | 453 | 0 |
| 1440 | 43 | 464,711 | 653 | 1 |

CDP requestWillBeSent/loadingFinished counters from navigation through the successful
action/artwork assertions and screenshot. Each case uses a new browser context; route
fixtures disable cache. These are bounded cold-fixture observations, not warm-cache,
cellular, billed-byte or daily-use claims. Shared navigation/prefetch differs with width.
Do not infer total eventual background traffic from the capture interval. The zero
mobile/tablet artwork requests and one desktop WebP request are explicit assertions.
Authenticated markup contains no decorative illustration. Existing session polling
behavior is unchanged; S3-A's separate idle/reconnection measurements are not new runs.

Live auth rollout/worker verification, physical phones, Safari/Firefox and native-speaker
review remain acceptance gaps. No deployment or Git commit was created. User-provided
`docs/design-handoff.md` and prior `docs/personal-whatsapp-rollout.md` were left intact.
