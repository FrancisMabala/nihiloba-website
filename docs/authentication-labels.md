# Authentication wording and passkey labels

Web login and registration forward the selected FR/EN/LN/SW locale to the existing browser-bound WhatsApp challenge. The backend prepares and recognizes the human-readable message and chooses the code reply from the saved request; the frontend preserves its exact wa.me URL. No identity is submitted when creating a login challenge.

The private account-security overview now includes canonical passkey user details. After a successful authenticated read, supported browsers receive `signalCurrentUserDetails` with the unchanged relying-party ID and opaque user handle. Profile edits refresh these details after saving. Unsupported/rejected signals are harmless, and provider acknowledgement does not prove that a saved label changed. Existing credentials are never automatically removed or recreated.

If the backend reports a missing usable personal name, enrollment opens the existing profile editor, focuses the first-name field and requires first/family names. Saving returns to passkey setup within the same session. A separate user action starts enrollment. Existing passkey sign-in remains available. Account-security guidance explains optional replacement and retaining a tested sign-in/recovery method before removal.

Validation: 87 targeted Vitest checks; production Webpack build and TypeScript; lint on affected files; desktop/mobile Playwright profile-to-passkey flow with a virtual authenticator (2 checks). Browser/provider metadata signalling is covered by supported, unsupported and rejected mocks. No live WhatsApp message or real Windows/password-manager credential was used. Linked local dependencies require the Webpack build option; Render uses its normal dependency installation and build.
