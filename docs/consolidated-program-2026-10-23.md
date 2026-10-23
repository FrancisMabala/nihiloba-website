# Consolidated SHIDA implementation — 23 October 2026

Scope: the consolidated navigation, web registration and Wenze program. This
record complements `wenze_complete_program.md` and the Backend's
`docs/wenze/COMPLETE_PROGRAM_2026_10_23.md`; it does not reopen completed batches.

## Checkpoints

| Checkpoint | Finding and delivered change |
| --- | --- |
| 1. Navigation | Removed the redundant desktop app row. At widths up to 700px the existing five-destination bottom bar remains. Header account controls expose My Space, Manage my activities and Settings. Logo, marketplace links, language, cart and footer help remain available. |
| 2. Registration | New users choose Personal/Business, enter short groups of details in memory, verify WhatsApp, then review current legal documents and finish through the canonical services. Explicit Resume permits earlier verification of a saved draft. Existing identities and saved drafts take priority over unverified input. |
| 3. Selling entry | Wenze buyer search and results precede a compact secondary Sell entry. My Space → Manage → My Listings remains the Personal management route. Registration safely returns Personal users to their intended local selling destination. |
| 4. Delivery | Reused the released canonical snapshots, fulfillment settings and exact-context authorization. No replacement delivery lifecycle. Regression coverage includes private destinations, seller orders and Restaurant verification. |
| 5. Quick Sell | Reused the released individual Store mode, Product, Inventory, photos, fixed/negotiated orders and guarded publication. No separate identity, seller platform or Organization creation. |
| 6. My Listings | Reused exact-owner drafts, bounded pagination, status filters, lifecycle controls, photo editing, public links, orders and explicit seller-reported outside-sale provenance. |
| 7. Shop management | Existing single-shop identity, contextual switcher, product labels and simplified stock controls retained. Money now opens an everyday summary; the separate Reports tab retains detailed comparisons, inventory valuation, exports and report history. Existing financial entitlements still apply. |
| 8. Camera | Native detection and existing lazy ZXing fallback retained in website and Business. No new dependency or scanner implementation. |
| 9. Integration | Focused API, identity, registration, responsive navigation and Wenze regression checks. See validation below. |
| 10. Inventory | The current capability and registration inventories below distinguish implementation from external/device acceptance. |
| 11. École | Handoff only after this release is verified; continue from that chat's current tracker rather than an old assumed next batch. |

## Registration and account inventory

| Capability | Current behavior |
| --- | --- |
| Identity | One Personal human actor. Business creates/resumes an Organization context through OrganizationOnboardingService; it is not another human account type. |
| Sign-in | Prepared message to the existing SHIDA number; the user sends it, receives a code, returns to the originating browser and enters it. Opening WhatsApp alone does not sign in. |
| New input | Private fields live only in component memory before verification, with a close/reload warning. Only the non-sensitive Personal/Business choice persists in sessionStorage. No server identity/draft is created from these fields before verification. |
| Catalogs | Business choices come from the existing public Employment classification endpoint, which uses the same backend Organization-type/sector catalogs. Failure does not invent options; Personal and saved-draft recovery remain available. |
| Verified save | New details go through the existing revision-checked onboarding PATCH. Existing server values, completed Personal identities and saved cross-channel drafts are not overwritten. A concurrently created draft retains priority. |
| Existing account | Recognized by the canonical projection; no repeated profile creation. Current outstanding legal acceptance remains enforced. |
| Completion | Existing canonical validation/completion, session rotation and one-time Business POST handoff. No token in URL or persistent browser storage. No new Organization grants, activation or access inferred from login. |
| Recovery | Existing retry, expiry, cancellation, stale-revision reload, ambiguous-response logout and cross-tab clearing retained. Unsaved local input is intentionally lost on reload; verified saved progress can resume. |
| Consent | Adult/DRC eligibility remains a required self-declaration enforced by the existing challenge gateway/backend. Free-service/no-student-record scope is informational text. Terms and Business Terms use versioned acceptance; Privacy uses acknowledgement wording. No optional marketing consent is collected or silently added. |
| Legal/flags | Existing approved 1.1 documents and all 1.0 history unchanged. No legal publication, production URL changes, flag changes or authentication template introduced. |
| Return destination | Local, allowlisted SHIDA path only; rejects external, traversal, query-bearing and registration-loop destinations. In-place sign-in preserves the original page. |
| Languages | Changed presentation is FR/EN/LN/SW. Legal document sources remain existing FR/EN, labelled FR where appropriate. |
| Recovery limitations | No new credential relinking, account merging or Organization ownership rules. Physical phone/provider acceptance is separate from browser fixtures. |

## Wenze capability inventory

Current: public product/shop discovery, search/categories/filters, product/variant
details, cart, fixed-price checkout, negotiated requests, private delivery and
pickup snapshots, estimates/fees, order progress/history, authorized completion,
My Listings and 24-hour drafts, full shops, publication/archival/restoration,
photos, stock/variants/reservations/movements/counts/reconciliation, shop-aware
counter baskets, immutable receipts, external-payment recording, labels/scanning,
private costs, expenses, currency-separated reports, advanced exports, schedules,
shop settings and public sharing. All reuse the current authorization/entitlement
and lifecycle boundaries; visibility in navigation grants no backend authority.

Fixed-order seller completion is not customer OTP proof or verified payment.
Negotiated/Restaurant verification retain their own canonical rules. Outside-sale
marking does not manufacture an order or payment. Recorded external payment is not
SHIDA payment collection. Current sales cost coverage and current-inventory cost
coverage have different denominators and remain labelled separately.

Existing My Listings, camera and delivery limitations remain recorded in the
companion report: no claim of physical iPhone/Android camera verification, actual
WhatsApp provider delivery, certified fiscal receipts or live payment collection.

## Navigation map

- Public logo/Home → localized `/shida`; Explorer → `#explore`; header marketplace links → seven public marketplaces.
- Activities/My Space → `/shida/space`; Manage → `?view=management`; account/settings → `?view=settings`.
- My Listings/Sell → `/shida/wenze/sell`; full shop management → `/shida/seller/wenze`.
- Specialized Wenze, Restaurants and Services shells replace the global shell, preserving their existing local navigation and return destinations. No stacked permanent bars.
- Business entry → existing `https://business.nihiloba.com/`; normal exact Organization membership, role, activation and grants remain authoritative.
- `?view=money` opens the compact financial summary; existing `?view=reports` links retain detailed reports. Mobile and desktop use the same selected shop.

## Technical and release boundaries

Website-only implementation. Backend audited at `ffa348e4`; no backend or Business
code changes, migrations, schema edits, dependencies, workers, cron jobs, template
or environment-variable additions. Existing migration 0199 remains required by
the previously released Wenze features. The audited Backend checkout reports one
Alembic head, 0200 (`school_finance_exports`); this task does not apply or modify it. Original checkouts and École work are
preserved; implementation uses an isolated checkout based on website `1cfc43d`.

Changed files: shared navigation/account presentation, registration wizard/copy/
routes/public catalog adapter/return-path validation, Wenze public entry and Money
presentation, corresponding browser fixtures/tests, and this documentation.

## Validation and release record

- Production Next build and TypeScript passed; changed-file ESLint and diff checks passed. The initial dependency-junction build was rejected by Turbopack; installing the locked dependencies directly resolved it without source/config changes.
- Authentication/gateway/return-path unit checks: 54 passed.
- Backend canonical Personal/Organization registration: 42 passed. Existing Wenze Quick Sell, seller orders/private delivery and Restaurant verification: 49 passed, 2 skipped by the pre-existing `Organization authority case` parameter guard. No production data or messages used.
- Registration: final browser matrix **48 passed**. Earlier expanded matrix: 46 passed in Chromium/WebKit across FR/EN/LN/SW and 390/768/1366px. One initial WebKit mobile Finish click did not navigate; three focused repeats passed, followed by the full 46-case run. The final matrix includes the concurrent draft-start test in both engines. Total distinct browser scenarios passing across the targeted suites: **205**.
- Public/Personal navigation: all 74 cases passed across the full run and focused rerun (60 initial passes, 14 rerun passes). Updated outdated expectations for the new account menu, existing My Listings entry, and enabled web-registration route. Checks include seven marketplaces, desktop/tablet/mobile, empty states, missing images, long titles, equal cards, footer placement, keyboard and local-workspace boundaries. Fixture processes intentionally block external network requests.
- Wenze management: 12 passed in FR/EN/LN/SW at 390/768/1440px, including Money versus Reports. Existing shared WhatsApp login: 19 passed. Checkout/delivery: 36 passed. Quick Sell: 12 passed. Scanner: 4 passed with synthetic native/fallback streams and canonical label data.
- No full Backend rerun is claimed for this frontend-only change. Prior isolated PostgreSQL and baseline full-suite findings remain in the companion Wenze release report.
- Exact pushed commit and Render release evidence: pending release verification.

## Remaining gaps

- External acceptance: real-device camera/keyboard and real WhatsApp delivery have not been certified by synthetic browser tests.
- Existing operational/legal obligations from `registration-launch-20261022.md` are not resolved by this UX release; no legal compliance claim is made.
- Existing dependency advisories remain (npm ci: 2 moderate, 9 high, 1 critical); no unrelated upgrade or audit suppression.
- The earlier Backend full-suite fixture cleanup failure is documented in the companion Wenze report; this website-only release does not claim a new green full Backend suite.
- Optional later improvements: richer publishing shortcuts and onboarding refinements can reuse these same services. No future commercial or education service is activated here.


Representative synthetic screenshots: [desktop discovery](evidence/consolidated-20261023/wenze-desktop.png), [mobile discovery](evidence/consolidated-20261023/wenze-mobile.png), [desktop management](evidence/consolidated-20261023/manage-desktop.png), [desktop registration](evidence/consolidated-20261023/registration-desktop.png), [mobile registration](evidence/consolidated-20261023/registration-mobile.png).
