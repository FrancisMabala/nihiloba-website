# Personal WhatsApp production rollout

## Allowed-origin correction attempt - 2026-09-10

**Still blocked. No production configuration was changed and no restart or
deployment was triggered.** Application code, migrations and dependencies remain
unchanged. No WhatsApp message was sent and no session exchange was attempted.

### Current access and revision evidence

The user supplied the targeted Render page for `shida-backend`:
https://dashboard.render.com/web/srv-d9s8g1c9v7es73effevg/events .

The browser connector returned an empty inventory and "No browser is available".
The separate installed computer-use runtime found Chrome, but automatic approval
review rejected activating/reading its existing Restaurants window because it
could inspect unrelated browser state. After the user provided the exact Render
URL, the narrower navigation attempt timed out waiting for computer-use app
approval. Follow-up window inventories found no Render-titled window. No Render
connector or Render CLI was available. Therefore authenticated Render access,
effective environment values, live revision/deployment ID and per-instance
consistency could not be verified.

The user previously reported website service `nihiloba-website-zfmp` live at
`eb74fe9` and Backend `shida-backend` live at `846bbdf`, with authentication
hardening already included. These are supplied prior observations, **not freshly
reconfirmed live revisions**. Local Backend HEAD during this check was
`8f930f42eee22f5086670df574228ab9be802523`; it must not be mistaken for the live
revision or automatically deployed. Do not roll back to `4f70f30`.

### Parser and smallest authorized correction

Inspected `Backend/app/config.py` and
`Backend/app/services/dashboard_auth_service.py::require_dashboard_csrf_origin`.
`DASHBOARD_ALLOWED_ORIGINS` is a comma-separated string, not a JSON array.
The validator splits on commas, trims surrounding whitespace and trailing
slashes, then requires exact origin membership (or the request's own origin).
The same setting supplies CORS origins at application startup. Settings are
instantiated at import time; editing a hosting value alone does not prove existing
workers loaded it. Process environment settings override dotenv values.

Using authenticated Render access:

1. Record the actually live Backend deployment ID, complete commit SHA and
   instance status before changing anything.
2. In this service's Environment configuration, inspect only
   `DASHBOARD_ALLOWED_ORIGINS` privately, including any linked environment-group
   source/service override. Preserve every legitimate existing entry, especially
   the actual Business Dashboard origin.
3. If the normalized exact entry `https://nihiloba.com` is absent, append it with
   a comma. For example, the *shape* is
   `<unchanged existing origins>,https://nihiloba.com`; do not enter the placeholder.
   Do not replace the list, add a wildcard, or add JSON brackets/outer quote
   characters. Do not blindly add a duplicate if an equivalent trailing-slash
   entry already exists.
4. If present, investigate the effective source, literal quoting/separators and
   whether running instances predate the configuration. Correct only the
   demonstrated source/parsing/stale-instance issue.
5. Apply the configuration through a restart or a deployment **pinned to the
   currently verified live revision**. Do not select "latest commit" unless its
   SHA is proved to be that same live revision. Wait for the configuration-bearing
   deployment to be live and all prior serving instances to be replaced. Record
   deployment ID, SHA, time and instance evidence without dumping environment
   values.
6. Repeat canonical-origin, untrusted-origin and the *actual retained Business
   Dashboard origin* probes. Confirm the seller page in a real browser offers
   its WhatsApp continuation, but do not follow/send the message as another user.
   Repeated HTTP probes alone cannot establish all-instance configuration.

No prior environment value was inspected or saved in this report. A precise final
replacement string cannot safely be supplied until the existing list is known.

### Fresh production checks

HTTP probes used no user credentials. Responses were reduced to status, safe error
codes and cookie/cache attributes. No tokens, cookies, challenge references,
challenge URLs, full headers or environment exports were recorded.

At 2026-09-10 16:48 UTC:

| Probe | Result |
| --- | --- |
| Backend challenge POST, Origin `https://nihiloba.com` | 403, `Invalid origin`; no cookie |
| Backend challenge POST, Origin `https://untrusted-origin.invalid` | 403, `Invalid origin`; no cookie |
| Website Personal challenge gateway POST, canonical Origin | 403, safe `unavailable` error; `private, no-store, max-age=0`; no cookie |
| Website Personal challenge gateway POST, untrusted Origin | 403, safe `forbidden` error; `private, no-store, max-age=0`; no cookie |
| French seller page GET | 200 HTML; not a rendered-browser acceptance test |

At 2026-09-10 16:56 UTC, an explicit same-origin Backend control
(`Origin: https://api.nihiloba.com`) created one disposable challenge:

- Creation returned 201 with the expected reference/expiry/link fields; values
  were not logged and the WhatsApp link was not opened.
- The originating HTTP client's verifier-bound status read returned 200 pending.
- A separate client without that verifier returned 404.
- No session cookie was issued. No exchange, signed sender test or user login
  was performed; the unused challenge is left to its existing five-minute expiry.
- The verifier cookie was HttpOnly, SameSite=Lax, Path=/, Max-Age=300, but **Secure
  was absent**. Thus the direct Backend production Secure-cookie check did not pass.
- Direct Backend challenge creation/status responses had **no Cache-Control
  header**. This is an observed missing explicit cache policy, not evidence that
  an intermediary actually cached a response.

These last two findings prevent claiming all production cookie/cache protections
are intact. They were observed without making any configuration change. Current
source selects Secure via `is_production()`; `ENV` takes precedence over
`APP_ENV`, and the effective value must be exactly `production`. The live revision
and these settings remain unverified, so the cause is not established. Inspect
them privately before a separate bounded correction; do not blindly modify
unrelated settings or claim an allowed-origin edit fixes cache headers.
Website gateway error responses do retain private/no-store, but a successful
website challenge cookie could not be verified while its upstream rejects Origin.

Three local checks of the actual origin-validator function passed using a
synthetic comma-separated list: canonical website accepted, documented example
Dashboard origin accepted, and untrusted origin rejected. This establishes parser
format, not the live allowlist or the identity of the actual Business origin.
No full regression suite was run for this configuration-only attempt.

### Remaining acceptance and verdict

**Still blocked on authenticated, targeted Render access.** The canonical origin
failure is freshly reproduced. Browser binding works in the direct same-origin
control; untrusted origins are rejected. The actual Business Dashboard origin,
live revisions, effective origin setting, all-instance rollout, successful seller
browser continuation and production cookie/cache corrections remain unverified
or unresolved.

After configuration and protection checks succeed, the user must perform the
remaining real WhatsApp login: open the seller page, choose Continue with WhatsApp,
send the exact offered message from their controlled account, return to the same
browser and confirm the intended Personal session. Challenge creation alone is
not end-to-end login acceptance.

Suggested documentation commit text (no commit created):
`docs(auth): record production origin blocker and sanitized verification`

---

## Historical preflight evidence

The following preflight predates the user-supplied live-deployment observations.
Its candidate/deployment statements are retained as history, not current status.

# Personal WhatsApp production rollout — preflight

2026-09-10. Production rollout authorized by the user, but **not executed**.
No hosting configuration changed, no deployment triggered, no message sent.

## Release contents inspected

- Website candidate: `eb74fe95b108c3e169a1ea0471439afc6c1150fd`.
  Nine changed files relative to `d023c58605afeb7848a746d4ae37b2d8b164d5bf`:
  shared origin helper; WhatsApp, seller and Employment gateways; three test files;
  actual-Backend browser test; implementation report. This delta is authentication-only,
  with no migration or redesign. Website working tree was clean at preflight.
- The parent website commit is the earlier public discovery redesign. Therefore the
  auth-only delta is not proof that deploying this candidate introduces no redesign:
  compare it with the actual active production revision before deploying. If production
  predates that redesign, prepare an auth-only release from its active baseline instead.
- Backend candidate `4f70f302529f3bad67da722e53a5cc4022e66f82` is **not an auth-only
  release**, despite its subject. Relative to `0ea539e6fceacbd2db97fe9a794c374592085553`
  it changes 66 files, including Services lifecycle work and migration
  `0070_service_reservation_lifecycle.py`. Do not deploy this whole delta under the
  current bounded authorization unless those unrelated contents are already active.
- Backend working tree also contains unrelated changes and untracked migration `0071`.
  Nothing was staged, committed, reset or removed. The auth service and its two new
  auth test files have no uncommitted differences from the candidate.

## Access and release blockers

No Render connector or Render CLI is available in this session. Browser inventory
reported no available surfaces and opening the in-app Render dashboard returned
`Browser is not available: iab`. Thus active service IDs, active deployment revisions,
loaded allowed-origin configuration and per-worker revision consistency are unknown.
Repository HEADs must not be reported as deployed versions.
Read-only `git ls-remote` confirmed remote `main` matches each candidate above.
No push was performed. Auto-deploy may have acted on earlier user pushes; remote
branch state alone cannot establish whether a deployment started or succeeded.

Provide authenticated Render access (or perform the hosting steps with the assistant
checking sanitized results). Do not paste API keys, verifier/session cookies or full
environment exports into chat. Existing rollout authorization need not be repeated.

Before any deployment, establish the active website/Backend revision and current
schema baseline. If Backend hardening is absent, prepare a separate reviewed auth-only
release from that active baseline: `app/services/dashboard_whatsapp_auth_service.py`,
the two `test_personal_whatsapp_auth_*` files and relevant auth documentation. Re-run
compatible authentication/PostgreSQL checks on that exact release. Do not cherry-pick
the entire mixed Backend commit or include migrations implicitly.

## Authorized configuration and rollout plan

1. Record active revisions and the existing Backend allowed-origin value privately in
   the hosting system. Append exact `https://nihiloba.com` to
   `DASHBOARD_ALLOWED_ORIGINS` only if absent; retain legitimate existing entries.
2. Deploy the verified auth-only Backend artifact if needed, with no new migration.
   Verify every worker uses that revision and loaded configuration; no old workers
   may retain the expiry/current-eligibility defects.
3. Deploy the verified auth-only website artifact. Record actual successful deployment
   IDs, full revisions, completion times and instance consistency, not only Git refs.
4. Check the actual seller page's Continue control produces a challenge and exact
   WhatsApp continuation. Check untrusted mutation origins remain rejected on website
   and Backend. Keep browser verifier/session cookies private and HttpOnly; do not log
   links or challenge tokens. No WhatsApp messages are authorized.
5. Report challenge-only acceptance separately. The user will complete the real-message
   test; creation alone does not verify signed sender handling or one-time exchange.

## Rollback procedure

Record pre-deploy artifacts before rollout. Redeploy the recorded prior website artifact
if necessary; this may restore the known origin failure. Preserve existing shared-session
and legacy-cookie rollback guidance in `personal-whatsapp-login.md` and S3-A.
Restore only the exact recorded prior allowed-origin setting when configuration rollback
is necessary; do not remove legitimate Business entries or loosen Origin protection.
Reverting Backend hardening reintroduces verified-expiry/current-eligibility defects:
prefer roll-forward or pause sign-in while correcting the release. Do not automatically
roll back that security patch. No auth schema rollback is required because this release
must contain no migration. Revalidate Origin, cookie binding and private responses after
any rollback. Current deployed versions and rollout/live results remain **unverified**.
