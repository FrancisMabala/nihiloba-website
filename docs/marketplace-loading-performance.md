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

## Retry focus follow-up

The overview records focus intent only when its focused retry button is activated. After a completed successful retry, if that button was removed and focus fell to the document, it focuses the existing activity heading once without scrolling. Moving focus to another control cancels this intent, including moving away and later returning to the document. Failed completion, account changes and unmount also clear the intent. Loading and partial failures keep their existing labels. Independent browser QA must verify the final completed state: an earlier BODY observation used an invalid empty-Services capability fixture and does not establish final-success behavior by itself.

## Wenze Today duplicate development reads

Read-only investigation of the unchanged Today component finds one `loadInventoryCatalogue` call per effect setup. Its product pagination uses `limit=100`; the parent catalogue uses `limit=20`. Today cleanup only marks results inactive and clears its minute timer, so development Strict Mode's setup/cleanup/setup can issue two identical inventory catalogue reads. The installed Next documentation confirms App Router enables Strict Mode by default; this repository does not override it. The provider's request function is memoized by binding, and the parent mounts Today with a store-reference key. Store changes, remounts, explicit refresh, timezone changes and the minute refresh can also rerun the effect.

Two identical `offset=0&limit=100` reads in the development QA case are consistent with Strict Mode replay; source inspection alone does not prove the runtime cause. The UI counters being correct does not establish request uniqueness. Current acceptance uses the assigned development HTTPS runtime to verify no parent `limit=20` Today catalogue request and correct stock counters. Production-mode request uniqueness remains deferred; no new environment is required for this acceptance. If a future production-mode browser run is assigned, use the same synthetic route and record initial requests before 60 seconds or interactions, then navigate away/back and switch store separately. Persistent duplicates would require effect/remount or request-initiator evidence before extending scope. No Today, provider or Strict Mode setting change is made in this follow-up.
