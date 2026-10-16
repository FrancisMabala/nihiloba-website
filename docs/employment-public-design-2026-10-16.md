# Employment public marketplace design

The English and French employment collection pages now follow the Services and Wenze public marketplace design: a cream background, serif hero, existing employment illustration, forest and gold accents, rounded search panel, offer-type pills, responsive result cards, and candidate-space invitation.

Keyword and city search remain visible. Area and commune filters open automatically when active. The new All offers link preserves search criteria and resets pagination while removing the offer-type selection. Search, clear, type selection, pagination, empty results and unavailable/retry behavior retain their existing server-rendered URLs. The candidate links use `/shida/my-applications` and `/fr/shida/mes-candidatures`.

All new styles are scoped to `.jobs-public` or dedicated `jobs-public`/`jobs-search` selectors. Job details, employer pages, application authority, privacy filtering and backend contracts are unchanged. The illustration reuses `public/home/employment.png`; no new image dependency is needed.

## Validation

- Existing employment, external-action and candidate tests: 88 passed across 6 selected test files.
- `tsc --noEmit --incremental false`: passed.
- `next build`: passed after the final copy change.
- Browser checks against the production build at 1440 px desktop, 820 px tablet, and 390/360 px mobile: no horizontal overflow; hero image loaded; one main landmark.
- Verified keyword/city/commune submission, automatic expanded filters, individual-only view, pagination preserving filters and offer type, All offers returning to the combined view on page 1, and Clear all.
- Verified French empty and unavailable states, retry retaining the query, and navigation to the existing candidate route.
- Visual QA used isolated process-local sample jobs and failure responses. No fixtures were added to the application or live API. This is design validation, not a claim that the production jobs API is available.

The development server encountered an existing access-denied error in `tmp/pytest-stock`; the production build and production-server visual checks succeeded.

## Release

Deploy the website through its normal release process. No migrations, environment changes, API changes or dependency installation are required. Publishing remains subject to the repository's explicit-push instruction.
