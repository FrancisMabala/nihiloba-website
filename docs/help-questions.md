# Aide et questions

Local implementation; no deployment or production messages.

The shared account dropdown places Help and questions immediately below account
settings. The existing account shell now supports `view=questions`; a bell link
can select an opaque `question=SCT_…` reference. Technical/account reports remain
at `view=support`.

The page has Ask, My questions and FAQ destinations with EN/FR/LN/SW copy. Drafts
are held in component memory per thread, never browser storage. Switching the
page's tabs or a failed request preserves text. Successful submissions clear only
the corresponding draft. Stable request keys and a synchronous UI lock support
safe retries and double-click prevention. Session changes discard private state.

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
