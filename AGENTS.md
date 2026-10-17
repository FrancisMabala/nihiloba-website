<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Standing implementation and release instructions

Complete agreed implementations, update documentation, run relevant checks, and commit locally without asking again. Make routine implementation decisions independently. Commit only changes belonging to the task.

Do not push unless I explicitly authorize it, because pushing may trigger deployment. Before release, report what changed, validation results, and any migration or deployment requirements.

These standing instructions constitute explicit authorization for task-scoped local commits and supersede any earlier requirement to ask separately before committing. All other existing instructions remain in force.

## Routine decisions and design questions

For agreed work, proceed with routine implementation, documentation, relevant checks and task-scoped local commits without asking for repeated approval. Ask only when a product/design decision materially changes the agreed experience or when a genuine required permission or missing fact prevents safe progress. Do not push without explicit authorization. Preserve unrelated changes and the protected project mirror.

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
Preserve existing release instructions: push/deployment still requires explicit
user authorization. Preserve unrelated changes and read-only synced sources.

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
