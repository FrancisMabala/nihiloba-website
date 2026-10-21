# Services provider workday design — 21 October 2026

## State and release hold

Implemented locally from the approved Personal/phone/Business mockup. **Release
and customer PDF uploads remain blocked.** This batch does not push to main,
deploy, change production configuration or activate uploads. Existing authorized
document history and text requests are unaffected.

## Held branch delivery — 21 October 2026

The follow-up request authorizes pushing the approved Services history and
documents to `codex/services-provider-workday-held-20261021`. This is a development
branch, not a release approval. Keep `main`, production settings and PDF intake
unchanged. The delivery message records the remotely verified commit.
The implementation screenshots use synthetic data and are previews of the tested
application, not claims of a live deployment.

## What changed

- Services keeps the SHIDA cream, forest-green and serif visual language. Today,
  requests/jobs, calendar, services/prices and money form the main workspace.
  Reports, templates, bill appearance and marketplace opportunities remain
  reachable; existing section URLs and capability checks are retained.
- On phones, Today, requests, calendar (when permitted) and More tools use a
  labelled bottom bar. More tools opens the remaining destinations. Forms have
  readable mobile inputs and space below them for the bar.
- Today separates the upcoming schedule from requests, approvals and unread
  conversations. Empty reply queues no longer occupy separate cards. Counts
  describe the returned queues, with `+` when the API says more exist; the
  upcoming count is explicitly the next seven calendar days, not today's total.
- Sharing is available in the page header and Today. Opening hours and sharing
  open the existing calendar's corresponding panel directly. The existing
  revision-checked save, uncertain retry, approval/instant choice and QR endpoint
  remain authoritative. WhatsApp sharing opens a prepared public-link message;
  it does not claim that the user sent it or that a booking was confirmed.
- The catalogue summary remains available below Today. Duplicate quick-action
  and tools grids were removed. Calendar labels and service forms continue to
  follow the saved service category; the mockup's fictional category switch and
  people were not copied into the application.

All new wording has EN/FR/LN/SW entries. No new dependency, backend endpoint,
environment variable, migration, permission or booking rule was introduced.
`services-workday.css` is scoped to Services and does not restyle Wenze or other
marketplaces. The navigation still preserves catalogue drafts, and calendar exit
actions use the existing unsaved-work guard.

## Validation

- 72 Services unit tests passed.
- Production build (including TypeScript) and scoped ESLint passed.
- All 36 focused browser cases passed across the production-build run and the
  final 16-case navigation/sharing rerun. Coverage includes calendar hours,
  uncertain saves, access revocation, saved drafts, setup, exact task handoffs,
  Today recovery and sharing in EN/FR/LN/SW at phone/tablet/desktop widths.
  The follow-up adds a passing English 390px phone case and its two captures.
  Initial runs caught legacy mobile rules hiding labels and clipping the More
  menu. Both styles were corrected. The selected-item assertion now inspects
  the outer navigation because the phone menu closes after choosing a page.
- Reviewed desktop Today and narrow-phone sharing screenshots. Ten synthetic
  fixture captures are saved under `docs/evidence/workday/`; no real customer
  information is included. Horizontal-overflow checks passed down to 320px.
- Backend companion checks: 48 passed, covering Today, exact Organization and
  language handoffs, category presentation, account handoff and disabled PDF
  intake. No live customer, WhatsApp or database operation was performed.

Main files: `services-management.tsx`, `services-provider-navigation.tsx`,
`services-today.tsx`, `services-calendar.tsx`, `services-provider-overview.tsx`,
`services-workday.css` and the provider/workday copy modules.

The Business Dashboard companion implementation is documented in its matching
`docs/services-provider-workday-2026-10-21.md`. The backend release checklist and
its outstanding PostgreSQL/live-acceptance gates remain in force.
