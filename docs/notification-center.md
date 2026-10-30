# Notification Center — 30 October 2026

The account shell shows the persistent backend Notification Center for the current
Personal account or explicit Organization context. Alerts remain separate from the
existing WhatsApp conversations; this adds no web chat.

Features: unread badge, module/unread/action filters, paginated history, page and
individual read controls, separate acknowledgement, activity links, optional
badge preferences and a prepared WhatsApp message. Localized in FR/EN/LN/SW.
The backend remains the authority for membership, source ownership, grants and
current source access. Session bindings and context keys prevent stale responses
from appearing after account/context changes. Private proxy requests are no-store
and writes require the same Origin. No private data is stored in local storage.

Visible-card observations, explicit reading, acknowledgement and actual domain
response are different measurements. A handoff click does not complete an action
or reopen the WhatsApp service window: the user must send the prepared message.
Urgent templates remain enabled. The agreed response target is 24 hours, preserving
shorter domain deadlines; web-only effectiveness is not established by a target.

Deploy backend migration 0207 and APIs before the frontend, only after the task's
production release approval. The existing scheduled workflow cleanup projects
source events. No browser push, new worker, dependency or credential is introduced.

Validation: production build and TypeScript checks pass. Focused notification
proxy/UI checks pass. The global test/lint baseline has unrelated existing
failures, recorded in the implementation validation report; do not report a green
full frontend suite. Website browser checks cover 390px/1440px and all four
languages, visibility observations, explicit reads, handoff and sign-out cleanup.
Business component tests cover stale Organization responses and separate actions.
