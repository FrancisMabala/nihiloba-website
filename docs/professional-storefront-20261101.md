# Shared professional storefront — 1 November 2026

## Audit and implementation

The public provider endpoint already groups eligible services by the shared Professional Profile and supplies canonical public identity, consent-filtered workplace information and anonymous verified-customer reviews. Business scope and public eligibility remain backend-owned. This release reuses those APIs; no migration or backend change is required.

A shared storefront now presents a compact identity hero, category illustration, service selection, About and customer reviews. Each offering retains its own category, price, duration and booking/quotation destination. The main profile action selects services rather than booking an unspecified offering. Sharing uses the canonical public profile URL. Uploaded photos remain real; missing photos use initials or decorative category artwork.

New shared files: professional-storefront.tsx/.css, professional-illustration.tsx, professional-share.tsx and lib/professional-storefront.ts. Both localized and default provider routes have accessible loading states. Existing discovery, detail, booking and WhatsApp handoff flows are retained.

## Identity and privacy boundaries

The public contract does not provide a configured primary category. Single-category profiles use that category; mixed-category profiles use stable neutral professional artwork, independent of service order. Adding an explicit primary-category setting is separate work. No legal registration, qualifications, guaranteed confidentiality or verification is inferred from a professional brand name.

The hero uses consented workplace locality or city only. Legacy commune lists are not relabeled as coverage. Exact workplace address is displayed only through the existing public-address consent contract. Structured service areas and remote work are not invented. Reviews remain anonymous and retain existing eligibility; the existing endpoint returns up to ten reviews and has no owner-response API.

## Validation

Production webpack build and TypeScript checks pass. Changed component lint and 37 targeted unit tests pass. Browser coverage includes five category configurations at 360, 390, 768, 1024 and 1440 pixels, single/multiple/empty/error/loading states, real review fixtures, EN/FR/LN/SW sharing, service-specific booking links, existing appointment handoff and stale-slot handling. Test records are isolated fixtures, not production data.

Urgent WhatsApp templates, financial records, authentication and management permissions are unchanged. No production booking or quotation was created for validation. Rollback baseline: c978e5ce9c3c4a9afc758ebde99d602ccfdeb93c.

Final browser result: 68 passed across storefront, discovery and existing booking regression suites.
