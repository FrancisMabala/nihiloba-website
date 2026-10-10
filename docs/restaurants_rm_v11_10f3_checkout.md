# RM-V11-10F3 — Personal Service checkout and private guest payment

Handoff, 2026-10-10. Consumers: Personal Pro owner and confirmed linked guest. No Backend file, intake gate, deployment, commit or push was changed.

## Contract and behavior

Read the 10B5a/10B5b Backend contracts, 10F1/10F2 handoffs, existing Service and guest gateways, and bundled Next.js documentation. Backend `alembic heads` returned only `0144 (head)` with `0144.down_revision='0143'` and `0143.down_revision='0142'`. The requested money migration is in the sole-head lineage. No blocking Backend contract defect was found.

- Personal Pro checkout is integrated into the existing Service group screen. It shows original round status, pending, chargeable and excluded rounds, plus the Backend's revisioned CDF and USD chargeable, net allocated, due and refund-owed figures separately. Explicit checkout freezes rounds; an unpaid checkout has a distinct confirmed reopen action.
- Owner method configuration records a label, cash or external mobile money, allowed currencies and enabled state with Backend revisions. No provider account or phone information is collected. Method, currency and amount are blank until the user chooses them. Entries require confirmation of actual method, currency and amount, and permit partial, mixed and actual cash-change recording.
- Correction controls clearly separate mistaken-entry reversal, actual outgoing refund and excess reconciliation. Only an actual refund sends `actually_returned:true`. External mobile money is marked as restaurant recorded, not provider verified.
- Protected receipt display includes immutable original food terms, money entries, allocations, change, separate balances and refund obligations. Browser printing prints that protected view. Settlement text appears only when the Backend receipt says settled in restaurant records. The view is neither a tax invoice nor a provider receipt; it does not change preparation or handover.
- For an uncertain money write, the exact original path, serialized body, operation key and session binding stay in memory. Recovery rereads the bill, then calls B5b's read-only recover with that original envelope plus `kind`. An identical retry requires a safe `found:false` and a separate user click. Definite stale writes refresh for a newly reviewed action. Sign-out, context changes and authority loss clear protected state; no money or receipt data enters browser storage or an offline queue.
- The existing same-origin guest proxy now accepts only the exact B5b `GET /service-payment` suffix. The existing path-scoped HttpOnly visit cookie remains required. A confirmed guest sees linked rounds, restaurant-declared methods, separate CDF/USD balances and refund owed. Cross-visit access is denied and private payment data clears when the visit authority ends. No worker identity, operation key, pickup proof or private contact data is exposed.
- Free ordering persists. After paid downgrade, the owner can use only the bounded existing-checkout resolution path. Reads poll only while visible and online, with backoff. FR/EN/LN/SW labels and phone-sized controls are present.

## Validation

| Check | Result |
|---|---|
| Focused money/Service/guest contracts | 13 passed |
| Complete Vitest suite | 691 passed, 8 inherited failures in `tests/shida-page.test.tsx` and its existing `.s3a-local/09b2-head-source` copy; no new failure identities |
| TypeScript, changed-file ESLint, production build | Passed |
| Money translations | 66 keys, no duplicates, same key set as Business, four entries per key |
| Whitespace | `git diff --check` passed (Git reported only line-ending conversion warnings) |
| Real Backend browser | New owner money flow, expanded guest Service flow and existing Service regressions passed against isolated HTTPS Backend and production frontend |

The owner browser flow covered checkout/reopen, partial cash with actual change, mixed external mobile receipt, lost-response `found:false` and identical explicit retry, lost committed reversal recovered as found, excess reconciliation, actual refund, protected receipt printing, paid downgrade and 390px layout. The guest browser flow covered linked private summary, cross-visit denial and lost-cookie clearing. Gateway tests check exact guest suffix, method/worker route limits, decimal-string bodies and actual refund acknowledgement. The 8 complete-suite failures match the documented pre-edit 10F1/10F2 baseline; they are not waived.

## Remaining limits and rollout

The isolated browser fixture exercises CDF money and does not prove USD ledger separation, cancellation with refund owed, concurrent stale writes or every language on a physical phone. The UI renders the two Backend currencies independently, and contract validation and four-language parity pass. Validate those remaining scenarios and the inherited suite gate in the intended release environment.

1. Apply the completed 10B5a/10B5b Backend contracts and migration `0143` to every serving Backend instance before releasing either frontend.
2. Release Website and Business consumers together after Backend readiness, keeping existing intake gates unchanged.
3. Configure intended payment methods and exercise mixed CDF/USD, cancellation/refund, stale revision, downgrade, guest-cookie expiry and revocation acceptance before operational use.

## Changed files

- `app/api/shida/restaurant-guests/[...path]/route.ts`
- `app/components/shida/restaurant-guest.tsx`, `app/components/shida/restaurant-guest.css`, `app/components/shida/restaurant-seller-workspace.tsx`, `app/components/shida/restaurant-service.tsx`
- `app/components/shida/restaurant-money.tsx`, `app/components/shida/restaurant-money.css`
- `app/lib/restaurant-guest-contract.ts`, `app/lib/restaurant-service-contract.ts`, `app/lib/restaurant-service-copy.ts`, `app/lib/restaurant-money-copy.ts`
- `tests/restaurant-money-contract.test.ts`, `tests/browser/restaurant-money.browser.ts`, `tests/browser/restaurant-service.browser.ts`
- `docs/restaurants_rm_v11_10f3_checkout.md`
