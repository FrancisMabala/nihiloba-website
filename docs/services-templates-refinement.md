# Services document preparation refinement — 31 October 2026

## November 2026 document workspace

Under More tools, Templates and appearance groups quote templates, invoice templates and document appearance. Desktop editors show the client paper beside the form. Phones offer Write and Preview. Templates prefill mission drafts. Sending a quote, accepting it, issuing an invoice and recording a payment remain distinct actions. Client papers paginate descriptions and itemised prices and use the same layout for print and PDF. Legacy issued invoices retain their statement layout.

Profile and published service sharing use the same QR panel in Services and prices. Today and Requests and jobs also open it in place. Legacy management links with a service parameter select that published service, and public QR URLs remain stable.

## October 2026 result

Quotes and Bills are separate tabs over the existing private library. New
template opens an editor only. Four steps cover basic information, supported
pricing/items, scope/conditions, and an explicitly unissued preview. Templates
can be edited, duplicated or archived; no destructive deletion was introduced.
Application remains in Requests & jobs where a specific customer target is
selected and independently authorized.

Existing services and packages can prefill the form. This copies starting values
only; it does not restrict the template to a service or change it when catalog
data changes. Category hints reuse the existing category-experience contract,
including professional services for legal/consulting, beauty, repair and
education. Unknown legacy categories receive neutral presentation.

Bill Settings prominently shows the canonical professional identity and links
to the existing profile editor. It preserves the explicit bill display name,
four existing accent colors and the same statement renderer. Its sample is
clearly labelled and never persisted or assigned a real document reference.

## Architecture and safeguards

Reused: `ServicesTemplatePicker`, transaction gateways, canonical backend template
application, bill-presentation API, `ServiceBillStatement`, draft leave guard,
session binding, revision checks and immutable uncertain-save retries. No parallel
billing engine, ledger, numbering, payment collection, notification or identity
system was added. Organization authority remains backend-enforced; this batch
does not modify the separate SHIDA Business frontend.

The backend adds quotation `terms` to existing template JSON using the quotation
validator, and exposes the existing update date. No migration is required; head
`0214` is unchanged. Deploy backend before this frontend.

Saving a template does not issue/send a document or record income. Issued bills
and sent quotations keep their existing immutable data. Money, Counter, payment
status, WhatsApp handoffs and urgent templates are unchanged.

## Validation

- 29 focused gateway/statement unit tests passed.
- Twelve browser journeys across EN/FR/LN/SW and 360,390,768,1024,1440 widths cover
  empty/populated states, service/package copy, conditions, preview, no early
  writes, identical retry after a lost response, duplication, editing, bill items,
  professional identity, accents, horizontal overflow, and applying both template
  types to customer drafts in all four languages.
- Production webpack build, TypeScript and scoped ESLint pass.
- Backend: 21 related tests passed with 4 existing PostgreSQL-only skips; the
  expanded final template tests passed 12/12. See backend audit for boundaries.
- Real-page screenshots are retained in the task outputs review. Fixtures are
  isolated test responses and never inserted in production.

## Honest limitations

Quotations currently have an agreed total and description, not itemized
quantity/unit-price lines. Bills retain their existing itemized amounts and
private line details. No unsupported email/address/logo switch or legal invoice
claim is shown. The service selector is an optional copy aid, not a saved link.
Use the existing customer-draft picker to apply a particular template.

New Templates release requires specific authorization per the approved brief.
Rollback is Reports website `1992949` and backend `17a6acf6`; no database rollback.
Restore compatible backend support before editing newly saved terms-bearing
templates if the backend is rolled back.
