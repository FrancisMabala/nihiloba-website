# SHIDA Employment frontend — Batch 1

Status: implemented for public discovery and public job detail only. Candidate dashboards and recruiter application management are deferred.

## Routes

- English: `/shida/emplois` and `/shida/emplois/{slug-or-reference}`
- French: `/fr/shida/emplois` and `/fr/shida/emplois/{slug-or-reference}`
- Existing employer routes remain available because the backend already exposes the corresponding public endpoint; this batch does not expand them into full organisation profiles.

## Backend contract

The frontend uses only:

- `GET /api/public/shida/jobs`
- `GET /api/public/shida/jobs/{ref_or_slug}`
- `GET /api/public/shida/jobs/employers/{ref_or_slug}`

The typed adapter allowlists enterprise/individual offer type, professional category, vacancies, contract, seniority, work mode, schedule, broad location, deadline, start date, visible salary, benefits, private-PDF availability and opaque apply URLs. Unknown response fields are discarded.

## UX and privacy

The collection uses compact grouped professional and individual results, accessible server-backed search/location filters, pagination, loading, empty, API-error and retry states. Detail pages provide an offer overview, backend-supported content and two safe SHIDA application entry points. Save is device-local, Share uses the browser share/clipboard capability, and Report opens the official support email with only the public job reference.

Phone numbers, recruiter email, street, parcel, exact address, applicants, internal IDs and storage paths are not represented in frontend types or page props. The frontend never constructs WhatsApp links; it only accepts an allowlisted backend `apply_url`. Metadata excludes application URLs and private fields.

## Verified backend gaps

- No public organisation-verification field exists, so no verification badge is shown.
- No featured/promotion fields or filtering endpoint exists. Typed 7/14/30-day promotion UI is deferred rather than fabricated.
- No server-side public Save or Report endpoint exists; save is explicitly local to the device and reports use `support@nihiloba.com`.
- Requirements PDFs are deliberately private: the DTO exposes availability but `url` is always `null`. The page explains that the document is available through SHIDA.
- Structured responsibilities, qualifications, skills, education and languages are stored by the backend but are not present in the public DTO. The frontend renders the public description and does not infer missing sections.
- The public collection API cannot filter by offer type or professional category. Results are grouped by type within each authoritative paginated response.
- A dormant, typed promotion label supports authoritative 7-, 14- and 30-day data and refuses expired promotions or promotions beyond a passed job deadline. It is intentionally not connected until the public API exposes promotion data.

## Verification

Automated coverage includes enterprise and individual cards, visible and hidden salary, missing verification, expired and ordinary offers, unsupported featured data, filters/pagination, empty/error/retry/loading states, safe application URLs, metadata privacy, and regression checks for phone numbers and exact addresses.
