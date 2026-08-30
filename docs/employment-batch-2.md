# Employment frontend — Batch 2

Status: implemented for the backend-supported authenticated candidate application experience. Recruiter workspace and candidate search remain out of scope.

## Candidate routes

- English overview: `/shida/my-applications` (also available at `/en/shida/my-applications`)
- English detail: `/shida/my-applications/{application_ref}`
- French overview: `/fr/shida/mes-candidatures`
- French detail: `/fr/shida/mes-candidatures/{application_ref}`

Every candidate page is dynamically rendered, carries `noindex` metadata and receives `Cache-Control: private, no-store, max-age=0` plus `X-Robots-Tag: noindex, nofollow, noarchive`. Private API responses use the same no-store/noindex protections.

## Authentication and backend endpoints

The website uses a same-origin BFF under `/api/shida/employment`. It relays the existing passwordless WhatsApp dashboard authentication without exposing the dashboard token to browser JavaScript. The opaque session token is stored in a scoped, HttpOnly, SameSite=Lax, production-Secure cookie. Mutations reject cross-site browser requests.

Verified backend endpoints used:

- `POST /api/dashboard/auth/request-code`
- `POST /api/dashboard/auth/verify-code`
- `POST /api/dashboard/logout`
- `GET /api/dashboard/me`
- `GET /api/dashboard/employment/applications`
- `GET /api/dashboard/employment/applications/{application_ref}`

The UI displays backend canonical status, sanitized status history, interview information, consent state and private relative-participant messages. It does not infer an application state or construct a WhatsApp/contact URL.

## Privacy boundary

The BFF parses an explicit allowlist before returning application data. Candidate/recruiter phone numbers, unconsented email addresses, candidate names, exact addresses, actor identifiers, internal notes and unknown fields are discarded. A guessed, malformed, forbidden or unknown application reference produces a generic privacy-safe not-found experience. No application content appears in route metadata, analytics or frontend logs.

Only a backend-provided verified recruiter email is retained after the backend reports accepted candidate consent. The login number is user-supplied directly to the passwordless authentication endpoint and is not stored in frontend state beyond the form submission, returned to the page or logged.

## Verified backend gaps and deferred UI

The audited backend currently has no candidate-owned endpoint to read or edit professional/occasional profile details. It exposes only the visibility mutation, which cannot safely power profile view/edit or renewal without an authoritative profile read DTO. The website therefore describes the two-profile limit and keeps profile management in SHIDA WhatsApp; it does not fabricate profile state, CV links, expiry or renewal controls.

There is no authenticated saved-jobs endpoint, so saved jobs are not presented as account data. Batch 1 device-local saves remain separate and are not described as synchronized.

Application detail DTOs do not currently return `allowed_actions`, a related public job reference/URL, requested-document records, report state, or candidate-submitted profile fields. To respect the backend-authority rule, the website renders application detail read-only and does not infer when reply, interview acceptance, withdrawal, email consent or reporting controls should appear. Those controls can be connected when the backend includes authoritative allowed actions and the supporting state in the candidate DTO.

## Verification

Automated coverage includes canonical EN/FR status labels, compact list and detail rendering, timeline/messages/interview display, empty state, strict DTO privacy, generic guessed-reference handling, unauthorized access, session-cookie handling, private cache/index headers and private metadata regression checks.

Batch 2 stops here. Recruiter application management and candidate search have not been started.
