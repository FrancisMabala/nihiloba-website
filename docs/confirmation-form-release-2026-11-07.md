# Confirmation and form correction release — 7 November 2026

This batch adds shared FR/EN/LN/SW inline presentation for native form constraints, preserving constraints, submitted data and server validation. The English browser messages came from native validation UI; setting the document language alone did not localize that UI. Errors now identify the field and focus the first invalid control.

Wenze's existing quick-sell route already contained the unified layout. Remaining older presentation included prominent quota/refresh controls and incomplete draft summaries. Those controls are secondary, saved photos and actual progress are shown, and failed status/deletion operations retain their confirmation dialog and retry intent.

Apartment cards use real saved information, private photo access and readiness rather than internal identifiers or invented wizard progress. Explicit revision-checked private draft discard requires backend 387176c6. It does not affect published properties or other drafts. No migration is required.

Services financial forms distinguish unsaved edits from saved-data deletion. Restaurant intake and guest auto-accept use shared confirmations. This is an incremental release: remaining native restaurant/Business dialogs and custom/file/backend validation audits are still pending; platform-wide completion is not claimed.

Validation: production webpack build and TypeScript passed; focused lint passed with three existing financial-panel effect warnings; 47 apartment browser tests passed across FR/EN/LN/SW and mobile/desktop. Apartment deletion screenshots inspected at 390 and 1440 pixels. The backend's 33 PostgreSQL tests passed with no skips. Synthetic browser fixtures never changed production data.

Wenze browser regression: 22 passed across four languages and five viewport widths, including saved-draft confirmation checks.

## Restaurant stock archive confirmations

Reuses the shared accessible warning dialog in FR/EN/LN/SW. Archiving makes the item inactive and retains stock/history; canonical backend rules continue to reject menu-linked or reserved items. Failed actions stay open, and uncertain retries reuse the exact operation key and revision. No new deletion, schema or permission behavior.

Validation: 15 Business unit tests and 18 Website browser tests passed, including four localized archive scenarios, safe focus, Escape, failed responses and retry envelopes. Both production webpack builds passed. Focused lint has no errors (one existing Business unused-variable warning). Website screenshots remain in test-results/confirmations and docs/evidence. Remaining platform-wide dialogs and custom validation work are not complete.

## Restaurant service and financial confirmations

Replaced native confirmation in basket resumption, handover, group closure, checkout/reopening, journal entries and day closure. These retain the existing server operations, permissions and revisions; no migration or deletion policy changes. Uncertain financial writes require the existing recovery check before retry. Confirmation does not verify or transfer external payments.

Validation: both production webpack builds and TypeScript checks passed; shared behavior passed 47 Business unit tests and five Website browser regressions. Website focused lint passed. Remaining restaurant navigation/guest/conversion dialogs and custom validation audit are still pending.


## Final shared-dialog follow-up

This follow-up completes the native confirm/alert/prompt replacement audit in both frontend repositories. The earlier pending-dialog notes above describe prior release stages. TypeScript symbol-resolution inspection found zero application calls resolving to browser confirm, alert or prompt (22 Website and 13 Business calls resolve to local functions). Browser-controlled beforeunload warnings remain for tab closing/reloading; they cannot use a custom translated modal.

Shared asynchronous navigation confirmation now covers Restaurant and Services workspaces in both frontends. It preserves saved records, rejects overlapping navigation decisions, restores focus, and cancels safely when the owning form unmounts. Leaving a form is distinct from cancelling an already-sent operation.

Website guest, restaurant replacement, seller settings and service archive/reset actions use the shared dialog. Wenze inventory, financial and lifecycle confirmations await the actual action and retain errors. An uncertain Wenze write cannot be repeated from the same dialog; users must inspect the record or use existing recovery. Restaurant replacement preserves unresolved order recovery and only switches the local basket after successful update. Existing permissions, operation keys, revisions, publication and payment semantics remain authoritative.

File validation now explains size and format failures in FR/EN/LN/SW for candidate CVs, service brief PDFs, apartment photos and individual-listing photos, retaining their existing limits. Shared native-constraint validation and the previously released Wenze/Apartment corrections remain unchanged. Existing localized domain/server-error mappings remain authoritative; this is not a rewrite of every backend error contract.

Final validation: both production webpack builds (including TypeScript) passed; 24 Business tests in four targeted suites passed; nine Website unit tests passed; seven Website browser scenarios passed, including failed Wenze actions at 390/1440px, all four languages, preserved draft input and retry identity. Focused lint passed (existing effect/image warnings only); upload-helper lint passed without warnings. The prior 33 PostgreSQL regressions passed with no skips for the already released apartment discard. This final frontend-only follow-up adds no database operations, migration, dependencies or production settings. Urgent WhatsApp delivery is unchanged.

Browser fixtures use isolated synthetic records, not production writes. Screenshots remain in test-results/confirmations; unrelated stock evidence and outputs are deliberately excluded from this commit. No new worktrees or environments were created.
