# Personal listings and job-search mobile UX — 16 November 2026

## Scope and cause

The account selector and content heading repeated the same mobile title. A late rule in job-search-overview.css wrapped the six tabs into multiple rows. Desktop grid sizing retained intrinsic widths in the embedded Articles workspace. Personal selling also had a separate /shida/wenze/sell entry that mixed boutique shortcuts with personal inventory.

## Implementation

- Canonical personal articles: /{locale}/shida/space?view=listings&tab=article (English also uses /shida/space). Both old localized and default /shida/wenze/sell routes redirect here, retaining supported item/status/page parameters.
- PersonalListings keeps the category navigation and accessible heading. Articles reuses QuickSell and its existing authenticated personal context, all-page collection, revision checks, drafts, orders and publication operations. Category totals update after article mutations. All listings still use the canonical catalogue endpoint; its backend filters were inspected without modifying them.
- QuickSell removes duplicate statistics and boutique advice cards, exposes every existing status in a compact scroll row, distinguishes genuinely empty and filtered lists, keeps one creation action, and collapses sales advice. Filters/page and list-scroll state survive navigation.
- ManagementSpaceSelector excludes only personal Wenze inventory from business cards, retains other management modules and destinations, and links personal selling back to the canonical Articles page.
- JobSearchSpace keeps all six destinations; compact mobile headings, horizontal tabs, natural long-name wrapping, secondary disclosures for unfollow/profile actions, concise application empty state and less nested alert framing. Existing confirmations, consent, delivery channels and permissions remain.
- Revised copy is provided in French, English, Lingala and Swahili. No backend, API contract, schema, production data or authentication changes.

## Focused validation

- TypeScript, scoped ESLint, git diff --check and optimized Next.js webpack production build passed.
- Nine unit tests passed: canonical localized redirects and complete multi-page individual listing collection.
- Job-search component browser regression: all 37 cases passed across the run and focused rerun. Existing city-input assertions were updated to the current accessible city combobox; no application behavior was weakened.
- Actual Next.js production preview: 12 mobile/layout/interaction checks plus management navigation, bottom-clearance, and revision-checked edit/unpublish checks passed. All six job-search sections at 320/375/390/430/768/1280; back/forward/refresh; long company name; enlarged text; alert save failure/retry; draft deletion confirmation; all article statuses; canonical navigation and personal/boutique separation.
- Fifteen existing article browser checks passed: FR/EN/LN/SW at 390 and French desktop 1440. Coverage includes sparse pagination, creation, upload retry, dirty-form protection, draft resumption, publication retry, duplicate prevention, failure recovery, cancellation and session loss.
- Tests use isolated synthetic browser fixtures, not real user records. No full backend suite was run.

## Evidence and limitations

Matching 390 × 844 before/after full-page screenshots are retained outside Git in C:/NIHILOBA/release-evidence/personal-space-mobile-20261116/next for listings, applications, following, profiles and alerts. Additional article and management screenshots are there. The before capture used the unchanged baseline with Next development chrome; after captures use the production preview. Both render the real account shell and components.

Chrome responsive emulation was checked, not physical iOS Safari, dynamic Safari browser bars or a device keyboard. WhatsApp delivery and live authenticated customer mutations were not exercised. Production release verification must correlate the pushed SHA to Render's live deploy; HTTP alone is insufficient. No migration or deployment configuration change is required. The final small URL-state correction was also checked in the component browser harness and included in the final production build.
