# Restaurants management redesign — 14 November 2026

## Batch 1: Aujourd’hui

The responsive overview separates preparation and ready counts, bounds actionable work to five rows, preserves active service access, and shows reservation/inventory panels only when configured and permitted. Refresh failures retain clearly marked stale data; access loss clears protected values. Counts with `+` are explicitly bounded lists, not exact totals.

The previous money source required a separately confirmed financial timezone and used lifetime linked-bill allocations. The read-only daily summary now uses establishment-local payment entry timestamps, separated currencies and net corrections/refunds, without creating a closing day or removing the confirmation requirement for financial closing. Coverage is explicitly service/POS records, not all restaurant revenue. Current outstanding obligations are shown separately.

Fullscreen and start-screen preference remain independent, with Escape and rejected/unsupported browser fallback. Stock counts filter before pagination. Overview links preserve selected order/reservation intent and stock attention state.

Validation: 4 new backend cases (Personal and Organization), 35 existing daily/inventory cases, Web 58 focused unit cases, Business 10 focused unit cases; TypeScript and component lint. Browser fixtures cover 20 language/viewport combinations (FR/EN/LN/SW at 320/375/390/820/1440), partial failures, access loss and fullscreen fallback. Synthetic browser API fixtures do not prove production account configuration. Webpack development tests bypass CSP only in the test browser; application policy is unchanged. Screenshots retained outside temporary worktrees in C:/NIHILOBA/release-evidence/restaurants-management-20261114.

Lingala and Swahili wording should receive native-language review. No schema migration is required.
