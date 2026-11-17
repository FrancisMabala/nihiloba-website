# SHIDA Meda participation improvements

17 November 2026. Product contract: backend `docs/business_modules/meda.md`.

Actual listings/details/counts require an existing signed-in Personal account.
The public route explains the service and preserves the selected destination through
existing WhatsApp browser-bound login. Mon espace → Mes annonces contains Meda in All,
a Meda filter and a transport publishing choice. A shared three-step form handles
luggage, airport and container offers/requests with explicit publication, unknown
volume, per-package/kg/m³ pricing, arrival estimates and deliberate member visibility.

Private applications to offers require actual-object photos, contents, weight and
package count. Request listings require these before publication. Images use the
bound private gateway and object URLs; files, contacts and session credentials are
never placed in browser storage. Structured private contact/address sharing is an
explicit action addressed only to the other participant. Agreements require separate
warning acknowledgement and confirmation by both users against the same version.
Material changes invalidate confirmation. Existing exchanges continue after listing
intake closure; participants can separately close an exchange.

Reuse: existing Personal auth/session switching, Mes annonces, shared notification
bell/center, backend media pipeline, durable enquiries, WhatsApp renderer/delivery
ledger, Support reporting and platform moderation. No Business Dashboard, new account,
payment checkout, booking engine, automatic reservation or Organization grant is added.

## Validation

The existing Node 24 / Next 16.4.6 dependency snapshot is reused because the original
worktree dependency junction target is no longer available. Build and typecheck passed;
1088 unit tests passed; lint zero errors (41 pre-existing warnings). Final UI refinements
and browser results are appended below. No new dependencies or environment variables.

`tests/browser/meda.browser.ts` covers four locales at mobile/desktop sizes with
mocked gateway responses. `scripts/run_meda_acceptance.py <backend-checkout>` launches
real FastAPI and browser transport against disposable SQLite with two synthetic users.
Only the external image provider is substituted. The test proxy changes loopback Origin
to the configured production Origin; authentication, CSRF checks, source permissions,
photo normalization, persistence, gateway and private-byte delivery remain real.
No production mutation, live WhatsApp delivery or real Cloudinary upload occurs in tests.

The real two-user flow passed photo application, separate acknowledgements/confirmations,
mutual agreement, owner refresh, messages after intake closure and account-switch/media
privacy. Evidence is in `docs/evidence/meda-improvements/`. Backend migration/release
commands and operational readiness are recorded in its matching technical report.

WhatsApp proactive notices use the existing messages runner; outside the service window
they remain deferred because no suitable approved template is configured by this batch.
The web notification center stays available. Detailed authoring/term editing opens the
same authorized website workflow. Translation strings exist in EN/FR/LN/SW; human
linguistic review and actual-carrier acceptance remain outside automated validation.

Final application production build and typecheck passed after the authoring fixes;
source hashes match the reused validation snapshot. Focused final component lint has
zero warnings/errors; the full-repository lint result remains zero errors/41 existing
warnings. The full unit suite passed 1088 tests again. No dependency manifest changed.
The existing country-reference endpoint is available in production (HTTP 200); the
real test harness explicitly enables its existing registration feature flag.

Backend release commit: `6ad18ae73a961dfb6d2c1ecf0450013e27fdca5d`, pushed and verified
against origin/main. Backend evidence includes 63 PostgreSQL, 122 shared SQLite and
41 final security test passes. Eleven broader legacy navigation failures reproduced
identically on unchanged main and are documented in the backend report.

Final real-browser acceptance: 3 passed in 39.6 seconds (two users, member/asset
privacy, owner discovery/refresh, agreement, continuing exchanges after closure,
and Mes annonces container publication/back-input preservation). The latest repeat
passed the same three cases. Four-locale mobile/desktop gateway fixtures are separate
UI evidence; no mocked-response test is represented as backend integration evidence.
Final contact-policy rerun: 23 backend participation tests passed.

No secrets, shared caches, unrelated worktrees or development data were changed.
Production release uses Render's existing migration hook followed by the website
and existing Digest-messages job. No Meda-specific proactive template was created.

## Production release verification — 17 November 2026

Render applied additive migration `0251_meda -> 0252_meda_participation` at
20:35:16 UTC using the existing `python scripts/run_migrations.py` predeploy hook.
The migration reported success; existing records were preserved. Backend deployment
`dep-dbubk2kipgvc738ec360` became live at 20:37:16 UTC on `6ad18ae73a961dfb6d2c1ecf0450013e27fdca5d`.
The existing Digest-messages job deployment `dep-dbublbk9v7es7382ktd0` became live
at 20:36:40 UTC on the same commit. No production secrets or infrastructure settings changed.

The final upload-state fix preserves edits made while an image is uploading.
All nine mobile/desktop locale cases passed on the final application build, including
that overlap. Final build/typecheck and focused lint passed; all 18 changed application,
test and harness files match the validation snapshot. Hosted GitHub commit statuses
were empty for the backend; local validation is reported separately from hosted CI.

Task-owned PostgreSQL Docker test resources were removed. The compatible Node dependency
snapshot and validation logs/screenshots remain for reuse and evidence. Existing
worktrees and unrelated unfinished SHIDA work remain intact.

Final real-backend browser repeat after the upload-state fix: 3 passed (37.4 seconds).

The subsequent approved visual release is documented separately in
[Meda visual refinement](meda_visual_refinement.md), including shared design reuse,
account navigation, owner enquiry counts and desktop/mobile evidence. It supersedes
the earlier discovery presentation without changing the participation policy.
