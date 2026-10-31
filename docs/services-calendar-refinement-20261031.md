# Services Calendar and Opening Hours — 31 October 2026

## Release status

The preceding Requests & Jobs release, `6c690a5e6a977f39a952b2746ebf3fac1b299085`, was pushed to remote main and verified Live on Render (website service `srv-d9s8g1c9v7es73effevg`, deploy `dep-dbj1b267bikc73e4v600`). A signed-in, read-only check verified the three tabs and honest empty state. No CI statuses were exposed by the available combined-status endpoint; this is not a claim of green CI.

This Calendar implementation is on `feature/services-calendar-refinement-20261031`, not deployed. The supplied release brief explicitly requires authorization for this specific release. No backend changes, migrations, production records, notification policies or urgent WhatsApp templates were changed. Rollback target for a future Calendar deployment is `6c690a5`.

## Implementation batches and reused architecture

1. Availability and safe copying (`64a406c`): added a read-only website proxy that calls the existing public `getServiceAvailability` function. It returns available slot times only, with no credentials, customer information or booking links. Added interval validation and explicit-destination copying that preserves source breaks and untouched days.
2. Calendar and hours presentation: retained shared `ShidaCalendar`, service selection, Calendar/List views, month/date navigation, protected calendar projection and detail actions. Added selected-day agenda, start/end times, semantic status dots, today indication and compact weekly hours with a focused day editor. Copying shows changes before applying them. Saving retains existing revision checks, operation keys and identical retry payloads.
3. Booking preview, localization and validation: preview reads saved public availability for the selected service/date; unsaved changes are explicitly labeled. Added error/retry, loading, flexible-service and genuinely unavailable states. Existing confirmation modes, duration requirements, public WhatsApp handoff and access checks remain in place. All new copy uses EN/FR/LN/SW dictionaries.

## Availability audit and acceptance scenario

The backend's `service_provider_schedule` module is the source of public availability. Working intervals define breaks as gaps. Slot generation uses actual service duration, excludes past/out-of-window starts and conflicts across the provider's shared resources. Accepted, confirmed and in-progress reservations occupy capacity; pending requests do not reserve it. Approval rechecks conflicts. Changing hours does not cancel confirmed appointments.

For 09:00–17:00 hours, a 12:00–13:00 break, a confirmed 10:00–11:00 appointment and a 60-minute service, the controlled browser demonstration shows 09:00, 11:00, 13:00, 14:00, 15:00 and 16:00. The existing backend tests separately exercise real slot calculation and conflict exclusion; browser fixtures test presentation and interaction, not a second availability algorithm. No demonstration records were inserted into production.

Personal service scheduling currently uses Africa/Kinshasa. The UI labels this explicitly and retains timezone conversion. The existing schedule/resource tests cover timezone and conflict behavior. Arbitrary provider timezones and DST scheduling are not added by this release.

## Validation

- 42 existing backend scheduling/resource tests passed (`test_service_provider_schedule.py`, `test_service_calendar_resources.py`), using a local test database.
- 16 focused frontend unit/component tests passed: planner proxy/copying, Services calendar, shared calendar and calendar presentation.
- 13 browser tests passed: five widths (360, 390, 768, 1024, 1440), EN/FR/LN/SW, month/list navigation, interval edits and breaks, reviewed copying, exact uncertain-save retry, reload persistence, service isolation, invalid/closed days, draft navigation protection, error versus empty states, missing duration, and existing public booking stale-slot/WhatsApp handoff behavior.
- Targeted ESLint, production build/TypeScript and whitespace checks passed. The entire backend suite was intentionally not run.

## Visual evidence

Controlled test fixtures are used in these images. The green/cream styling follows the reference, with a monthly grid beside the agenda on desktop and stacked content on mobile. Unsupported reference controls and invented appointments are omitted.

- [Desktop calendar](evidence/services-planner/calendar-1440.png)
- [Desktop opening hours and live-preview layout](evidence/services-planner/hours-1440.png)
- [Mobile calendar](evidence/services-planner/calendar-390.png)
- [Mobile opening hours and preview](evidence/services-planner/hours-390.png)
- [Focused break editor](evidence/services-planner/edit-break.png)
- [Copy review](evidence/services-planner/copy-hours.png)
- [Unavailable preview](evidence/services-planner/preview-full.png)
- [Preview error](evidence/services-planner/preview-error.png)

Additional width and localization captures are in `docs/evidence/services-planner/`.

## Files and limitations

Modified: `services-calendar.tsx`, `services-management.tsx`, `shida-calendar.tsx` under `app/components/shida/`.
Added: `services-hours-editor.tsx`, `services-booking-preview.tsx`, `services-planner.css`; `app/lib/services-hours-model.ts`, `app/lib/services-planner-copy.ts`; `app/api/shida/services/availability/route.ts`; focused unit and browser tests.

The protected calendar projection does not expose customer names or addresses, so the redesigned agenda does not invent them. Manual appointment creation, date-specific time off, custom buffers and available-day calendar dots are not implemented in this Personal service system and are not presented as working features. Preview availability is a snapshot; booking always rechecks it. Existing account-specific rights and WhatsApp conversation behavior remain authoritative.
