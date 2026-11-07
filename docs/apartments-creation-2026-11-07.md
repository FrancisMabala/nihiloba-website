# Apartment creation UI — 7 November 2026

Implemented the approved three-step layout with general information, location,
property features and amenities cards, advice sidebar, review photos and explicit
publication confirmation. FR/EN/LN/SW use apartment-form-copy plus existing canonical
marketplace and creation translations. Existing building artwork is reused.

Reused ApartmentCreation, WenzeBuyerProvider, PrivatePhoto, useWorkDraft,
WenzeLeaveDialog and the canonical apartment API. No parallel creation/deletion system.
Save-and-exit navigates only after success; failed saves keep data visible; leaving
without saving preserves the existing saved draft. Restoring a draft uses its saved
step without creating another listing. Pending uploads cannot be silently discarded
by save-and-exit. The existing three-choice leave dialog and backend revisions remain.

Advertiser identity is readonly from the authorized account/profile. Property types
and roles remain canonical. Kinshasa communes reuse backend suggestions; no complete
city/quarter catalog exists for this flow, so manual locality entry remains available.
Changing city/commune clears dependent locality inputs. No private address is copied.
Rooms/bedrooms are blank until answered; nonresidential types do not require bedrooms.
Unknown amenities remain unknown. Existing 2,000-character description, USD monthly
integer rent, 5–10 photos and 5 MB per-image limits are retained rather than inventing
different backend rules from the mockup.

Validation: typecheck passed; lint zero errors / 11 pre-existing warnings; production
build passed using isolated fixture API. 8 apartment gateway tests and 17 browser
cases passed (creation/publication, unfinished upload, retention resumption, failed
save, retry and discard across all four languages). French screenshot recapture also
passed two creation cases. Desktop/mobile screenshots are in
[evidence](evidence/apartment-wizard-2026-11-07/), covering 360/390/768/1024/1440 and
review at 390/1440. Browser records and images are synthetic fixtures only.

Backend validation: 39 PostgreSQL tests passed, zero skipped. Backend release requires
approved additive migration 0226 first, then backend deploy/live commit verification,
then this website deploy/live commit verification. Production migration remains
unapproved; this document does not claim the apartment release is live.

No dependencies, secrets, environment switches, workers or notification changes.
Remaining limitations: full city/quarter catalogs and higher-resolution alternate
artwork are not introduced; Organization apartment management remains outside scope.
