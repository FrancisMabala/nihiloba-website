# Employment public marketplace design

The English and French employment collection pages now follow the Services and Wenze public marketplace design: a cream background, serif hero, existing employment illustration, forest and gold accents, rounded search panel, offer-type pills, responsive result cards, and candidate-space invitation.

Keyword and city search remain visible. Area and commune filters open automatically when active. The new All offers link preserves search criteria and resets pagination while removing the offer-type selection. Search, clear, type selection, pagination, empty results and unavailable/retry behavior retain their existing server-rendered URLs. The candidate links use `/shida/my-applications` and `/fr/shida/mes-candidatures`.

All new styles are scoped to `.jobs-public` or dedicated `jobs-public`/`jobs-search` selectors. Job details, employer pages, application authority, privacy filtering and backend contracts are unchanged. The illustration reuses `public/home/employment.png`; no new image dependency is needed.

## Historical report and evidence

The [complete 16 October implementation report](history/employment-public-design-2026-10-16.md)
is archived with its original validation results, limitations and release notes.
Those results are historical evidence, not a fresh test run or a claim of live
acceptance. This existing path remains the current guidance entry point so
existing Website and Backend references continue to work.

The archived report preserves the synthetic-data validation caveat and the
recorded development-server access error. No new production availability or
acceptance claim is made by this documentation cleanup.
