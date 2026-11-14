# Job report WhatsApp handoff — 14 November 2026

`JobReportLink` now opens the backend-supplied `report_url` in a new tab instead of
email, retaining its existing styling. Individual, professional and external offer
pages all pass the canonical public offer reference. French, English, Lingala and
Swahili labels no longer mention email.

The additive API field is optional for rollout compatibility. The safe-action URL
policy, numeric wa.me destination and matching final machine-readable reference
are checked before rendering. A missing or invalid URL hides the unusable action.
There is no client ticket-creation call or success message: the user must send the
prepared message and finish the existing WhatsApp support category/explanation flow.
Reporting and job application actions remain separate.

The backend owns the configured WhatsApp destination, localized prepared message,
public visibility, account resolution and support persistence. It sends only the
public projected offer title/employer/reference. No web identity is transferred or
authenticated by the handoff. Deploy the compatible backend first; no website
environment variable, dependency or migration is introduced.

See the backend's [implementation and exact copy in all four languages](https://github.com/FrancisMabala/shida-backend/blob/main/docs/job-report-whatsapp-2026-11-14.md)
for ticket context, ownership, existing admin display, replies and configuration.

Validation: 75 tests across job-report, jobs-marketplace, jobs-anonymous-contract
and public-client; TypeScript; scoped ESLint; production webpack build. Six browser
checks cover individual/professional/external offers at 390 and 1440 px. The
WhatsApp destination is intercepted locally, with no real message or production
ticket. Screenshots are retained in the task worktree's test-results folder.
