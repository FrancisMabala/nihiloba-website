# Infrastructure validation — 24 October 2026

This development branch is not release-ready. No production deployment is authorized.

## Completed local checks

- All three workflow YAML files parse; Compose configuration validates.
- Both frontend npm ci installs completed. Builds and TypeScript checks passed using
  Node 24.19.0 (the system Node 22.12.0 is below the repositories' >=22.13.0 minimum).
- Website: 630 tests passed, 8 failed across 3 files. Failures are presentation
  expectations in marketplace-components, shida-page (four locales), and wenze-cart-page.
- Business: 808 tests passed, 4 failed across 3 files. Failures concern duplicate
  Organization selector labels, missing matchMedia in the test environment, and a
  receipt content-length expectation. Application files were not changed by this task.
- Both new network-isolation tests passed: explicit mocks work and unmocked fetch
  and sockets remain blocked after mock restoration. Final frontend runs use the
  existing URL-contract fixtures without inheriting application environment variables.
- Website lint fails with 4 errors/10 warnings; Business with 2 errors/10 warnings.
  Errors are existing setState-in-effect sites. They were not suppressed.
- Backend compileall, duplicate text-key check, and pip dependency consistency passed.
  Backup unit tests: 30 passed. Alembic source has one head, 0201; no live DB queried.
- Fully redacted history secret scans: frontends pass after five exact reviewed
  false-positive fingerprints. Backend has 2,445 findings pending complete triage;
  see the audit. The secret gate intentionally remains failing.

## Backend suite and local Docker limitations

The existing isolated eight-shard backend SQLite runner completed two local shards:
44 failed / 1,006 passed / 83 skipped and 96 failed / 1,318 passed / 148 skipped.
Thus the completed portion has 140 failures, 2,324 passes and 231 skips. Other shards
were incomplete. Failures include migration-head expectations and application tests.
The task-owned local process tree was stopped after these failures to avoid running
a duplicate full suite alongside GitHub CI. This is an incomplete, failing local run,
not a full-suite pass. Logs remain under logs/platform-validation/
e6d1591d90744d16b298ff10e6ad472e and are ignored. No unrelated process was stopped.

Docker's Linux daemon was unavailable even after a hidden Docker Desktop start.
No local PostgreSQL integration test or live migration is claimed. No test container
was created, so there are no task containers or volumes to clean up. The new CI
PostgreSQL service is loopback-bound and disposable. Its migration/auth/inventory
job passed in GitHub Actions in 1m20s, including a fresh Alembic upgrade. This verifies
Linux CI PostgreSQL execution; it does not establish local Docker availability.

## Remote verification

All three repositories successfully accepted chore/infrastructure-controls-20261024.
Remote SHA checks confirmed the pushes; main was not pushed. GitHub Actions started
on these development pushes and reported failures rather than hiding them.

| Repository | Validated implementation SHA | GitHub run | Observed outcome |
|---|---|---|---|
| Backend | 2d31d297bbec873a8f1eaac3bb9f9e2965415b68 | [40048402081](https://github.com/FrancisMabala/shida-backend/actions/runs/40048402081) | PostgreSQL passed; secret scan failed; full SQLite job still running at report time |
| Website | c103ba1189be1c42180baf89df5b786e9e1c592a | [40048411252](https://github.com/FrancisMabala/nihiloba-website/actions/runs/40048411252) | Secret scan passed; frontend validation failed (lint and tests) |
| Business | a9eba3d93127274cf6f860a449e3632433ced88d | [40048410489](https://github.com/FrancisMabala/shida-business/actions/runs/40048410489) | Secret scan passed; frontend validation failed |

The first runs identified deprecated action runtimes and ubuntu-latest image churn.
Actions were updated to verified v6 commit pins and Ubuntu 24.04; subsequent runs
execute those pins. No application dependency versions were changed. The final
report-only commit uses skip-ci to avoid restarting identical failing application
checks. It does not turn those failures green or authorize release; the exact code
SHAs and run links above remain the validation evidence. A future PR still needs
all required checks and owner release approval.

Every inspected Render code service watches main. Post-push deployment pages still
show API 5b74d4c4, website df1c43bc and Business 8fb1f550 live, with deployment IDs
recorded in the backend audit and no new deployment of these development commits.
Workers/crons were verified main-linked; no production deployment was triggered.
Workflows contain no deployment step or production secrets. Existing application
test failures and unresolved backend secret findings must block release.

## Scope

Changed files are limited to CI, local Compose, validation scripts/network guards,
ignore rules, exact false-positive fingerprints, repository instructions and docs.
No product behavior, database migration, dependency version, Render configuration,
credential, AWS setting, repository visibility or protection was changed.

The initial frontend run used a loopback environment that invalidated URL-contract
mocks. That runner defect was corrected; only the final isolated test totals above
are evidence. Earlier temporary logs are not the final result.
