<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Controlled development and production releases - 24 October 2026

This policy supersedes the 19 October authorization for direct production pushes
and automatic deployment. Codex is autonomous in development; production changes
require explicit owner approval for the specific release or operation.

- Keep main as approved production release code. Use feature/*, fix/* or chore/*
  branches. A persistent develop branch is not required.
- Implement agreed work, update documentation, run relevant checks, commit locally,
  and push non-production branches autonomously. Verify the destination is not
  linked to a production service before pushing. Pull requests are permitted.
- Never merge into main, push to any production-linked branch, or trigger a
  production deployment without explicit approval. Passing CI is not approval.
- Visibility, branch protection/rulesets that change workflows, production settings,
  credentials, AWS backup jobs/retention/permissions, paid staging, destructive
  cleanup, and production database/migration operations require specific approval.
- Inspect branch, worktrees, staging, remotes and outgoing history. Stage only
  task-owned files. Preserve unfinished Ecole work, untracked files and checkpoints.
  Never reset, clean, stash, switch or rebase an active dirty checkout to release.
  Use an isolated worktree from fetched origin/main when unrelated work is present.
- Run repository-required tests and checks; never skip failures to obtain green CI.
  Use fresh disposable local databases, separate from development and production.
  Never inherit production credentials or dotenv files into automated tests.
- Never print or commit secrets. Secret scanning may inspect tracked history with
  fully redacted reports; it must not read local ignored secret files.
- Never force-push, bypass protection, rewrite shared history, delete production
  data/resources, or modify customer data under ordinary development authorization.
- Verify branch pushes against remote SHAs. Verify CI and, for an approved release,
  the exact live Render commit. HTTP health alone is not deployment evidence.
- Report completed work, checks/failures, commit references, access limitations,
  pending approvals and remaining risks. Keep synced project sources read-only.
- This policy does not bypass platform approvals, GitHub permissions or protections.

See docs/infrastructure/README.md for the audit and controlled release runbook.

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
Keep public browsing available without sign-in. Update the relevant documentation
and distinguish planned behavior from implemented and deployed behavior.
