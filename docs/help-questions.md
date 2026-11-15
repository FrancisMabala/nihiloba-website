# Aide et questions

Local implementation; no deployment or production messages.

The shared account dropdown places Help and questions immediately below account
settings. The existing account shell now supports `view=questions`; a bell link
can select an opaque `question=SCT_…` reference. Technical/account reports remain
at `view=support`.

The page has Ask, My questions and FAQ destinations with EN/FR/LN/SW copy.
New-question drafts remain in component memory. Conversation reply drafts and
retry keys survive reloads in tab-scoped sessionStorage, keyed by a SHA-256 digest
of the session binding (the binding itself is never stored). Only bounded draft
text and retry keys are stored, never history or identity. Entries expire after
24 hours without persistence; login/account-change events clear them, and a new
binding removes the prior binding's drafts. If storage is unavailable the UI
explains that the current page still preserves the draft. Successful replies
clear only that thread's draft. A synchronous UI lock prevents duplicate sends;
failed attempts retain their original request key for backend deduplication.

The private existing support gateway accepts only the bounded question paths and
page parameter, preserving cookie/session binding, exact-origin checks, body
limits and no-store responses. The backend remains the authorization authority.
WhatsApp links reuse the existing official number and contain a display reference
only; opening a link performs no write or send.

Validation: production webpack build, type check, focused lint and gateway tests.
`tests/browser/help-questions.mjs` uses synthetic accounts and network fixtures
against the built account page at 320, 390, 820 and 1440 CSS pixels in all four
languages. It covers failure draft retention, tab changes, duplicate clicks,
history, prepared-link privacy, account menu placement/Escape and overflow.
Screenshots and browser results are retained under
`C:/NIHILOBA/release-evidence/help-questions-20261115`.

No real user messages were sent. Production authentication and Meta delivery were
not exercised. The paired backend migration must precede a future release.

## Local continuation correction — 15 November 2026 (not deployed)

Notifications show the question context and a localized “Lire la réponse” link
to the exact existing question. They suppress technical activity references,
including responses from an older backend. History headings use a bounded,
word-aware excerpt; the topic remains secondary and the original question stays
complete in the conversation. Prepared WhatsApp links retain their Q-reference
format for compatibility. No permissions or notification settings changed.

`tests/browser/question-continuation.mjs` renders the actual notification and
question components with synthetic network fixtures in all four languages at
320, 360, 390, 820 and 1440 CSS pixels. It checks direct links, hidden identifiers,
long/unbroken subjects, shared-channel history, web replies and legacy prepared
messages. These are isolated component/browser checks, not live account or
WhatsApp verification. Evidence: `C:/NIHILOBA/release-evidence/question-continuation-20261115`.


## Customer conversation layout — 15 November 2026 (local only)

The customer conversation retains SiteChrome, the cream header/sidebar, existing
wordmark, typography and marketplace/account links. Message bubbles use the
original stored content: customer right in sage with actual initials, SHIDA left
in white with a neutral help icon. Staff identities are not added. Existing
word-aware question excerpts remain headings; the complete text stays in history.
Local dates group messages; short times have accessible full timestamp labels.
WhatsApp source labels remain secondary. Internal references stay in payloads.

The compact composer grows to a bounded height, preserves multiline input and
blocks form submission during IME composition. Completion/reopening are separate
explicit actions, and reading still only calls the read endpoint. Existing
prepared WhatsApp links are unchanged and opening them sends nothing.

The current thread refreshes every 15 seconds while visible/online and on focus
or reconnect. In-flight background responses cannot overwrite a mutation. Only
new messages are announced. The last 30 messages are initially rendered; earlier
messages from the existing full-history response can be revealed in batches
without shifting the visible anchor. New incoming replies do not force-scroll
while reading earlier messages; a localized new-message control jumps to latest.
No pagination endpoint, delivery state, notification or routing logic changed.

Verification: production webpack build, TypeScript, focused ESLint and the private
support gateway tests. `tests/browser/help-conversation.mjs` covers four languages
at 320/360/390/820/1440 CSS pixels, reload/tab/poll draft preservation, retry keys,
double submission, IME/multiline input, read vs completion/reopening, prepared
WhatsApp links, long subjects/URLs, enlarged text, reduced-height keyboard
simulation, scrolling/earlier-message anchors, loading/empty/denied responses and
storage-unavailable fallback. Data and requests are synthetic and isolated.

Automatic approval review blocked starting the local Next.js preview server.
The browser checks therefore use `SHIDA_OFFLINE=1`: an offline Vite harness renders
the actual AccountSpace and SiteChrome components, with compiled application CSS,
and Playwright intercepts all documents/assets/API requests without opening a
listening port. Next navigation/image wrappers are adapted for this harness.
This does not verify a running Next server, real device keyboards, screen-reader
speech, authenticated production accounts or live WhatsApp delivery. The private
gateway tests separately preserve authentication/binding/no-store checks.

Evidence: `C:/NIHILOBA/release-evidence/help-conversation-20261115`, including
`conversation-1440.png`, `conversation-390.png`, `conversation-results.json` and
`build.log`. The mobile screenshot review found and fixed an inherited generic
footer bottom-padding rule affecting message timestamps; the local metadata
container avoids altering the shared footer. No real customer messages were sent.
This batch is committed locally only: no push, deployment or database change.

Cleanup of the task-only build and offline fixture was blocked by automatic
approval review. Exact retained paths and verification results are recorded in
that evidence directory's `verification.md`. Shared dependencies were preserved.
