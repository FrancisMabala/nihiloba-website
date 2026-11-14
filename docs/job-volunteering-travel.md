# Volunteering and travel — 14 November 2026

The job detail reader accepts optional `travel_requirement` (`required`, `not_required`, null) and `travel_details` from the canonical backend. It renders a localized travel section only when information exists; unknown enum values remain unspecified. Existing offers gain no inferred requirement. Contract `volunteer` displays in French, English, Lingala and Swahili.

These facts describe the employer’s offer; they do not collect a candidate’s answer or alter application, account, pay or eligibility rules. The existing signed-in full-detail boundary remains unchanged. Travel text uses the existing escaped offer-text renderer and the backend’s privacy projection.

Deploy the matching backend and marketplace before the Admin form. No migration, dependency or configuration change is required. Tests cover the actual response parser, absent/unknown/no-travel values, four-language display and desktop/mobile layout.
