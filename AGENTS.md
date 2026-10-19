<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Standing implementation and release instructions

Complete agreed implementations, update documentation, run relevant checks, and commit locally without asking again. Make routine implementation decisions independently. Commit only changes belonging to the task.

Validated task-scoped commits and direct pushes to origin/main are authorized without further confirmation, including configured automatic deployment. Follow the permanent autonomous development policy below and report validation and deployment results at completion.

These standing instructions constitute explicit authorization for task-scoped local commits and supersede any earlier requirement to ask separately before committing. All other existing instructions remain in force.

## Routine decisions and design questions

For agreed work, proceed with routine implementation, documentation, relevant checks and task-scoped local commits without asking for repeated approval. Ask only when a product/design decision materially changes the agreed experience or when a genuine required permission or missing fact prevents safe progress. Push validated task-scoped work under the permanent autonomous development policy below without further confirmation. Preserve unrelated changes and the protected project mirror.

## Autonomous execution and WhatsApp/web consistency — 17 October 2026

For agreed implementation work, execute the necessary inspection, editing,
validation and task-scoped local commit commands without asking for repeated
confirmation. Reuse applicable command approvals already granted. Make routine
technical decisions independently; ask the user only for material product/design
decisions that cannot be resolved from the agreed requirements. Do not turn an
ordinary command or an already-approved action into a new conversational approval
request. Existing explicit authorization remains valid within its task scope.

Platform-enforced permissions remain authoritative. AGENTS.md cannot disable the
app's sandbox, approval reviewer or administrator policy. Use supported approval
mechanisms when the runtime requires them, explain the exact external restriction
briefly, and never claim that all prompts have been disabled through this file.
The permanent autonomous development policy below authorizes direct pushes and configured automatic deployment without further confirmation. Preserve unrelated changes and read-only synced sources.

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
Keep public browsing available without sign-in. Update the relevant documentation
and distinguish planned behavior from implemented and deployed behavior.

## Permanent autonomous development policy - 19 October 2026

This is standing user authorization for agreed NIHILOBA/SHIDA development tasks, including task-scoped local commits and direct pushes to origin/main. No additional conversational confirmation is required for these routine actions or their configured automatic deployments. A later explicit user instruction may narrow the scope. Preserve all repository-specific product, architecture, security, privacy, localization, testing, and migration constraints.

- Carry agreed tasks through implementation, relevant documentation, validation, local commit, push, and verification. Make routine technical decisions independently; create, edit, and refactor files as needed within the agreed scope. Do not invent product policy or implement unrelated roadmap work.
- Run applicable tests, linting, type checks, builds, and relevant validation using the repository's established commands and testing policy. Fix implementation failures independently and rerun affected checks. For instruction-only changes, inspect the diff and run git diff --check; application builds and database operations are unnecessary. Report genuine blockers and pre-existing failures honestly; never bypass checks to claim success.
- Inspect branch, worktree, staging area, remote, and outgoing commits before release. Stage only task-owned changes, inspect the staged diff for scope and secrets, and commit validated work locally with a clear message. Never include another task's staged files or unpublished commits.
- Fetch origin/main and integrate only the approved work. Push directly with an explicit destination (git push origin HEAD:main) after confirming the outgoing history contains only intended, validated commits. Do not ask for routine commit/push confirmation or create a pull request unless requested or required by repository protection. If remote main advances, reconcile task-owned work safely and revalidate before retrying; never force-push or bypass branch protection.
- Preserve unfinished SHIDA Ecole work and all unrelated changes, including untracked files and local checkpoint commits. Do not reset, clean, stash, switch, rebase, or overwrite an active dirty checkout to make a release easier. When it contains unrelated work or unpublished commits, use an isolated checkout based on current origin/main and transfer only the approved changes. Do not publish unfinished work as an ancestor of an otherwise safe commit.
- Verify the push against the remote main SHA, not merely local tracking state. Inspect available CI and Render deployment status using existing authorized access; correlate a deployment with the pushed commit and distinguish queued, building, live, failed, and inaccessible states. Public HTTP health alone does not prove that commit deployed. If deployment status is inaccessible, state that clearly without inventing success or seeking secrets in files. Fix task-caused failures within the agreed scope.
- Never force-push, rewrite shared history, delete production resources/data, run destructive production operations, or change production secrets or access controls under this standing authorization. Production database access and migrations retain their existing explicit-authorization requirements. Do not open, print, log, or commit secrets, .env contents, credentials, tokens, or production connection strings. Preserve read-only synced project sources.
- Prefer a concise final implementation report over routine progress interruptions or approval questions. Report the implemented result, relevant validation, commit SHA(s), verified push, deployment status/limitations, and material remaining risks or blockers. Include repository-required report topics compactly where applicable. Ask only for an unresolved material product decision, missing essential information, or an actual external permission requirement; continue independent authorized work where possible.
- AGENTS.md expresses authorization and workflow; it cannot override system/developer instructions, sandbox limits, approval review, administrator policy, GitHub protections, or connector permissions. Respect these controls and report an actual restriction precisely. Do not claim this file disables platform prompts.
