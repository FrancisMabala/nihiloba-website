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

The personal sidebar and header bell share the saved unread count and open the same list. A message handoff identifies one notification and its source message. Opening WhatsApp prepares the request. Sending it rechecks the sender and activity before returning the selected message. Neither step marks the notification or the conversation as read. Failed preference saves keep the chosen frequency for retry.

## Compact Notifications — 16 November 2026

The oversized rows came from `messages-design.css`: its desktop grid carried separate timestamp/action columns into mobile rows, expanded actions to full width, and gave “Mark read” its own row. Status badges repeated the existing unread dot. These notification-specific rules have been removed in favor of the shared compact layout in `notification-center.css`; the surrounding account page, header, navigation and preferences styling remain intact.

`notification-center.tsx` now renders a small category icon, full wrapping title/context, a concise browser-local timestamp and one green unread dot with a localized accessible equivalent. Read titles use normal weight. The full timestamp is available through the time element's accessible name and tooltip. Existing descriptions, question text and reporting periods are preserved without parsing or rewriting them. All new labels support French, English, Lingala and Swahili.

Web destinations are the main link, retaining the exact authorized report store/artifact or question query and a destination-specific accessible label. Previously these links did not issue a notification read action. Explicitly opening an unread web notification now persists `read` before normal navigation; on failure the user stays on the list with feedback and the unread state unchanged. Modified clicks retain native new-tab behavior and update the source list. Viewport observations still issue only `view`. WhatsApp handoff semantics remain unchanged and do not mark a message read.

`notification-action-menu.tsx` supplies the separate secondary menu with arrow/Home/End navigation, Escape/outside dismissal and focus restoration. The backend supports read and acknowledgement, not mark-unread, deletion or archive; no unsupported actions were added. Existing acknowledgement visibility is unchanged. Successful individual reads update the existing loaded rows without resetting pagination; count/bell updates use the backend count. Failed writes make no optimistic state change. If a read removes its menu, focus returns to the row link, or the selected list control when the row leaves the unread view.

All/Unread controls remain visible. Mobile activity and marketplace choices are behind Filters, with an applied-filter count and clearing action. Desktop keeps those choices visible. Bulk marking still scans **all unread notifications in the current authorized context**, independently of UI filters. Successful pages update locally even if a later batch fails, and counts are refreshed from the backend. The all-read control is disabled when no applicable unread entries are known.

Filters use `notice_mode` and `notice_market` alongside the existing route/query. On departure, history state records only the path, API scope, number of loaded pages and scroll offset. Returning re-fetches current authorized data before restoring scroll; no notification bodies, identity credentials or session bindings are persisted. Retry preserves loaded-page depth. Ordering, safe destination checks, session headers, pagination cursors and API contracts are unchanged.

### Focused validation

- Six Vitest assertions/tests across `notification-gateway.test.ts` and `notification-presentation.test.ts`: origin/session protection, canonical API forwarding, timestamp/calendar boundaries, full timestamps and safe contextual links.
- Twelve Playwright scenarios across `notifications.browser.ts` and `notifications-compact.browser.ts`, with targeted reruns after fixes: FR/EN/LN/SW, 320/375/390/430px plus 768/1440px, long/unbroken text, 200% root text, touch menus, keyboard focus/dismissal, read failures/recovery, persisted page/bell counts, filtered/global bulk scope, pagination, empty/no-match/loading/error distinctions, preference failures, and unchanged WhatsApp handoffs.
- Actual local application pages opened the expected support conversation/response and Wenze shop/report. The report download request retained the expected shop and artifact. Back navigation restored filters, eight loaded notifications and scroll. Shorter 600px and 844px viewports allowed the last rendered row/menu to scroll clear of fixed navigation.
- Targeted ESLint and TypeScript no-emit checks passed. No production build, dependency installation, backend suite, migration, push or deployment.

Browser data, writes, downloads and WhatsApp handoffs were synthetic network fixtures on the reusable local Next server. Physical Safari, native screen-reader speech, actual OS sharing/WhatsApp and real browser toolbar/safe-area transitions were not tested. Automated checks cover semantic labels/roles/focus and viewport resizing, not a claim of physical-device verification.

Before/after evidence at the same 390×844 viewport is retained in `C:/NIHILOBA/release-evidence/notifications-mobile-20261116/` (`before-390.png`, `after-390.png`). The shared runtime/dependencies are preserved; the local server is stopped after verification.
