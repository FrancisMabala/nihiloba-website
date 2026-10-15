# Personal Restaurant and Malewa Settings handoff

15 October 2026. Local implementation complete; release acceptance remains **Partial**. No deployment, production intake change, commit or push. Website starting commit: `ac571249387110eb20e331ff57859b1e7c1a09d5`. Backend tested working tree at `218dfcd53547fb24a692a14191782e47530c9909`; no Backend or WhatsApp source edited in this batch.

## Owner workflow

Settings now has an entry in the existing workspace navigation, section links, and five sections: establishment/service, opening hours, order intake/fulfillment, reservations, and payments. It displays saved values separately from drafts, requirements next to their controls, and the effect of a change before saving. The existing profile, hours, Menu, Selling and payment-method editors remain authoritative. Reservations links to Settings for intake configuration; its queue, calendar and response actions are unchanged. Today, Selling, Menu, Finances and the public pages were inspected, not redesigned.

Seated service is an explicit saved checkbox in the profile editor; other existing service-mode values are preserved. Changing the business description does not enable it. Malewa, restaurant, café and fast-food labels never enable reservations, delivery, Kitchen or Bar. Item availability and Ready/Kitchen/Bar routing remain in Menu. No employee or role administration was added.

The intake editor shows saved pickup and delivery preferences and the separate establishment rollout gate. The current channel's proposed value is marked as a draft, with missing windows, time zone or delivery setup identified. Review and confirm precede mutation. Saved values change only after a successful authoritative read. Stale writes require refresh and another review; uncertain retries retain the identical request body, revision and operation key. Offline controls are disabled. A failed reread leaves the view marked stale. Leaving or refreshing Settings with work pending asks before discarding it; a browser reload reads the server again rather than treating a local draft as active.

Reservations display the saved preference separately from Backend `available`. Published state, explicit seated service, capability, time zone and confirmed hours are shown beside links to their existing editors. The page reads the existing hours `confirmed_at` field; a schedule alone is not confirmation. Known missing prerequisites block enabling in the UI; Backend authorization and eligibility still decide every write. Closing remains possible for an enabled setting. No table assignment or capacity guarantee is implied.

Payment methods and their supported currencies are read from `service/payment-methods`; changes open the existing editor. CDF and USD remain separate. External mobile money is a seller declaration, without provider verification, conversion or automatic payment. Existing orders, reservations, references, bills and payment records remain accessible when intake closes.

## Contract trace

| Setting | Existing authority | Website and WhatsApp behavior |
| --- | --- | --- |
| Profile, publication and seated service | Personal establishment read/PATCH and lifecycle routes; `restaurant_dashboard_service.profile_dto`, existing Personal access service and lifecycle service | Public detail uses saved publication/profile; reservations check explicit `eat_there`, not business type. Changing service or publication prompts confirmation. |
| Hours, closures and time zone | Existing hours PUT; `restaurant_time_service.hours` and confirmation logic | Pickup/delivery windows are validated against hours and closures. Submission revalidates current opening state. Reservation requested times must be open; confirmed hours and valid zone are eligibility requirements. Unknown hours are not advertised as confirmed hours. |
| Pickup and delivery | `restaurant_order_api_service.configuration`, `require_intake`, `restaurant_order_service.configure_pickup`, fulfillment service | Saved enabled flags cannot bypass rollout allowlisting, valid windows, menu availability or Backend access. Public options and new submissions use current state. In-progress WhatsApp requests receive the existing changed/recheck response; configuration input errors retain the existing prompt and values. |
| Reservation requests | `restaurant_reservation_service.seller_setting`, `configure`, `_intake`, `_requested_instant` | Website availability and WhatsApp request flows use current saved eligibility. Offered WhatsApp confirmation becomes stale after a setting change. Disabling intake does not erase accepted commitments, history, replay or durable notices. |
| Guest QR auto acceptance | Existing `guest-auto-accept` authority and component | Applies only to new guest QR orders. The existing description retains stock and confirmation conditions. Added confirmation and fixed initial reads under React development effect replay. It does not enable ordinary Website/WhatsApp intake. |
| Payment methods and currencies | Existing `service/payment-methods` authority and canonical bill/payment services | Settings is a read summary plus navigation. Existing bill/receipt and WhatsApp payment wording remain unchanged; no external payment is performed. |
| Ready-to-serve, Kitchen/Bar, stock and item availability | Existing Menu/item-routing editors and Backend item authority | Settings links to Menu instead of duplicating item settings. Submitted order terms and routes remain captured by the existing order contracts. |

No demonstrated Backend contract gap blocked this page. The gaps fixed were Website navigation, saved-versus-draft presentation, intake confirmation and recovery, and initial setting reads in development effect replay. Exact-establishment routes, owner checks, session binding, proxy allowlists, idempotency, conversation state, notice delivery and FR/EN/LN/SW choices were retained. No dependency, migration, environment setting, worker, cron or provider template was added.

## Verification

| Check | Final result |
| --- | --- |
| Website production build | Pass |
| TypeScript | Pass |
| Changed-file ESLint | Pass |
| Diff whitespace | Pass |
| Focused Website units | 132 passed across 10 discovered files; includes existing `.s3a-local` copies. This is an execution count, not 132 unique contracts. |
| Seeded production-preview Chrome | 25 passed in 48.8 seconds; 360, 820 and 1440 px; FR/EN/LN/SW. |
| Focused Backend | 525 passed, 2 expected skips in 1088.19 seconds on a fresh disposable SQLite database. |

Browser coverage includes Malewa/fast-food/café layouts, restaurant settings, separate payment currencies, explicit missing prerequisites, closed rollout gate, confirmation/cancel, save/reload, stale-save refresh, closed-to-open and open-to-closed intake at every requested width, exact uncertain retry, offline recovery, failed post-save reread, reservation stale/retry behavior, pending-work protection during Settings refresh, and exact-establishment denial. Baseline capture ran 3/3 at the requested widths before source edits. The initial development pass exposed a loading issue and a capture assertion issue; both were corrected before the final production run.

Backend command (from `C:/NIHILOBA/Backend`, with `DATABASE_URL` set to a disposable file under the Website `tmp/` directory and `PYTHONDONTWRITEBYTECODE=1`):

```text
venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests/test_restaurant_intake_windows.py tests/test_restaurant_intake_allowlist.py tests/test_restaurant_reservations.py tests/test_restaurant_whatsapp_journey.py
```

The two skips are existing Personal parametrizations of Organization-only role-boundary and operational-policy cases in `test_restaurant_reservations.py`. The focus covers current public intake, revocation before commit, committed replay/history/receipt preservation, WhatsApp next-action revocation, four-language input preservation, reservation setting changes invalidating offered confirmation, notices and ownership boundaries.

Final Website browser command:

```text
RESTAURANT_TEST_EXTERNAL_SERVER=1 RESTAURANT_TEST_BASE_URL=http://127.0.0.1:3014
npx playwright test -c playwright.restaurant.config.ts restaurant-settings.browser.ts restaurant-intake-window.browser.ts
```

Evidence is in [the Settings evidence directory](evidence/restaurant-settings-2026-10-15). Three baseline profile captures, twelve final full-page captures and three intake detail captures use synthetic accounts and records. Build, typecheck, lint, unit and Backend/browser logs are retained there. Production preview avoids the pre-existing development CSP/eval warning.

Full suites were not rerun. Prior reported Website full-unit results remain **730 passed / 8 failed** on duplicated older SHIDA public-page expectations. The prior broad Backend gate remains **2,763 passed / 58 failed / 21 expected skips**. Neither is reclassified as green by this focused batch.

## Release acceptance still open

- Authenticated staging on the deployed Website/Backend pair, including owner changes, capability revocation and customer requests during intake changes.
- Real WhatsApp phone and Meta/provider behavior, in-progress conversations, durable notices, and confirmation after intake closes.
- Physical phone and tablet use, keyboard/accessibility checks with assistive technology, and a solo seller's full workday.
- Human FR/EN/LN/SW acceptance, particularly Lingala and Swahili wording.
- Frozen release-tree gates and the existing unrelated full-suite failures.

Keep the release trackers Partial. Tracker changes and preservation verification are recorded in the evidence directory. Suggested commit message:

```text
feat(restaurants): add solo seller Settings with safe intake controls
```


## Receiving orders follow-up — 15 October 2026

The focused intake redesign supersedes this report’s old intake presentation. See [Receiving orders handoff](restaurants-receiving-2026-10-15.md): Backend advisory status, full-scope rollout wording, separate pickup/delivery editors and retained WhatsApp drafts. Final focused validation: 52 production-browser cases, 116 Website unit executions and 253 Backend executions pass; build/typecheck/changed-file lint pass. Release remains Partial; daily-window renewal and live acceptance remain open. No deployment or production switch change.
