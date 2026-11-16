# My Space mobile section selector — 16 November 2026

Local fix only. No push, deployment, backend change, migration, or API change.

## Confirmed failure and correction

The desktop and mobile section links already share the canonical destination array in `space-sidebar.tsx`. `AccountSpace` checks `leaveWork()` and then navigates to the selected URL. Both localized and English route pages read `searchParams.view`, and `resolveSpaceView` selects the existing destination component. No missing route, query reset, or redirect was found for the eight displayed sections.

The mobile disclosure's `onBlur` closed it whenever `contains(event.relatedTarget)` was false, including a null destination. Safari can lose focus to the document before dispatching the tapped link's click. Closing the native details element at that point hides the link before the navigation handler runs. This repeats the focus defect previously corrected in the account menu. Before the fix, a normal Chrome touch run opened all eight destinations, while a simulated null-focus transition hid the link and prevented selection. This reproduction does not constitute a live Safari/device trace.

The selector now ignores null focus destinations. A document pointer listener dismisses actual outside presses; focus moving to a known outside control still dismisses it. Link selection and Escape keep their existing closure behavior. Navigation remains click-based, so a cancelled touch gesture does not navigate. Styling, destination URLs, session binding, conditional entries, permissions and the unsaved-work guard are unchanged.

## Validation

16 production-page Playwright browser scenarios passed using installed Chrome with touch-enabled viewports and intercepted synthetic API responses. These use the actual Next page routes and destination components, not mocked React pages:

| Section | Canonical view | Rendered content assertion |
| --- | --- | --- |
| Vue d'ensemble | overview | Activity overview and its slogan |
| Mes activités | management | Managed activity list and fixture shop |
| Mes annonces | listings | Actual listing card and fixture item |
| Ma recherche d'emploi | job-search | Both profile setup links in the job workspace |
| Mes transactions | transactions | Actual transaction row and fixture order |
| Notifications | messages | Notifications/preferences controls in the notification workspace |
| Mon compte | settings | Loaded account profile information |
| Aide et questions | questions | Editable question form |

- All eight destinations exercised sequentially at 320, 375, 390, 430, 820 and 1440 CSS pixels. Each phone width also repeats the sequence with simulated Safari focus loss.
- Every direct link and refresh checked in French, English, Lingala and Swahili. Back/forward between non-overview sections and return to overview checked against rendered content, selected label, section active state and global My Space active state.
- Escape/focus return, Tab out, outside taps, cancelled touch gestures, keyboard activation, unavailable help data and signed-out access checked. Unavailable or protected content stays at the selected section rather than reverting to overview.
- 28 focused unit tests passed (`space-view` and `personal-activities`). These are route/data helper tests; they are not the browser-navigation evidence.
- TypeScript, changed-file ESLint, whitespace checks and a sanitized production webpack build passed. No backend suite was run.

Evidence: `C:/NIHILOBA/release-evidence/space-selector-20261116` contains the before/after browser reports, production build log, and mobile/desktop screenshots of Listings and Help.

## Limits and retained resources

Physical Safari/iPhone and Android devices were not available for verification. Safari's null-focus event sequence was simulated in Chrome, explicitly separate from normal touch emulation. Browser history and server route handling were tested locally; deployed content was not changed. No real account or financial data was used.

The existing sanitized website build directory and shared Node dependencies were reused. No new worktree or dependency installation was needed. Unique baseline failure evidence and acceptance screenshots are retained. The temporary test server was stopped after verification.
