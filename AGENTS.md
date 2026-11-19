<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SHIDA development policy — v3, 19 November 2026

Approved: D + R2 + M0; M1 deferred. Read and apply the complete policy at
`C:\Users\mabal\.codex\policies\shida-development-v3.txt` and target register
`C:\Users\mabal\.codex\policies\shida-targets-v3.json` before policy decisions.
These are required instructions. This replaces v2 common policy and obsolete
19/24 October release wording; preserve all repository-specific constraints.
Current narrower task restrictions and platform/repository controls prevail.
Missing policy, material conflicts or unknown effects block the affected action.

The Coordinator independently organizes workers and independent QA. Do not ask
again for qualifying D/R2/M0 actions. R2 requires every exact-source CI/acceptance,
target, compatibility, recovery and verification gate. Verify the full deployed
SHA. M0 requires a pinned DB identity and genuinely enforced no-op predeploy;
unknown migration state blocks release. Every production schema change needs
separate explicit approval. Preserve active owners, unrelated work and secrets.

## Testing and evidence

Apply the complete policy's Testing and evidence requirements. Use focused
component/dependency/regression tests and broaden for actual risk or mandatory
gates; do not automatically run the full Backend suite. Independent QA and
mandatory CI/acceptance remain required. Only D's narrow additive CI selector
exception has standing approval. Record commands, cwd, exact source and actual
results; distinguish failed/skipped/historical checks. Documentation-only work
requires diff/reference checks and git diff --check, not application builds/tests
unless a separate mandatory gate applies. Maintain versioned status and report
implementation, testing, publication, deployment and verification separately.

## WhatsApp and web consistency

Review the WhatsApp conversation and web journey together whenever an affected
marketplace, account, booking, bill or management flow changes. Keep quick actions
in WhatsApp and guide detailed work to the correct functioning web destination.
Preserve the intended action, language and appropriate account context. A link or
successful login must not grant marketplace management rights by itself.

The agreed passwordless login direction is a browser-bound WhatsApp link followed
by a one-time code entered on the originating NIHILOBA page. This is a required
implementation direction, not a claim that the current code already supports it:

- NIHILOBA starts the login request and opens the prepared WhatsApp message.
- The user sends that message to SHIDA; opening WhatsApp alone is insufficient.
- After validating the request and sender, the backend sends the one-time code
  through WhatsApp with clear guidance: "Return to the NIHILOBA page where you
  started and enter this code. Do not send the code back in this chat."
- Only successful code verification on the originating web login completes the
  sign-in. Do not claim success or automatically complete sign-in merely because
  SHIDA received the prepared WhatsApp message.
- Handle expired, cancelled, duplicated and invalid requests with clear next
  steps. Keep codes and login secrets out of links, browser status responses,
  telemetry and logs. Preserve existing account, privacy and session safeguards.
- Use clear EN/FR/LN/SW wording and accurate states in both channels. Call the
  described flow WhatsApp verification, not true two-factor authentication unless
  an independent authentication factor is also implemented.

Validate the affected WhatsApp entry, web destination, return instructions and
authentication transitions together. Shared login changes must also cover the
marketplaces that reuse the session, including account switching and sign-out.
Preserve anonymous access where the canonical module specification permits
it. Preserve member-only access where required; Meda's explanatory landing
page is public, while its listings and participation data require authentication. Update the relevant documentation
and distinguish planned behavior from implemented and deployed behavior.

## Disk usage and dependency hygiene

- Give each test run a unique directory under the operating system's temporary directory for disposable output. After success, remove the run's unused temporary artifacts. Keep only evidence required for validation or debugging.
- Present existing worktrees for owner approval before removal. Recheck ignored files, active sessions and processes, and incoming dependency links immediately before using Git's non-forced worktree removal.

- Create worktrees only when needed; first reuse a clean, inactive checkout when safe. Reuse compatible environments where practical.
- Remove finished worktrees with Git only after verifying their work is preserved on the intended remote, there are no unique changes or evidence, and no active task or shared dependency depends on them. Never force removal to bypass those checks.
- Reuse existing compatible Python environments and Node.js dependencies. Inspect manifests and lockfiles before installing; do not repeat setup when the environment already works.
- Avoid unnecessary global installations and new dependencies when existing tools suffice. Keep dependency and lockfile changes limited to the approved task.
- Check free disk space before substantial installations or builds. Do not rebuild unchanged projects; use checks appropriate to the actual changes.
- Inspect existing worktrees, their Git status, unpublished commits and active tasks/processes before creating another checkout. Never reuse a dirty or active worktree by discarding or overwriting its work.
- Track task-created temporary files, downloads and environments, including their paths and purpose. After validation, remove only artifacts proven disposable, regenerable and unused by active work.
- Preserve unique acceptance screenshots, logs, reports, unfinished source, databases, backups, uploads and protected project mirrors. Preserve Git metadata and unpublished commits.
- Never indiscriminately delete shared caches or dependencies. Check junction/symlink targets and consumers before cleanup; measure and record the exact paths and space reclaimed.
- Report retained temporary artifacts and why they remain. Prefer compatible environment reuse and focused validation over repeated setup, duplicate installations and unnecessary full builds.

## Docker-first service testing

- Prefer the backend's `compose.local.yaml` test profile for database/service integration tests; share approved Docker services across repositories, never development or production data. Follow `docs/docker-testing.md`.
- Reuse compatible existing Python/Node dependencies for unit, lint and type checks. Do not automatically install a database, runtime, virtual environment, browser, Docker image or fallback test infrastructure. Ask before new host tooling or an additional testing environment.
- Check Docker availability, local context, installed images, free disk and port ownership first. If unavailable or broken, diagnose and report the blocker; complete compatible checks and identify unverified coverage.
- Use explicit test-only loopback targets, synthetic credentials and isolated disposable data. Never load production dotenv files or run tests against deployed endpoints. PostgreSQL concurrency checks cannot be replaced by SQLite evidence.
- Record the exact task-owned Compose project, containers and test data. Serialize suites sharing a database. Clean up only those temporary resources after success or failure; never use broad prune, remove unrelated volumes/images/caches, or run project-wide teardown against a shared development stack.
- Preserve CI coverage. Run focused affected tests locally and required release gates; report commands, results, skipped checks and retained artifacts. Avoid duplicate application images and unnecessary builds/downloads.
