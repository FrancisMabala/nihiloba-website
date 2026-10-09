# RM-V11-07C — owner POS and Free counter preference

Local implementation, 2026-10-09. Personal Pro sellers use the existing NIHILOBA Personal workspace.

The paid POS tab is controlled by the exact establishment's `restaurant.pos`
capability. Its category/search menu, separate Malewa plate groups, unit and
configured/flexible monetary selections, effective availability, counter method,
quote, handoff, receipt and last 20 counter results use canonical Backend APIs.
No customer identity, delivery data or private numerical stock is requested.
Every POS endpoint rechecks current paid authority. Access loss closes the view
and offers the basic Free counter. Staff/Recruiter station access is absent.

Both POS and the simple Free counter have one optional preparation preference.
It is sent to the revisioned basket/quote and appears in the immutable order
receipt. Editing/removing it requires a new quote; it is not an allergy guarantee
or delivery instruction. The same feature exists in Backend's WhatsApp counter.
All new copy is available in FR, EN, LN and SW.

The existing counter component and uncertain-operation envelope are reused.
Offline/stale state blocks writes until refresh; an uncertain write retries its
original key and payload. No offline sale queue or local private persistence is
added. Completed handoff still reports payment as unverified. No dependency,
environment variable, new payment or order state, hardware or deployment flag
was introduced.

Validation includes POS route/body/privacy bounds and four-language render tests,
existing Restaurant/gateway regressions, TypeScript and targeted ESLint checks.
See Backend `docs/restaurants_rm_v11_07c.md` for exact final results, PostgreSQL
race evidence, all changed files and remaining acceptance.

Deploy Backend first (existing sole Alembic head `0136`, no new migration), then
both seller frontend updates. Preserve global intake, web checkout and inventory
cleanup flags. Controlled phone/tablet/laptop, low-data, reconnect, downgrade,
long-session and live WhatsApp acceptance remain production release checks.
No production rollout, commit or push was performed.

Suggested commit: `feat(restaurants): add Personal POS and counter preparation preferences`
