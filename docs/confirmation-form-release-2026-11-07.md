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
