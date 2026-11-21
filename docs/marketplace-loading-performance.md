# Marketplace loading improvements — 21 November 2026

Baseline: `59731a72ee8dce03fc98eb8b81b0d6e9465a0a48` in the Website release worktree.

## Request dependencies

Mon espace previously waited for every marketplace group, navigation, personal listings and properties before showing any overview activity. The overview now publishes each complete group as it settles, retaining a localized loading status until the remaining groups finish. Wenze current and archived shops remain one group; Services profiles and capabilities remain one group. Management/profile selectors continue waiting for their complete context. A pending overview cannot trigger the individual-only shortcut or display an empty welcome. Retry clears the prior result; cleanup prevents old-account responses from publishing.

The header and account overview share overlapping navigation requests for the same session binding. This is an in-flight transport optimization, not a permissions cache. Completed results are removed, bindings are isolated, each reader can cancel independently, the final departing reader cancels transport, and identity events invalidate outstanding reads. Existing no-store/session headers and authentication checks remain.

Account sidebar navigation uses the Next router after the existing unsaved-work guard. Modifier clicks and other origins keep normal browser behavior. Independent browser acceptance must cover query synchronization, Back/forward, mobile selector focus and cancelled/confirmed draft departures.

Emploi starts its optional category request alongside the job collection rather than after it. Existing category fallback and public-client parsing/cache settings remain.

Wenze initialization resolves its store and destination before choosing data. Orders, Today, finance, reports, inventory and shop destinations no longer await the parent's product-list request. Catalogue and product deep links retain that request, filters and offset. Today independently fetches its inventory summary and inventory catalogue for stock counters; those reads remain necessary and unchanged. Subsequent catalogue navigation still loads products. This follows the existing Business destination-first pattern.

## Validation

Focused local tests cover navigation transport sharing, no completed cache, account isolation, cancellation, invalidation, failures/retries, progressive groups, complete-context consumers, four-language loading/empty states, Wenze initialization destinations, catalogue deep links, and concurrent Emploi reads. Actual commands/results and independent browser measurements belong in `release-evidence/marketplace-loading-fix-20261121`.

Lifecycle unit harnesses execute real effect callbacks with synthetic transport; they do not establish browser hydration, focus, layout, physical-device behavior or real API performance. No production data or providers are used. No database, API contract, dependency or CI change is required by these Website edits.
