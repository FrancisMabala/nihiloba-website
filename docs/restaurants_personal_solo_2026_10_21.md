# Personal Malewa service — 21 October 2026

The personal workspace previously exposed preparation stations and a counter/table mode choice. QR guest ordering already existed, but its schedule settings were hard to find. This batch implements the user's single-seller direction: compose an assiette or sell a ready-made dish, serve directly, and record payment before or after eating. Business Dashboard station workflows remain unchanged.

## Implementation and authority

The owner-confirmed `solo_ready` action is restricted to the exact Personal establishment operator, rejects Organization and station-scoped use, and accepts only accepted/preparing orders. It reuses the canonical preparing transition (including stock hooks), marks existing station progress ready and preserves snapshots. Operation keys, expected revisions, replay recovery and handover verification remain enforced. Readiness/handover never records payment; canonical bill collection remains separate. No new personal data or public management rights are exposed.

Website changes simplify phone navigation to Vendre / Commandes / Plus, show one whole-meal action, hide station controls and replace item station choices with ready-made/prepared-to-order wording. Portions, extras, held baskets, pinning and fullscreen remain. QR activation explicitly reviews copying confirmed opening hours into same-day pickup windows with no lead/cutoff delay; existing closures and availability still apply. It does not assert table presence or bypass guest verification. Reservations/calendar are prominent in settings and the public page links to reservations when available. Existing reservation eligibility and account requirements remain. No live seller settings are automatically enabled.

FR/EN/LN/SW copy is included. WhatsApp and public links retain canonical identity/context: anonymous ordering remains the existing scoped guest-cookie flow, and links do not grant operator access. No WhatsApp renderer, login, template or notification behavior changes.

## Changed files and validation

Backend: restaurant_orders route, restaurant_order_service action, counter workflow HTTP tests. Website: counter, order screen/queue, menu routing, workspace/navigation, settings/quick QR, public restaurant links, localized copy, strict proxy contract and focused tests.

- Backend order/preparation/counter/adapters: 167 passed.
- Backend guest HTTP/visits/reservations: 85 passed, 2 skipped (87 collected).
- Website Restaurant unit/contract suite: 206 passed.
- Browser: counter at 320/390/820/1440 pixels (4 passed); settings (22 passed); personal menu across FR/EN/LN/SW and 360/820/1440 pixels (15 passed initially, final failed test corrected to await routing-save completion and passed on rerun).
- Changed-file ESLint and production build including TypeScript passed. Full platform suite not run; focused checks follow repository policy. Fixture browser tests do not claim a live guest purchase or physical-device acceptance.

## Release and remaining scope

No migration: Alembic head remains 0195 from the preceding deployed counter release. No new environment variables, dependencies, cron jobs, workers or Meta templates. Release backend first, then Website; verify exact Render commit status. The preceding counter commits (backend 6db7729c, Website b0ee349, Business 54ca2ea) and migration 0195 were verified live earlier in this task. No additional production database action is required.

Remaining: physical phone/tablet fullscreen/printing acceptance, human localization review, separately scoped recipes/independently stocked extras and automatic payment-provider charging. General module readiness remains Partial. Exact release SHAs/status are recorded in the task's final release report.
