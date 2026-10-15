# Release tracker delta — Reservations and Menu, 15 October 2026

Apply to the canonical pilot, WhatsApp, and main release workbooks when OneDrive/SharePoint writable access is available. Preserve existing sheets, formulas, gate history, and **Partial** statuses. Neither canonical workbook nor production intake was changed here.

| Tracker area | Result to record | Open gate |
| --- | --- | --- |
| Pilot — Personal solo Reservations | Local Website workflow complete; seeded FR/EN/LN/SW browser **16/16 pass** at 360/820/1440; isolated HTTPS Personal request/accept/decline/refresh/calendar **1/1 pass**. | Authenticated staging, physical devices, human language acceptance. Seller DTO only supports “SHIDA site or WhatsApp” source wording. |
| Pilot — Personal solo Menu | Current managed items across pages, search/availability/setup filters, explicit preparation, stock and dated-offering information, optional photo, and safe initially unavailable creation. Seeded browser **16/16 pass**, including 12 locale/width list and editor checks. | Authenticated staging with actual stock and dated offering, physical devices, human language acceptance. |
| WhatsApp — Reservations | Backend focus **45 passed, 2 skipped**; four-language choices, notices, replay and deferred delivery covered. | Real phone, provider receipt/deferred-window behavior, guest status retrieval. |
| WhatsApp — Menu/order selection | Focused Backend Menu/order/preparation set **28/28 pass**, including stale WhatsApp selection after availability/price changes, mixed-currency rejection, and preserved accepted-order routes. No WhatsApp source edit. | Real phone and provider interaction against the deployed pair; human four-language wording review. |
| Main release — automated gates | Reservations Website calendar focus **2/2 pass**. Menu Website focus **82/82 pass** and seeded browser **16/16 pass**. Menu build, typecheck, changed-file lint and diff check pass. Full Website Vitest remains **730 pass, 8 fail** on the previously red duplicated SHIDA public-page copy assertions. Full ESLint has **5 errors, 3 warnings** in existing files outside Menu. | Keep the full gate red; frozen final-tree suite, authenticated staging and device acceptance remain open. |

Evidence: `docs/restaurants-reservations-2026-10-15.md`, `docs/evidence/restaurant-reservations-2026-10-15/`, `docs/restaurants-menu-2026-10-15.md`, and this folder’s before/list/editor captures.
