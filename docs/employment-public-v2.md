# SHIDA Employment public V2

The NIHILOBA website is the anonymous, read-only discovery layer for one Employment marketplace. Professional results may be `direct` SHIDA offers or verified `external` offers; external vacancies are not a separate marketplace. Private/individual offers remain separate within the same Employment experience.

## Authority and lifecycle

The public Backend DTO is authoritative for `origin`, `status`, `lifecycle_state`, deadlines, capabilities and application availability. The website does not calculate expiry or reproduce the Backend's seven-day post-deadline archive policy. Active lists use Backend ordering and filtering. Historical `expired`, `archived`, `closed` and `source_invalid` detail projections remain readable when returned, have no application action, and are not indexed.

## Batch 5A structured contract

The website parser now consumes the structured Employment fields introduced by Backend Batch 5A. Cards prefer `summary_preview` over the legacy preview, show the Backend's exact `deadline_label`, and render `salary` only when the public salary projection is present. Raw contract and work-mode labels are retained as safe fallbacks for values outside the known vocabulary. A missing historical slug falls back to the opaque public job reference for navigation.

Detail pages use the same core layout for direct and external jobs. They render the non-empty structured summary, responsibilities, qualifications, experience, education, skills, languages, personal qualities, benefits and employment conditions in a stable order. Repeated semicolon delimiters are cleaned without inventing content. `description_fallback`, then `description`, is used only when structured content is absent.

## Application actions

- The nested `application` projection is authoritative. A primary CTA is rendered only when `application.available` is true and its declared capability resolves to a safe supported action. No raw URL or legacy field is used as a UI fallback.
- Direct jobs retain their existing opaque SHIDA/WhatsApp action when the Backend declares `shida_application`.
- External redirect and instructions actions use the Backend-declared mode. The browser posts to the same-origin `/api/shida/public-jobs/{public_ref}/external-action` handler; that handler constructs the Backend endpoint, and validates an HTTPS redirect result. The public job DTO never supplies the browser with a raw application destination.
- Instructions are rendered as text. They are not linkified.
- `email_assisted` is not shown while the Backend omits an available public action.
- A stale or rejected action produces a safe unavailable message and never falls back to source data.

## Anonymous actions and analytics

Save and company-follow links come from `/api/public/shida/entity-actions/{target_type}/{public_ref}`. Saving always targets the job reference; following is a separate employer/company continuation and displays the employer identity. They are opaque `/go/` continuations into SHIDA; no browser profile, local saved state or web login is created. Sharing uses the canonical NIHILOBA job URL. External detail views are posted once per browser tab/session where session storage is available, without a visitor fingerprint. External shares are posted only after an explicit share click. The current Backend view/share endpoints accept external jobs, so direct shares use the native browser share flow without a failing analytics request.

## Identity, privacy and SEO

Directory organizations use `identity_type: organization_directory` and are described as public directory identities—not customers, partners or verified SHIDA Businesses. Public refs/slugs are used for routes; database IDs, source snapshots, recruiter data and pipeline actions are never rendered. Active detail pages emit conservative `JobPosting` JSON-LD using only public factual fields. External metadata says the employer published the vacancy and SHIDA lists it; it does not imply recruitment through SHIDA.

## Operational dependency

This UI depends on the Backend Batch 5A public Jobs DTO, the controlled external-action endpoint, entity-action continuation endpoint, and external view/share endpoints. Live verification still requires approved direct/external production fixtures and reachable API/CORS/network configuration. Batch 6 can expand Backend-provided email-assisted actions, direct-job analytics, and employer follow capability coverage without changing the anonymous web boundary.
