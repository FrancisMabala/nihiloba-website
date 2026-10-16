# Services management presentation — 17 October 2026

The Personal Services workspace now makes publication visible at the top of the
selected service and applies a consistent SHIDA presentation to all seven views.
One Personal account continues to own its provider activity; implemented Free
and Pro pilot tools retain the existing capability boundary.

## Findings and changes

The previous publish button was below the entire details and social-link forms.
It was disabled when `missing_fields` was nonempty, with only a generic message.
The bill settings preview had no example lines or amount and offered little
visual distinction between settings and the document.

- Services & prices now starts with publication status, a prominent review/publish
  control, and a localized checklist derived from the saved backend
  `missing_fields`. Checklist buttons focus the relevant field. An unavailable
  booking-mode control focuses Save, which persists the existing default with
  the rest of the draft. The backend still decides publication eligibility.
- Required details must be saved before publishing. Unsaved catalog changes
  disable publishing and the request toggle, preventing a mutation from silently
  discarding edited details. The publish request still sends the current revision
  to the existing `pilot-review` endpoint. A published eligible service exposes
  its public-page link. Draft and archived states stay distinct.
- Details, location/availability, social link, packages, reviews and archive
  actions have separate cards. Adding another service uses a compact disclosure.
  Archive/restore preserves the existing revision and confirmation behavior.
- Navigation uses consistent line icons, stronger section headings and responsive
  spacing. Overview, work, finance, reports and templates share the same card,
  form, table and action styling. Existing capability checks, retained drafts,
  transaction commands and the separate first-service setup are preserved.
- Bill settings separates identity controls from a live paper-style preview.
  Four keyboard-operable colour choices use the existing allowed accents. The
  illustrative service and USD 50.00 amount exist only in the preview; they are
  visibly labelled as examples and are never included in a write.
- The shared bill renderer has a text initial, clearer provider identity,
  document metadata, line items, total and status. Actual bills still render
  their exact frozen version data. Replaced/void states, separate issuer name,
  private-detail exclusion, payment disclaimer and printing remain intact.
- Settings now shows loading/failure/retry states, protects unsaved changes on
  exit, prevents concurrent saves and retries an uncertain save with exactly the
  original serialized body and idempotency key. A conflict reloads settings;
  denied access clears the protected workspace.

All new UI copy is supplied in EN, FR, LN and SW. Native-language acceptance is
still a rollout follow-up.

## Design references

The separation of status from the editing form was informed by
[Shopify's product details and publishing controls](https://help.shopify.com/en/manual/products/details/product-details-page).
The separate branding controls and document preview were informed by
[Stripe's invoice customization](https://docs.stripe.com/invoicing/customize).
The implementation retains SHIDA's forest green, cream, gold and serif headings.
No external assets, dependencies or third-party interface code were copied.

## Validation

| Focused check | Result |
| --- | --- |
| Services gateway, marketplace, reminder, IMP-18C and statement unit selection | 64 passed |
| `playwright.services.config.ts` inventory | 67 passed |
| Finance, reports, navigation and transaction recheck after the final panel styling | 25 passed |
| Customer statement/print and publication/branding recheck after final bill table styling | 14 passed |
| Production build, TypeScript, ESLint on changed TS/TSX files | Passed |
| Website and Backend documentation `git diff --check` | Passed |
| `alembic heads` (read-only verification) | Sole head `0168` |

Rechecks overlap the 67-test browser inventory; they are not additional distinct
tests. Coverage includes required-field focus, saved revisions, unsaved publication
blocking, four-language navigation, 320–1440 px layouts, private setup, archive/
restore, account loss, template application, booking/quote/message actions,
financial corrections, CSV reports, frozen bill history, print controls,
reminders, keyboard accent selection, preview-only sample amounts and exact
uncertain-save replay. No Backend tests were needed because no Backend executable
code changed.

Twenty-two browser captures are under `docs/evidence/services-workspace/`. Earlier setup and
provider screenshots remain historical evidence; setup rechecks write temporary
test results instead of replacing them.

The initial new browser run exposed test-only assumptions about trailing slashes
and Next's additional route-announcer alert; selectors were corrected. The wider
run then reached old bill delivery/reminder/report fixtures returning no provider
profile. These fixtures now supply a discovered provider, and the transaction
journey explicitly verifies that an empty provider discovery shows setup before
testing its valid-provider workflow. No production access check was relaxed, and
no tests were skipped or deleted.

Changed website files: `services-management.tsx`, `services-workspace-ui.tsx`,
`services-provider.css`, `services-bill-branding.tsx`, `service-bill-statement.tsx`
and its new stylesheet, plus presentation classes in the customer-history,
finance, reports and totals panels (all under `app/components/shida/`). Focused
browser changes are in provider, workspace, transaction, bill-send, bill-reminder
and IMP-16B tests, plus `tests/browser/fixtures/services-provider.ts`. This report
and the screenshots accompany them. Backend documentation updates cover the
Services specification, marketplace index, provider-web and IMP-15B notes,
follow-up TODO and `docs/services_workspace_2026_10_17.md`.

## Boundaries and release

The real signed-in production account was not available for inspection. The
code path and controlled browser fixtures establish the findings above; no
production service was published or changed. Browser tests intercept their API
responses and public fetch fixtures block external access. They do not prove
live transport, deployment or database acceptance.

No backend executable code, gateway, ownership, entitlement, schema or domain
lifecycle changed. Backend changes are documentation only. The sole Alembic head
is `0168`; no migration, environment variable, dependency, worker, cron or Meta
template is required. No full application/backend suite was run. Existing
PostgreSQL and live-device release gates remain open; Services remains Partial.

This is a website deployment over the existing Services APIs. Local commits are
prepared under repository instructions; pushing/deployment requires separate
authorization. Suggested website commit: `feat(services): clarify publishing and
refine provider workspace`. Backend documentation commit: `docs(services): record
workspace and bill presentation improvements`.
