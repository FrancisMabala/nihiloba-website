# Account deletion inside Mon compte: UX correction

## Audit and diagnosis

The existing backend already checks current responsibilities, schedules deletion
for 30 days, revokes sessions, supports explicit cancellation and uses private
Support tickets for administrative review. These policies remain unchanged.

The reported failure occurred after confirmation. The previously inspected
production logs showed a 403 from passkey verification/options before any deletion
POST in that observed attempt. The frontend's generic catch conflated identity
proof failure with obligation verification failure. Missing/immature recovery
methods and fresh-login errors have separate guidance (see the preceding
`account-deletion-verification-2026-11-07.md` correction). No customer's recovery
configuration was queried. This evidence does not establish a general eligibility
outage or prove the cause of every intermittent error.

This batch additionally fixes failure-state presentation: the last obligation
list could remain apparently current, transport failures were inline, and links
and labels were generic references. Backend exceptions are still real failures;
the UI does not turn them into eligibility or blocking obligations.

## Implemented behavior and boundaries

- The existing Zone sensible starts with a short introduction and green eligibility
  action. Consequences remain collapsed. The existing two-column settings,
  identity/recovery controls, navigation and existing deletion-status page remain.
- Canonically scoped organization names and current responsibilities replace raw
  references. Restaurant cards use the actual establishment, real order state and
  date. Missing names get a localized category label. Internal references remain
  in requests and audit records, not obligation labels.
- Organization links open the exact Business settings route. Customer Restaurant
  links open the exact order or reservation. Both revalidate access at destination.
  Returning to the tab refreshes eligibility; opening a destination immediately
  marks the previous results stale. Activities without a supported exact route
  offer item-specific support review, never a generic dashboard.
- The existing shared dialog handles blocking read failures, native keyboard
  focus trapping, Escape/close, focus restoration, busy retry and duplicate clicks.
  A failed read invalidates previous results. A bound status read must confirm a
  null deletion before showing the approved no-new-request message.
- Unknown write outcomes reuse the original in-memory proof and reconcile the
  existing receipt/status. They cannot launch a second confirmation or assert no
  request. An existing scheduled receipt opens the existing status journey.
- Review is a compact contextual panel: select actual named items, explain,
  inspect the summary, then submit through the existing fresh proof and backend.
  Closing/reopening and failed checks preserve the draft. A preflight read plus
  backend locking prevents duplicate open cases. Only actual receipt/state is
  shown; clarification links open the existing private support case.
- Final confirmation stays red and retains fresh identity proof, canonical
  eligibility recheck, explicit consent, 30-day cancellation and legal retention.
  Review never executes deletion or overrides genuine obligations. Active safely
  hideable listings are not introduced as blockers. WhatsApp retains its existing
  secure handoff to this same web journey and shared lifecycle.

## Changed files

UI: `account-deletion.tsx`, `account-deletion-review.tsx`, `account-deletion.css`,
the overly broad red-button rule in `account-space.css`, optional properties in
`confirmation-dialog.tsx/css`; localized presentation in
`app/lib/deletion-ux-copy.ts` and `deletion-obligations.ts`.
Transport: `account-security.tsx`, `account-security-errors.ts` preserve HTTP status;
`app/api/shida/personal/security/[[...path]]/route.ts` permits only the existing
bound GET `delete/status` endpoint. No credentials enter URLs or browser storage.
Tests: new presentation unit/browser suite and shared synthetic security fixture;
existing security browser/gateway assertions updated for the contextual flow.

## Validation and evidence

The full unit run passed 922 tests across 122 files before the final focused
gateway addition; all 58 affected gateway/presentation/error tests then passed.
Next.js production webpack build and TypeScript passed. Changed-file ESLint has
zero errors and one retained full-document navigation warning: after scheduling,
the deliberate reload clears stale authenticated UI.

The new browser suite passed all 17 cases in EN/FR/LN/SW at 390px and 1440px,
including timeout, 401/503, retry, stale state, draft preservation, actual review
receipt, clarification, duplicate-click prevention and uncertain write recovery.
All seven shared-confirmation regressions and all 89 account-security regressions
passed, including eligible scheduling and explicit 30-day cancellation.

Actual browser screenshots are retained in `test-results/deletion-ux/` as
`obligations-{locale}-{width}.png` and `error-{locale}-{width}.png`. Desktop and
mobile screenshots were opened and compared with the approved visual. This caught
and corrected inherited destructive styling, a stretched mobile close button and
focus restoration. The dialog is centered as explicitly requested; the underlying
account layout is preserved. Fixtures are synthetic and do not prove live email,
WhatsApp provider delivery or a real customer's account state.

Backend validation: 75 PostgreSQL 18 tests passed with zero skips, covering
presentation/privacy, lifecycle, review, security boundaries and WhatsApp handoff.
The approved temporary Compose test service and empty project network were removed.
The full backend suite was not rerun for this presentation-only addition.

## Release readiness and limitations

No migration is added; backend Alembic head remains 0225. No new dependencies,
environment variables, templates, workers or schedules. Backend preview additions
are optional presentation fields; deploy that compatible backend before the
website to obtain names and precise links. Old data has safe generic fallbacks.

No production deployment or database operation belongs to this batch: the approved
brief explicitly requires separate authorization. Commits are prepared on existing
non-production task branches. Render's service inventory was checked: these task
branches are not service deployment branches. Production services use main with
automatic deployment off; staging uses its separate schema-reconciliation branch.
Recheck the release baseline and CI before any later approved deployment.

Legacy activity categories without an exact implemented web detail route retain
contextual review instead of fabricated navigation. Live provider delivery and
real customer identity configuration remain unverified. No change to Business
Dashboard source or unrelated Ecole work was made. Retain these worktrees and
their unique screenshots/reports until the release and evidence are preserved.
