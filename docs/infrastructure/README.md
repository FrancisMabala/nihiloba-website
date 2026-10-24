# SHIDA infrastructure and release runbook

The 24 October 2026 policy is autonomous development with explicit production
approval. Keep the three repositories separate. The canonical cross-repository
audit lives in shida-backend/docs/infrastructure/audit-2026-10-24.md. Local validation
results live beside this guide in validation.md. Documentation is not proof that
dashboard settings were applied.

## Development and GitHub

Fetch origin/main; inspect local work and staging. Create feature/*, fix/* or chore/*
in an isolated worktree when the checkout is dirty or has unrelated unpublished
commits. Do not stash/reset/clean someone else's checkout. Implement and validate,
review the staged diff for scope and secrets, then commit only your work. Before
pushing, verify no production service or deployment workflow watches the target
branch. Use an explicit non-production destination and verify its remote SHA.
Open a PR to main; never merge or push main without release-specific approval.

CI runs on PRs to main and on development branch pushes. It has contents:read,
does not persist checkout credentials, consumes no production secrets, and includes
no deployment hook. Duplicate push/PR runs can occur while a PR is open; cancel
superseded runs using concurrency. Avoid pull_request_target for untrusted code.
Secret scanning is checksum-pinned and fully redacted. Existing findings must be
triaged, not globally suppressed or hidden with continue-on-error.

After successful runs, owner-approved main protection should require the exact
checks shown by GitHub: Secret scan plus Frontend validation, or Backend isolated
suite and PostgreSQL migration and concurrency. Require PRs and conversation
resolution, disallow force push/deletion, and review bypass actors. Do not require
a second human review if no second reviewer exists; the sole owner must explicitly
approve the release. Check plan support before privatizing repositories.

## Local environments

Use a clean checkout without local dotenv files for automated validation. Never
copy production .env files. Maintain the existing sanitized .env.example as the
configuration reference; set only local credentials in an ignored local file.
Backend APP_ENV is canonical; absent environment classification fails safe toward
production. Tests must use the isolated runner, which supplies APP_ENV=test.
Frontend SHIDA_API_BASE_URL must target a local HTTPS backend; existing gateways reject plain HTTP. Never point live local integration tests at production.
Business NEXT_PUBLIC_APP_ORIGIN must match the local dashboard origin. Use separate
test WhatsApp/SMTP/payment accounts only for explicitly approved integration work;
unit tests should mock delivery and must not use real provider credentials.

On Windows, use Node 22 >=22.13.0 (or a supported newer runtime), Python 3.12 and
Git. Frontends: npm ci, then python scripts/validate_frontend.py. This runner rejects
dotenv files, strips inherited application variables, sets a loopback API endpoint,
and runs build, typecheck, lint and tests. Unit-test setup blocks real fetch and Node sockets while allowing mocks to assert canonical URL strings. It runs every check and exits nonzero
if any fail. The unit-test guard is defense in depth, not an OS sandbox; do not run untrusted code with secrets. Build generates
Next route types before typecheck. Keep Playwright live-backend tests separate and
run them only with their documented disposable fixture servers.

Backend: create .venv using Python 3.12, install requirements.txt, then run:

```powershell
.venv/Scripts/python.exe scripts/run_platform_validation.py --fast-sqlite --balanced-migrations --workers 2
.venv/Scripts/python.exe scripts/check_duplicate_text_keys.py
.venv/Scripts/python.exe -m compileall -q app migrations scripts
```

The full suite uses fresh source/database copies and reports failed nodes in
logs/platform-validation/<run>/result.json. PostgreSQL-only skips on SQLite are not
PostgreSQL coverage. CI separately runs PostgreSQL auth/inventory concurrency after
a real fresh-database upgrade. Other domain PostgreSQL release groups remain required
for changes affecting those domains; use their existing release runners.

## Docker development and testing

Docker Desktop must have its Linux engine running; the ARM64 Surface should use
multi-architecture official PostgreSQL images. From the backend checkout:

```powershell
docker compose -f compose.local.yaml --profile test up -d --wait test-db
.venv/Scripts/python.exe scripts/run_platform_validation.py --postgres --postgres-db shida_auth_test tests/test_dashboard_otp_auth_postgresql.py tests/test_inventory_postgres.py
docker compose -f compose.local.yaml --profile test down
```

Always run down in a PowerShell finally block after tests. The test service is
loopback-only on 55479, on an internal network, and stores disposable data in tmpfs.
Its trust authentication is ONLY for this isolated local/CI test service. Do not
deploy it or expose its port. A port conflict must fail: inspect ownership rather
than stopping an unknown container. CI service containers are cleaned by the runner.

Optional development database:

```powershell
docker compose -f compose.local.yaml --profile dev up -d dev-db
docker compose -f compose.local.yaml --profile dev stop dev-db
```

Development uses shida_dev on 55478 with a named persistent dev-data volume;
test cleanup must not delete it. Never use down --volumes or global prune. Do not
run development and tests simultaneously unless needed. FastAPI and both frontends
can run natively; containerizing them is unnecessary for the current scope.
Other PostgreSQL suites require their exact *_test database names; create them only
inside this owned disposable service, never an existing production/copy/staging DB.

## Approval and production deployment

Before the transition, inventory every Render application service and cron: service
ID, repository, branch, auto-deploy, build/start/predeploy commands, health path,
domains, plan, environment-group names, database identity (no connection strings),
latest successful commit, and rollback candidate. Confirm existing staging/copy
databases before proposing any new environment. Record variables by name only.

Owner-approved transition completed on 24 October 2026: Auto-Deploy is Off for Business, the Wenze photo worker and all ten production application crons listed in the audit. Each saved setting was reopened and verified; cron schedules and commands were unchanged. Existing Off settings on API, website and backup were also verified. Keep existing
commands/domains/branches/database attachments unchanged. Do not alter the separate
backup job. If Blueprint-managed, separately approve matching autoDeployTrigger: off
in render.yaml to avoid configuration drift. No production configuration source change is included yet. Staging also watches main and upgrades schema at startup; review its independence before using it as a release gate.

Release checklist:
1. Record the three intended commit SHAs and any independent migration approval.
2. All required CI checks must pass for the exact candidate; review known failures.
3. Review backward compatibility and a current successful recoverable backup.
4. Obtain owner approval for merge and deploy; merging and deploying are distinct.
5. Merge approved PR(s). Verify main SHAs. Manually deploy the approved specific
   commit on the correct service, in compatibility-safe order (expand backend/schema
   before consumers; postpone contract/removal until all consumers are compatible).
6. Record Render deployment ID, commit SHA and live status. Check health and safe
   auth/routing smoke tests without creating customer transactions. A 200 response
   alone does not establish the new SHA is live.
7. If failure occurs, stop further rollout and follow the recovery procedure below.

## Migrations and database safety

Do not rewrite historical migrations or use metadata.create_all as production
migration management. Confirm one Alembic head; test a fresh PostgreSQL upgrade,
the affected prior-revision-to-head upgrade with representative synthetic rows,
constraints/indexes and affected concurrency tests. Compile PostgreSQL offline SQL
where supported. CI must not run against a production URL.

Use expand/contract: add backward-compatible nullable/defaulted structures first,
deploy compatible code, perform separately approved bounded backfills, and remove
old structures only after all consumers and rollback versions no longer need them.
Review lock duration, transaction boundaries and indexes. Never assume downgrade
recovers lost data. Before any approved production migration, verify recovery point,
schema revision, compatibility of the old app with the new schema, and maintenance
requirements. Execute only the reviewed migration with explicit authorization.

## Backup verification and disaster recovery

Do not infer current health from old files. An authorized operator should inspect
the latest S3 success manifest/version, snapshot UTC, schema revision, archive digest,
KMS/key and retention metadata, Render backup job outcome, CloudWatch freshness alarm
and SNS delivery. Do not open plaintext dumps, secret values or private recovery keys.
Record the newest verified recoverable point and its age. Keep the age identity in
owner-controlled recovery storage, separate from Render and the AWS writer.

The current source records S3 age+KMS encrypted database backups, versioning and
14/56/93-day tier retention; see ops/backups/README.md in the backend for exact
historical evidence. Verify live configuration before relying on these settings.
Cloudinary media and provider configuration need separate recovery tests. Code alone
cannot recreate secrets, DNS/account access, media or post-snapshot external effects.

Recovery by incident:
- Deployment failure: roll back to a known-good app commit only if schema-compatible;
  otherwise prepare an approved forward fix. Leave the database unchanged.
- Corruption, damaged migration or deletion: preserve the damaged source, stop or
  restrict writes under owner direction, select an approved point-in-time restore or
  encrypted backup, and restore into a NEW private quarantine database. Never restore
  over the live source. Validate revision, rows, sequences, constraints/indexes,
  ownership, auth, inventory, finance and replay/outbox consistency.
- Render outage: preserve the backup and assess provider recovery first. A temporary
  alternate service/database, networking and DNS cutover require an explicit cost
  and access plan; do not create a duplicate production stack automatically.
- Missing media: restore Cloudinary versions/assets through its approved process;
  validate access policy and URL references. A DB archive does not contain media.

Before traffic cutover reconcile post-snapshot erasures, revoked memberships/sessions,
payments, message delivery and expiring private destinations. Quarantine must block
WhatsApp/email/payment effects. Measure the full drill through application validation
and traffic restoration; isolated SQL restore seconds are not service RTO. Production
data restoration and cutover require approval even on an isolated paid target.

## Manual verification and remaining approvals

GitHub: Settings > Collaborators and installed GitHub Apps; verify Render access to
each selected repository, Actions permissions/secrets by name, and Codex access.
Settings > Branches/Rules > main: preview the proposed protections only after check
names exist. Settings > General > Danger Zone > Change visibility: change only after
individual approval and integration verification. Test authorized private access
afterward without deploying. Rotate confirmed exposed credentials under separate
approval; privatizing a repo does not invalidate an exposed key.

Render: verify mappings before the first branch push, then compare service deploy
events before/after that push. A new development branch and [skip render] commit
marker reduce risk but do not prove every integration is safe. Inspect all deploy
automation. Do not trigger production merely to test this control.

AWS: inspect stacks, S3 retention/version/encryption, scoped OIDC role trust, monitor
and notification status through existing authorized account access. No job, retention,
permission, recovery key or billing changes are authorized by this runbook.

Scaling: first measure worker count, active connections, pool occupancy, latency,
slow queries, CPU/memory and durable background-work lag. Budget total process pools
plus cron/backup/administrative connections below the DB limit. Add pre-ping/pool
limits or indexes only with measured evidence and tests. Keep durable replay and
notification responsibilities intact; do not introduce Kubernetes or microservices.

References: [Render deploy controls](https://render.com/docs/deploys),
[Blueprint configuration](https://render.com/docs/blueprint-spec),
[GitHub protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
