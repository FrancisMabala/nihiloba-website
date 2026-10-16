# Services booking choices and draft saves — 17 October 2026

## Diagnosis

Publishing a complete Personal service and selecting provider approval require no
additional environment variable or paid Services subscription. The existing
Backend pilot allocation exposes implemented Free and Pro functions. The
`structured_availability` capability remains unimplemented; it must not be enabled
to expose basic provider approval.

A fresh profile created through the real API returns
`home_service_available: "unknown"` and `booking_mode: null`. The old home-service
select had only yes/no options, so it displayed Yes while React retained unknown.
Saving the form echoed unknown into `PilotReview`, which accepts only yes/no and
rejected the entire request with HTTP 422. Browser fixtures previously supplied
valid choices and did not model this initial state. Separately, the booking select
was hidden behind `structured_availability`; its static fallback displayed
Provider approval even when no mode was saved and the publication checklist
correctly reported it missing.

The new Backend regression reproduces that rejection using a newly created
Personal service, then verifies an incomplete private save, explicit valid choices
and successful publication. This establishes the local defect; no authenticated
production request or production data was inspected or changed.

## Changes

- Missing, empty and unsupported saved location/home/booking values now display
  a localized Choose an option placeholder. Unselected choices are omitted from
  partial draft saves instead of being sent as invalid values or silently chosen.
- Provider approval is always selectable in the authorized profile editor.
  The publication checklist focuses the actual booking control. Help text explains
  approval and the current fixed-slot limitation in EN/FR/LN/SW.
- New fixed-slot choices still require the existing capability. A saved legacy
  time-slot value remains visible and is preserved when editing other details.
- HTTP 422 details responses keep the editable draft and display validation
  guidance. Name, service name, commune and availability input lengths match
  existing API limits. Adjacent controls stay aligned beside booking guidance.

The provider chooses Home service and Booking mode, completes the remaining
checklist, saves, then selects Review and publish. Saving alone remains private.
Ownership, authorization, privacy, revision checks, uncertain-write retry and
publication eligibility continue to be enforced by the existing Backend.

## Focused verification

- Services gateway unit tests: **15 passed**.
- Services browser checks: **13 passed** — seven new booking regressions,
  four existing mobile management journeys and two existing creation/retry and
  account-replacement journeys. The new cases cover EN/FR/LN/SW, partial saves,
  missing choices, reload persistence, publication, legacy slots, invalid saved
  values and recoverable validation rejection. Screenshots at desktop and phone
  widths were inspected; fixtures contain synthetic data only.
- Production build/TypeScript and changed TypeScript ESLint passed.
- Backend Services profile operations and pilot capability tests: **32 passed,
  4 failed**. The new create/save/publish regression passed. The four existing
  `test_stale_whatsapp_recovery_uses_shared_interactive_renderer` cases fail in
  FR/LN/EN/SW because no interactive presentation is returned. They executed before
  the newly added test, and their implementation and assertions are unchanged by
  this fix. This unrelated WhatsApp regression remains open; the Backend run is
  not reported as a clean pass.
- Backend verification used a fresh isolated SQLite database with outbound
  networking blocked. The sole Alembic head remains **0168**.

Only focused Services checks ran; no full marketplace/platform suite was run.
Browser checks use local fixture APIs and do not prove production deployment or
live WhatsApp acceptance.

## Release

Deploy the website fix to make these controls available on the live site.
Backend executable code is unchanged; its changes are a regression test and a
technical documentation update. No migration, new environment variable,
dependency, worker, cron or Meta template is needed. Existing session/origin/API
configuration remains in use. Fixed-slot scheduling remains deferred work.
Local task commits are prepared under repository instructions; this request does
not push or deploy them.

Changed website files: `services-management.tsx`, `services-workspace-ui.tsx`,
`services-provider.css`, `tests/browser/services-booking.browser.ts`, this note and
the provider-area documentation link. Backend files:
`tests/test_service_profile_operations.py` and
`docs/services_personal_provider_web_2026_10_16.md`.
