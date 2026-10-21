# Services customer navigation — 21 October 2026

## Behaviour

The Services discovery page no longer places requests, bill notices and provider
management together above the hero. Its primary action is now **Décrire mon
besoin** (with EN/LN/SW equivalents), beside the existing browse action. It opens
the localized new-request destination and retains `new=1` through the existing
WhatsApp code sign-in. Public browsing remains available without an account.

**Mon espace** now contains **Mes demandes** and **Factures reçues** in its activity
cards. The signed-in shared account menu also offers both destinations, so they
remain reachable from other SHIDA marketplaces on phone and desktop. The bills
link currently opens existing Services bill notices; this does not claim that
bills from every marketplace have been aggregated. Statements retain their
provider-issued, non-payment-confirmation meaning.

Provider navigation uses the existing protected Personal Services listing and
capability reads. A valid owned listing (including an archived listing) and the
profile capability show **Mon espace prestataire**. An authorized, valid empty
list shows **Proposer mes services**, leading to explicit setup. Loading, denial,
network failure and malformed results show neither provider destination. A
signed-out visitor sees a text sign-in button; the public service-offering
invitation remains available farther down the page.

Account changes, logout, focus/visibility return and connectivity changes clear
or recheck provider navigation. Reads use the current session binding, private
no-store requests, cancellation and generation checks. Delayed responses cannot
restore a previous account's provider link. No profile is created by visiting a
menu or account page. Destination APIs independently retain all ownership and
authorization checks; navigation is not an access grant.

## Scope and compatibility

- Website presentation and access-aware navigation only; no Business Dashboard
  or backend executable changes, migrations, dependencies or settings.
- Shared public account controls keep the existing WhatsApp code flow, current
  page and language. Seller controls retain their previous behaviour.
- Requests and bills remain Personal customer functions, independent of having
  a provider profile. Account-page links expose no private records before login.
- PDF uploads remain disabled. No production messages, test bookings or database
  operations are required for this change.
- Relevant files are the public Services hero, shared account controls, account
  landing page, four-language navigation copy and provider-access reader.

## Validation

Validation completed:

- 86 focused Vitest checks passed across Services navigation, public login,
  marketplace rendering, WhatsApp login, gateway and language-query suites.
- 38 browser checks passed using `playwright.services-navigation.config.ts`.
- 24 shared public marketplace browser checks passed.
- Scoped ESLint, production webpack build (including TypeScript) and
  `git diff --check` passed.
- Phone and desktop screenshots were inspected; evidence is stored in
  `docs/evidence/services-account-navigation/`.

The focused matrix covers signed-out visitors, customers, providers, archived/denied access,
malformed discovery, account replacement, logout, delayed responses, keyboard
dismissal, phone widths, language preservation and the new-request login handoff.
Shared-header regressions cover the other public marketplaces. Fixtures are
synthetic, with external delivery blocked; physical WhatsApp/device acceptance
remains distinct from these browser checks. The initial browser run exposed an
incorrect test expectation for the existing normalized trailing slash in hero
links, plus a language-menu test acting before session restoration completed.
Those assertions were corrected and the complete 38-check suite passed.

## Release

The website production build was repeated successfully after integrating the
current remote main (including the separate restaurant counter update).
Render currently reports that automatic deployment is disabled after a specific
commit deployment. This task preserves that setting: pushing the navigation to
main does not itself make it live. The delivery report records the verified main
commit and observed deployment status. No backend rollout or PDF activation
accompanies this navigation update.
