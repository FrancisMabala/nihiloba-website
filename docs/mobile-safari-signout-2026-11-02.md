# Mobile Safari account actions

The shared account menu closed whenever focus left a child with no new focus
target. Safari can produce this transition while tapping a button, so the menu
could unmount before Sign out or Change account received its click.

Ignore null focus destinations. Actual focus movement to another control,
outside pointer presses, Escape and the close button still dismiss the menu.
The existing logout endpoint, cookie clearing, cross-tab authentication lock,
session notifications and failure handling are unchanged. Public and management
headers use the same corrected component; no WhatsApp template behavior changes.

Validation: eight focused Chrome/mobile WebKit tests cover direct taps and the
null-focus transition, both account actions, and signed-out state after reload.
The null-focus regression failed against the prior build. Existing 390px account
menu keyboard, Escape and outside-click checks pass. Production webpack build
(including TypeScript) and targeted ESLint pass. The local node_modules junction
is incompatible with Turbopack's restricted filesystem root, so local production
validation uses the supported webpack builder. WebKit tests remove only the HTTPS
upgrade directive from the local HTTP document response; production CSP is intact.
Browser fixtures use synthetic accounts and never revoke a real user session.
