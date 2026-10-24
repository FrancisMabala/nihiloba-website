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

## In progress and limitations

The full backend SQLite suite is running through the existing isolated eight-shard
runner with two workers. Failures already appear in migration head expectations
and application tests; final totals must be recorded when it finishes. It is not
reported as passing. Logs are local under logs/platform-validation/ and ignored.

Docker's Linux daemon was unavailable even after a hidden Docker Desktop start.
No local PostgreSQL integration test or live migration is claimed. No test container
was created, so there are no task containers or volumes to clean up. The new CI
PostgreSQL service is loopback-bound and disposable; its execution still needs
verification after the development branch push.

GitHub Actions execution, remote branch SHAs and post-push Render state are pending.
The intended destination is chore/infrastructure-controls-20261024; every inspected
Render code service watches main. Workflows contain no deployment step or production
secrets. Existing app-test failures and backend secret findings must block release.

## Scope

Changed files are limited to CI, local Compose, validation scripts/network guards,
ignore rules, exact false-positive fingerprints, repository instructions and docs.
No product behavior, database migration, dependency version, Render configuration,
credential, AWS setting, repository visibility or protection was changed.

The initial frontend run used a loopback environment that invalidated URL-contract
mocks. That runner defect was corrected; only the final isolated test totals above
are evidence. Earlier temporary logs are not the final result.
