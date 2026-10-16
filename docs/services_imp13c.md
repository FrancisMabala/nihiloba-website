# Services IMP-13C provider workspace
Current provider navigation and public design are documented in [Personal Services provider area](services-provider-area-2026-10-16.md). That update exposes the existing Free/Pro pilot functions through focused sections and retains these transaction contracts.


The existing private Services area at `/[fr|ln|sw]/shida/seller/services` (English has no prefix) now includes requests and scheduled
quotes, flexible bookings, and transaction messages. Account-completion links
work without an offering. IMP-13B saved-offering query links remain supported.

`services-transactions.tsx` renders backend-projected status, history and actions;
`services-transaction-copy.ts` supplies FR/EN/LN/SW text. The transaction contract
allowlists methods and paths in `app/api/shida/personal/services/[[...path]]/route.ts`, fixes provider/exact Organization
scope, and forwards session credentials, revision and operation keys to existing
protected Services commands. Browser input never grants authority.

Private quote drafts stay provider-only. Withdrawal retains authorized history
and blocks new demand. Flexible bookings still await provider approval, accepted
quotes recheck capacity, and no fixed-slot selection or Pro benefit is added.
Access failures clear the workspace; Organization changes unmount it; returning
to the tab refreshes authority and data. No template or dependency is added.

## Focused checks

- `npx tsc --noEmit`
- `npx vitest run tests/services-management-gateway.test.ts tests/services-marketplace.test.tsx`
- `npx playwright test --config playwright.services.config.ts`

The browser configuration runs controlled local API fixtures in Chrome. Its eight
FR/EN/LN/SW journeys cover saved offerings and transaction work, empty setup,
withdrawal history, and access loss (plus context switching in Dashboard).
These are automated adapter/UI checks, not live backend or WhatsApp acceptance.

## Coordinated rollout

Review this checkout together with Backend and the other web client. Backend
IMP-13C supplies Personal reservation adapters and message action/history DTOs.
Deploy compatible Backend before or together with the web clients; make both web
destinations available before announcing completion links. Existing origins,
session and CSRF settings must agree. Backend migration head remains `0152`;
this batch adds no migration. No deploy or live acceptance has been performed.
The Backend `docs/services_imp13c.md` contains the coordinated validation report.
