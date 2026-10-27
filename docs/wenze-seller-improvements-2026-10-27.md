# Wenze shop controls, purchase cost and local reporting — 27 October 2026

Approved scope: simplify shop controls, switch shops directly, use understandable local reporting periods, and enter optional private purchase costs with gross-margin previews during product creation. Marketplace price comparisons and supplier data are deferred.

## Website behavior

- Sharing is in Ma boutique > settings. The redundant photo-initial/status panel is absent from Products and remains in shop settings.
- The shop selector lists accessible shops, preserves the current section, updates the store/view URL, clears the old product/count/draft context and protects unsaved edits. In-store checkout switches to Orders if the selected shop is online-only.
- Quick and detailed product creation expose optional private unit purchase cost when the existing plan grants financial tools. The live preview uses the sale currency, gross margin = selling price minus purchase price, and percentage = gross margin / selling price. Missing or invalid input is not zero; a zero selling price has no percentage; losses remain visible.
- The purchase cost never enters the public product-create payload. After product creation, the existing protected private-cost API saves each created variant's cost (or the single product). The UI explains that the same unit cost applies to all variants and that individual costs can be edited later. No permission or entitlement policy changes.
- Product creation and cost saving are separate existing commands. A failed or ambiguous cost save retains a retry for remaining targets, using the existing API idempotency behavior, without creating another product. Leaving a pending cost requires the existing draft-discard confirmation. A reload can discard the unsaved cost; the product remains available and Purchase costs provides manual recovery.

## Reporting

The website sends the selected shop reporting zone for summaries, history, comparisons, CSV and on-demand PDF/Excel exports. Defaults follow Today: Lubumbashi for that city, otherwise Kinshasa, with an explicit Kinshasa/Lubumbashi selector. Date displays use the selected zone without UTC terminology. The selection is a report-view preference, not a new persisted shop setting.

Backend calculations use local calendar midnights converted to UTC timestamps for sales, and local calendar dates for expenses. Comparisons and export snapshots inherit the same zone. APIs default to UTC for old clients. Existing recurring report schedules and historical artifacts retain their established boundaries and semantics. No database migration, production data operation, new dependency or secret is required.

WhatsApp continues to direct detailed management to the existing authorized seller workspace. No outbound message, login flow or customer DTO is changed. Finance remains private and CDF/USD remain separate.

## Validation

Production build, TypeScript, targeted ESLint, money/date/gateway unit tests, and four-language browser checks cover quick and detailed creation, margin preview, private cost retry, shop selection, unsaved drafts, share placement, local-time requests, and existing inventory/checkout behavior. Backend checks cover midnight boundaries, expenses, comparisons, on-demand artifacts, default UTC compatibility, cost privacy and authorization. Live account mutation and live PostgreSQL validation are not performed; no schema changed.
