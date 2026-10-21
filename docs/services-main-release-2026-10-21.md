# Services main integration — 21 October 2026

The user now authorizes main release of the approved Services redesign, lifting
the earlier branch-only hold. **Customer PDF uploads remain disabled.** The user
separately approved the backend backup/schema checks and additive migrations.

Held Services commit `f3494a5` is integrated with released main `9dd268d` in an
isolated checkout. Unrelated active work and unpublished École checkpoints are
preserved. The provider workday, calendar/hours, sharing, private proposals and
customer task handoffs retain their existing ownership/capability checks.

The broader browser run caught a real template-application race: the result was
opened before the pending-operation leave guard cleared. The callback now runs
after that guard is removed, so a successful saved quote/bill opens without a
false discard prompt. Uncertain saves still preserve their exact retry payload.
The browser regression checks the applied amount, one application per target and
no unexpected dialog. Older report/navigation tests now use the current headings,
Kinshasa time element, explicit CSV download action and phone More tools menu.
No product authorization, booking rule, backend operation or dependency changes.

## Validation

- 72 Services unit tests pass after the repair.
- Production build and TypeScript pass.
- Scoped lint has zero errors; the broader held changes retain five existing
  cleanup-ref warnings. The repaired component and browser checks lint cleanly.
- All 143 Services browser cases pass on the final production build, across
  EN/FR/LN/SW and phone/tablet/desktop layouts. Coverage includes public requests,
  publication, reports, templates, exact handoffs, private proposals, calendar and
  sharing. The initial 12 failures were repaired; no cases were skipped.

Tests use synthetic fixtures and the production build, not real customer data or
WhatsApp messages. Generated test logs and incidental older screenshot rewrites
are not part of the release. Existing approved design evidence remains tracked.

## Release coordination and limits

The backend preserves Wenze 0188 and renumbers the six unreleased Services
migrations to 0189–0194. Its existing Render pre-deploy step must finish before
these frontend releases. A fresh production backup of schema 0188 passed its
quarantine restore at 11:48 UTC. No production secret or configuration is changed.

The delivery report records the actual main SHA and matching Render deployment;
this pre-release document does not itself claim the site is live. GitHub Actions
has no configured workflow. Native-device WhatsApp/QR/share acceptance remains
separate from browser fixtures. PDF scanner hosting and destructive retention
operations remain deferred pending separately approved activation.
