# Ma recherche d'emploi — functional integration

## Navigation and reused flows

Mon espace now groups the candidate journey under **Ma recherche d'emploi**:
Vue d'ensemble, Offres enregistrées, Mes candidatures, Entreprises suivies,
Mes profils et CV, Mes alertes. Routes use `view=job-search&section=` with
`overview`, `saved`, `applications`, `following`, `profiles`, `alerts`.
The existing `view=candidate` route opens profiles and preserves the `job` return
context. Existing professional/occasional forms, CV handling, permissions,
visibility consent, application-detail routes and recruitment messages remain
in place. Published adverts remain under Mes annonces; its Employment management
entry retains the existing WhatsApp publisher workflow.

The overview reuses the Mon espace summary cards and primary action. Each count
links to its own tab. Saved offers, submitted applications and follows show up
to three records, with a link to the full list only when more exist. Counts
come from the account lists, not the preview length. Sections load and retry
independently; leaving and returning refreshes them. The overview adds no alert
or application writes.

For saved/followed previews the authenticated gateway accepts `preview=1`.
It reads the same account list and enriches at most three available rows with
public job locations or employer logos. No personal credential is sent to the
public projection. Missing optional fields leave the record visible.

Profile actions open `section=profiles&profile=professional|occasional_work`
and include the current record reference for an existing profile or draft.
The destination resolves it against the signed-in account. A new form creates
no draft until the candidate saves; expired drafts retain explicit recovery.
There are no schema or migration changes.

## Public Save/Follow

Job-detail actions now restore the Personal web session and request persisted
state. They call the new same-origin `/api/shida/personal/job-search` gateway,
which forwards to the backend's existing account/relationship services through
`/api/dashboard/employment/job-search`. There is no browser storage of saved
jobs, follows, profiles or account data. No candidate profile is required.

Save acts on the actual job public reference. The backend resolves the correct
organisation. SHIDA Business references and external directory references remain
distinct, with corresponding public destinations. Success stays on the job page
and links to the matching private section. Requests set desired state; local
in-flight locks prevent repeated clicks. Refresh and account-change events reload
private state, and stale session bindings are rejected by the gateway.

Signed-out actions use the existing WhatsApp/passkey/email login component.
Only `job-action=save|unsave|follow|unfollow` on an exact local job path may survive
registration return validation. The URL contains public intent, not credentials,
and never writes automatically on page load. Verified embedded login resumes
the intended state; a returned registration link asks the signed-in user to
continue. Other unsafe/credential-bearing return URLs remain rejected.

## Lists, alerts and application boundaries

Saved/followed lists have loading, retry, empty states, pagination, public links,
confirmed removal and current availability. Hidden/deleted content is not
reconstructed; expired public offers remain clearly labelled. Following does
not enable WhatsApp notifications. Mes alertes explicitly controls existing
matching-profile preferences and followed-organisation new-job preferences.
It reports the profile prerequisite only for matching alerts.

Mes candidatures reuses the current application API/view and detail links.
Opening an external application URL is not a SHIDA submission. No existing
candidate-declared external tracking service exists, so the UI says it is
unavailable. Custom alert rules/schedules also remain unavailable. Existing
application pagination/response limitations are preserved. Public phone numbers
are not introduced and recruitment messages stay attached to applications.

All new copy and navigation cover FR/EN/LN/SW. Automated locale checks verify
coverage and functioning destinations, not independent human translation review.

## Validation without a full local build

At the user's request, the full local production build is omitted because the
C: drive has less than 500 MB free. No packages, browsers or environments were
installed. This checkout uses the existing compatible Node dependencies through
a junction; do not remove the shared dependency directory.

Established validation command:
`python scripts/validate_frontend.py typecheck lint test`.

Lightweight browser command:
`node node_modules/@playwright/test/cli.js test -c playwright.job-search.config.ts`.
The installed Chrome and Vite mount the actual job-search, profile, application
and sign-in components. Only Next navigation/image adapters and API responses are
fixtures. Coverage includes persistence across reload, account changes, repeated
clicks, directory identity, verified sign-in continuation, registration links,
session-expired unsave, expired-offer removal, existing applications/profiles,
explicit alert opt-in and errors in all four languages.

This is component-level browser evidence, not full Next routing/production-build
or live-backend browser evidence. The new gateway separately has unit coverage
for origin/session binding, allowed paths/fields, bounded bodies and safe errors.
Paired backend tests exercise the durable services and real session boundary.
PostgreSQL concurrency and full backend release gates are tracked in the backend.

Task-owned browser outputs/cache are under `test-results/job-search*`, excluded
from Git. Source changes and this documentation must be preserved until released.
No production migration or data cleanup is required.

Local validation: type checking passed; repository lint passed with 11 existing
warnings and no errors; all 961 unit tests passed after integrating the latest
public-offer formatting changes from main. All 20 browser acceptance checks passed,
covering the scenarios listed above. The local full production build remains
deliberately unrun; these results must not be described as a production-build pass.

GitHub's existing full frontend validation and secret scan passed for code commit
`681cf6ebf037fc0edb2d655ef8947a7ff2995986`
([run 42873777489](https://github.com/FrancisMabala/nihiloba-website/actions/runs/42873777489)).
This includes the production build on the hosted runner, with no local build or
installation. Render automatic deployment is off; a Git push alone is not a live
release. The local task-only Vite cache (2,496,894 bytes) was removed after testing.

The final interaction check also preserves confirmed unfollowing directly on job
pages. Cancelling does not write; confirming updates persisted state. Its four
locale browser checks are included in the 20-case acceptance run.
Its final code commit `56ff8e7075997dcb9d608c4449f4943313f01678` also passed the
hosted build, full frontend checks and secret scan in
[run 42877556771](https://github.com/FrancisMabala/nihiloba-website/actions/runs/42877556771).

The candidate overview reads saved jobs, followed organisations, applications and
profiles independently. A failed read has a section-level retry and is never
counted as zero. The three summary links open their corresponding sections;
WhatsApp alert preferences remain explicit. The application count covers SHIDA
applications returned by the candidate endpoint. Opening an external application
site is not a recorded submission. Saved-job locations are not supplied by the
relationship list and are omitted rather than inferred or fetched per card.

The job detail header groups the employer identity, Follow control and link to
the employer’s other offers. The original advert remains in its own source section.
For external redirects, one click or tap opens a waiting tab and disconnects its
opener. The existing public job action resolves and validates the destination.
Failure closes the waiting tab and shows an error on the job page. Instructions
still open inline. On mobile, the application bar sits above the marketplace
navigation. The job detail browser checks hold the response pending, follow the
organisation link to another offer and verify the original page and scroll offset.

Saved offers use the paginated personal list, including unavailable rows that can still be removed. The display reuses public vacancy location and lifecycle. A failed removal keeps the bookmark and total; confirmation can be retried. The section refreshes on entry, return and removal.

The applications tab reads the same submitted applications feed as the overview. Its empty state resolves saved bookmarks only after the candidate list is successfully empty. The interview link requires confirmed status plus a valid future date and time. External redirects and manual declarations do not write to this list.
