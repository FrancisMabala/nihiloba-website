# Connected workspaces, individual applications and responsive cards — 15 November 2026

## Delivered scope

Wenze and personal Services reuse connected cream navigation, real business identity, guarded switching, flat destinations, mobile drawers and fullscreen. Services consolidates opportunities/proposals, profile/settings and financial document templates without changing endpoint authorization. Existing deep-link view identifiers remain supported. Financial APIs retain their existing account scope; this is not a new financial tenancy model.

Services counter confirmations now retain a sale snapshot independently of basket cleanup, including subsequent payments. Paid requires a zero recorded balance. Print options are disclosed separately. Wenze shares the centred native dialog presentation and preserves existing receipt actions. No payment, stock or mission-completion calculation changed.

Individual job details present recorded compensation, frequency/days, hours, start date, mission and requirements without invented defaults. Apply opens the existing occasional-work profile review. An optional 800-character message survives reload/profile editing and retry in session storage scoped to the session binding and offer, with a one-day expiry. Submission rechecks the offer/profile version; duplicate clicks and uncertain responses reconcile through the existing idempotent API. Existing applications link to their own record. Employer-side message visibility continues through the existing application API; no new private profile fields are exposed.

## Long-text root cause

The followed-company row placed the name, repeated-name description and switch in competing flex columns. It now uses one flexible text column, a compact logo and an independently sized switch; narrow containers move the switch below. The full name remains readable and the translated description asks only to alert for new offers. Existing alert permissions, persistence and delivery-channel calls are unchanged.

Shared row, seller identity, Wenze product, Services basket/catalogue and restaurant basket text columns now shrink safely and wrap at word boundaries. Uninterrupted strings use overflow-wrap only as a fallback. Mobile controls stack where columns cannot fit. No global clipping, break-all rule or reduced font-size workaround was introduced. Equivalent shared CSS fixes were applied to Business.

## Validation

- 27 Playwright cases passed in a final combined run: alerts, Wenze, Services, individual applications and restaurant menu cards. Widths: 320, 360, 390, 820 and 1440 CSS px. Four-language alerts also passed at 200% root text size.
- Alert toggles persisted after reload; unavailable-company controls remained disabled. Long and short names, a 120-character uninterrupted string and missing logos were exercised.
- Services used synthetic partial payments; receipt identity/balance survived a focus refresh, receipt expansion and explicit dismissal. Templates remained accessible. Drawer Escape and page overflow checks passed.
- Application checks covered retained messages, missing profile, closed offers, explicit retry, double click and a lost POST response resolved by reading the saved application. Public-detail screenshots used the existing process-local jobs fixture.
- 94 focused unit tests passed: jobs marketplace/discovery/privacy gateway/search (69), Services counter/navigation and Restaurant navigation/counter contracts (25).
- Affected ESLint: no errors; two pre-existing Services effect-dependency warnings remain. Both production builds and TypeScript passed on Node 24.22.1. Web used webpack because its reused node_modules junction is outside Turbopack's local root; Business used its normal Turbopack build. No dependencies or lockfiles changed.
- git diff --check passed. No full backend suite was run.

## Evidence and limits

Desktop/mobile before and after alert images and representative Wenze, Services, application, job-detail and restaurant screenshots are retained under `C:/NIHILOBA/release-evidence/layout-batches-20261115/`. Browser tests use isolated loopback fixtures and block external requests; no real payments, applications or notifications were submitted. Existing authentication and WhatsApp destinations remain intact, but real WhatsApp, physical printers, backend concurrency and every unrelated SHIDA page were not re-tested. All new copy has FR/EN/LN/SW entries; the enlarged-text matrix specifically covers alerts, not every page in every language.

A separate Business preview-server launch was rejected by automatic approval review without a more specific reason. Business shared CSS, TypeScript and production build were validated; its separate browser session was not verified in this batch. Prior restaurant checkout browser evidence is recorded in restaurant-navigation-checkout-20261115.md.

The user's final direct request authorizes deployment and supersedes the earlier no-deploy wording in the attached specifications. This release includes the previously validated restaurant navigation/receipt foundation. Existing unrelated worktrees, unfinished Ecole work and shared dependencies are preserved. Screenshots remain outside the repositories; test/build output is regenerable.
