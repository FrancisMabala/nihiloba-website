# Management mobile layout correction — 15 November 2026

Local-only change; no push, deployment, migration, or backend change.

## Causes and correction

- Wenze's legacy mobile shell padding was applied on top of the shared connected shell. Its heading actions also retained a full-width row after the fullscreen label became an icon. The connected shell owns its spacing now; mobile fullscreen lives in the existing business identity row's secondary menu, only when the browser supports it. Desktop keeps its direct control. Restaurants share their identity row with their secondary menu.
- The fixed five-column bottom bar combined long translated labels with `overflow-wrap:anywhere`. Both frontends now measure available space and whole words using the rendered font. Destinations that do not fit remain accessible through the existing More sheet; labels keep normal word boundaries and equal-width items. This preserves permission-filtered destinations, nested active states, dirty-form checks, busy locks, measured bottom clearance, and safe-area padding. Boutique uses the existing shop icon.
- Shop photo, name, metadata and photo actions competed in the same row. Name/status and metadata now have separate layout roles. Mobile uses a compact photo/name row, full-width metadata, then photo and public-view actions. Tabs and secondary sections wrap. The hidden upload input also needed an explicit one-pixel size to stop inherited form widths causing overflow when expanded.

## Focused validation

- Website typecheck, changed-file ESLint, diff whitespace check, and sanitized production webpack build.
- Nine focused unit checks: mobile destinations, restaurant sections, Services account navigation.
- 72 browser cases across Wenze, Services and Restaurants: FR/EN/LN/SW × 320/375/390/430/820/1440 pixels. Navigation, overflow, nested selection, unsaved changes, More-sheet focus, scrolling, and simulated keyboard viewport changes.
- 26 shop browser cases: the same locale/width matrix with a long business name; metadata width, intact navigation words, aligned/equal navigation items, secondary sections, final-content clearance; unbroken names, photo removal, persisted edits, unsupported fullscreen, viewport resizing, enlarged text, fullscreen enter/exit and keyboard dismissal.
- Business companion changes and their verification are recorded in that repository's matching document.

All browser API data is synthetic and intercepted locally. Screenshots and build/test reports are retained in `C:/NIHILOBA/release-evidence/management-layout-20261115`.

## Limits and retained resources

Headless desktop Chrome with touch-enabled viewports is not physical iOS/Android verification. Real Safari/Chrome toolbar animation, device keyboards, notches, and OS text enlargement remain unverified. Viewport resize and keyboard-height events were simulated; no real customer data or messaging was used. No full backend suite was run. No new module was created; apartment management remains outside scope.

Existing isolated build directories were reused with sanitized configuration, without reading dotenv files. The build initially ran out of disk space; verification resumed after the owner freed space. Existing build trees, evidence, worktrees and shared dependencies are retained. Their earlier deletion was blocked by automatic review and was not retried. Test servers are stopped after verification.
