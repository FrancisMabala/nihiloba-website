# Services professional identity — implementation review

## Scope and ownership

The backend reuses ServiceProviderProfileDB (SVI) as the shared identity, ServiceProviderDB (SVC) for each service and ServiceOfferingDB (SPK) for packages. There is no new account type, profile table, migration or provider identity. The public brand does not establish registration or professional verification. The private owner remains unchanged. Personal and Organization access remain separate.

## Implemented

- Services & prices begins with a shared professional profile and compact service overview. Forms open deliberately; archived services remain accessible.
- The authorized profile editor updates name, public bio and social link across sibling services using current revisions. The API strips contacts and private location values, checks the current owner and invalidates stale sibling revisions.
- First-time setup offers the account display name as an explicit choice or a custom professional name. Adding another service reuses the existing profile; WhatsApp also skips redundant name choice for an authorized canonical provider.
- Active Personal drafts count toward the existing five-service limit. Archived services do not. Different allowed categories share the same identity; legal and consulting retain professional_services. Backend creation, retry and restoration enforcement is unchanged.
- A four-step editor covers information, location/availability, pricing/packages and saved review/publication. Next saves the information step before advancing. A publication checklist opens the relevant step. Packages open a focused form. Changes preserve existing booking, request and archive behavior.
- Public provider pages show the shared bio, permitted social link, actual images and eligible services in compact cards. No ratings, credentials or prices are fabricated. Invalid service links return to the overview.
- EN/FR/LN/SW copy, keyboard controls and responsive layouts are provided. Fixtures and screenshots are isolated from production.

## Existing capability boundaries

The current backend requires a service duration before publication, even for flexible requests; this is explained rather than changing policy. Remote delivery, hourly/starting-price modes, new service-type fields, professional verification and multiple independent brands are not introduced. Fixed or unpriced existing packages keep their actual currency. Customer requests still require the request capability to be enabled.

Photos already uploaded through WhatsApp are preserved and displayed. New web photo upload/storage is not introduced: the profile form identifies the existing WhatsApp photo workflow. Main category and broad areas are derived from service data, not duplicated in another location directory. Existing schedules remain configured in Calendar.

## Validation and deployment

Backend: 114 focused tests passed, three PostgreSQL-only concurrency cases skipped; an additional focused run of 61 tests passed, including the new shared-identity/API/WhatsApp tests and public privacy/category regressions. Tests use disposable local databases. These are not full backend-suite results.

The preceding Calendar website release ae9eb6ca362bf9c575431da5cd4878a7d7572175 is live, verified on Render deployment dep-dbj1uujbc2fs73bk8dtg. Read-only signed-in smoke checks verified opening hours and the public availability preview. Urgent WhatsApp templates remain enabled and untouched.

This new release is prepared on feature/services-professional-identity-20261031. Backend 33b03723 must deploy before the website. No migration is required. Roll back by redeploying backend 07e6931c and website ae9eb6c; additive biography data can remain. The new release has not been deployed.

Frontend validation: production build and targeted ESLint passed; 18 gateway unit tests and 47 distinct browser checks passed, including the final legacy-response check. Desktop/mobile captures cover 360, 390, 768 and 1440px, with additional 320px regression coverage. Publication field links, missing saved selections, preserved time-slot settings, validation errors, package retries, stale edits, new-service idempotency, first-name choice and capacity messaging were exercised. The GitHub combined-status connector returned no backend statuses; this is not a green CI claim.
