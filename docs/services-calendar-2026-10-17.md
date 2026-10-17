# Personal Services calendar and sharing — 17 October 2026

The Personal provider workspace now has **Calendar**, **Opening hours** and
**Share & QR code**. It keeps the SHIDA colours, cards, navigation and shared
calendar component. All four provider languages are covered, with responsive
desktop and mobile layouts.

Providers select flexible requests or appointments for each service. Appointment
services offer weekly opening/closing times, breaks and closed days, with either
provider approval or instant confirmation. Calendar events open the existing
authorized booking detail. Appointment hours and rescheduling use Kinshasa time.
Existing flexible and quote workflows remain available for other service styles.

Published service sharing offers copying, native social sharing with a clipboard
fallback, and PNG QR download. The destination is the public service's booking
section; it shows availability, never customer bookings. Visitors do not need to
sign in to browse it. The public page preserves the existing English/French locale
support; sharing from Lingala/Swahili uses the French public page.

Customers select an available time and continue on WhatsApp. The backend validates
the exact service/package/time, and SHIDA carries that selection into its existing
booking questions. The customer sees whether confirmation is instant or needs
provider approval. A selected time is not reserved merely by opening a link.
Outdated/taken times show a clear retry message instead of an invalid booking.

Provider availability commands in WhatsApp now open the calendar with the selected
service. Login still uses the platform-wide WhatsApp code flow. Neither login nor
a shared link creates provider rights. Public link selection forwards no session.

The provider workspace removes rollout and technical explanations from its
sidebar, billing, finance, reports and delivery statuses. Categories and correction
reasons have readable localized labels. Recorded money is not presented as verified
payment, and submitting a WhatsApp notice is distinguished from delivery/read.

## Implementation

- `services-calendar.tsx` / `services-calendar-copy.ts`: calendar projection,
  weekly hours, choice of confirmation and sharing. Private reads have scope-bound
  requests, access-denial clearing and stale-response protection. Unsaved changes
  participate in the existing work guard. Uncertain writes retain the identical
  operation key and payload for retry.
- `services-management.tsx` / `services-transactions.tsx`: navigation, deep links,
  opening booking details and local appointment rescheduling.
- Personal Services API gateway: bounded calendar queries, schedule reads/writes,
  localized sharing and existing session/CSRF protections.
- Public `services/booking-link` gateway and availability panel: lazy validated
  WhatsApp links only after slot selection, with stale-slot feedback.
- Finance/bill/report components: concise customer-facing wording and labels.
- Services browser fixture: explicit appointment example, isolated from production.

No new package or environment variable is needed. Existing `qrcode` and the Backend
QR generator are reused. Backend migration **0172** must be applied before updating
the Backend, followed by this website. Old fixed-slot records are not automatically
enabled; a provider must deliberately save appointment settings. Services remains
Partial and Organization calendar UI is outside this batch.

Backend behavior, authorization, compatibility and deployment details are in
`Backend/docs/services_calendar_2026_10_17.md`.

## Verification

Final focused results: **70 unit/gateway/shared-calendar tests passed** and
**80 Services-only browser tests passed**. Production build (including TypeScript
validation), scoped ESLint and task diff checks passed. The Backend has 387
distinct latest passing results and four existing skips across its focused run
and affected reruns, with migration 0172 checked on a fresh database and compiled
offline for PostgreSQL. No full platform suite was run.

The new journeys cover EN/FR/LN/SW at 1440/390/820/320 pixels,
approval/instant controls, break editing, exact retry, revoked access, booking
detail opening, QR download and public WhatsApp selection/stale-time recovery.

Visual evidence is generated under `docs/evidence/services-calendar/`. Native
device sharing and live WhatsApp transport still need deployment acceptance;
automated browser tests use synthetic services and mocked backend responses.
