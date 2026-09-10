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
