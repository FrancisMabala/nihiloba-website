# Messages, My Space and account protection refinement

## Implemented scope

Messages has Notifications and Preferences views. The approved reference guides
the cream/forest palette, serif headings, cards, marketplace icons, unread dots,
status badges, compact supported filters, and responsive actions. Conversations,
email delivery switches, text search and notification-type filters are omitted:
the existing authorized APIs do not provide those capabilities for this page.
There is no web chat, new delivery system or sample production data.

The Notification Center still consumes the existing context-bound backend. It
uses server titles/descriptions and capability flags, validates list envelopes,
and keeps loading, failed, empty and filtered-empty states distinct. Action links
retain their authorized destinations. WhatsApp handoff still requests a bound,
expiring ticket and asks the user to send the prepared message. Viewing an alert
records a view; marking read changes only read state, not resolution or acceptance.
Unnecessary acknowledgment buttons are omitted in the Messages view.

Mark all as read uses the existing unread cursor API and authorized action batches
of at most 50 references. It includes other marketplaces, not just the current
filter. Repeated cursors and more than 100 pages stop with an error, not a false
success; partial completion can be retried. The header count remains the backend's
badge-eligible unread count and retains stored optional-badge preferences.

Preferences reuse `NotificationDeliveryPreferences` and the same backend
`unified_inbox_service` configuration used by WhatsApp. No storage or migration
was added. Existing frequency, daily schedule and time zone values are loaded;
focus refresh does not overwrite dirty edits. Canonical trailing-slash web API
URLs avoid unnecessary redirects. Urgent/essential delivery policy, Meta
eligibility checks and templates are unchanged.

`resolveSpaceView` resolves default, old home/overview and unknown URLs to My
Activities without a redirect loop. Existing section and inbox links remain
valid. The redundant greeting/attention/recent/quick-access presentation is no
longer mounted. Its underlying data services remain available; no widgets were
moved into Activities and no mobile menu was added.

Lost-phone recovery now has a standard green shield/protection card between
security methods and Danger Zone. Danger Zone retains only account deletion and
its existing checks/confirmation flow. Recovery entry remains available while
signed out. No passkey, verification, recovery delay, session revocation or
number-replacement logic changed.

## Files

- `app/components/shida/messages-space.tsx`, `messages-design.css`: supported
  view navigation and responsive visual treatment.
- `notification-center.tsx`, `notification-delivery-preferences.tsx`: cards,
  read actions, state handling, canonical API paths and expanded preferences.
- `account-space.tsx`, `account-security.tsx`: default destination, overview
  removal and protective recovery entry.
- `app/lib/messages-design-copy.ts`, `notification-center-copy.ts`,
  `account-design-copy.ts`, `space-view.ts`: EN/FR/LN/SW copy and route resolution.
- `public/images/shida/notifications-empty.svg`: local lightweight illustration.
- Focused Playwright/Vitest specifications and configuration cover the changes.

## Validation and limitations

Run `npm run build`, scoped ESLint, `tests/space-view.test.ts`,
`tests/notification-gateway.test.ts`, `tests/account-security-gateways.test.ts`
and `tests/services-account-navigation.test.tsx`.

`npx playwright test -c playwright.messages-design.config.ts` covers the actual
production frontend build with controlled API fixtures (no production records).
Screenshots cover populated/empty/preferences, default Activities and relocated
recovery at 360, 390, 768 and 1440 px. It checks multiple marketplaces, read versus
action state, paging, handoff presentation, failure/partial responses, keyboard
use, account removal and four locales. Existing account-design checks verify
unchanged editing/accordion behavior and zero security writes when opening panels.

The backend was not modified. Its focused Notification Center, delivery preference
and routing policy tests passed (39 tests), including real shared preference
read/write synchronization, actor/Organization boundaries, verified WhatsApp
handoff, and delivery eligibility. Browser fixtures test UI wiring, not actual
Meta delivery. No live WhatsApp messages, recovery challenges or production
preference changes are needed for visual verification.

## Release

No backend deployment, schema migration, environment change or dependency is
required. The request's deployment section requires confirmation for this change
set. Prepare the validated website commit under the standing commit/push policy,
then deploy it only after that confirmation and verify Render's exact live commit.
Smoke-test default/old-home routes, Messages/preferences and the recovery card in
the existing signed-in session without changing production preferences or read
states just for testing. Current repository CI has no website workflow.

Final validation: production build/TypeScript and scoped ESLint passed; 52 focused Vitest tests, 45 Playwright browser tests and 39 backend notification tests passed. The desktop toolbar uses its own row to prevent overlapping tab hit targets. Visual review confirmed populated/empty cards, readable actions and the protective recovery card. Render remains on 61fabbc with Auto-Deploy disabled; this change set awaits deployment confirmation.
