# Personal Services setup guidance

## Existing screen and change

The empty-provider setup gate reused the catalog creation form across the page width. The oversized heading, uncontained fields, neutral submit button and separate exit actions obscured the short setup task. Its explanatory copy also described internal marketplace permission rules rather than guiding the provider.

The setup invitation and expanded form now share a centered card with a maximum width of 720 px, SHIDA forest green, warm cream and restrained gold accents. The heading is smaller, the introduction is shorter and the form has consistent field spacing. Phone layouts use comfortable side margins and stacked actions without horizontal overflow.

The three fields are unchanged: public provider name, service name and category. Setup-specific labels, a provider-name explanation, a service-name example and an explicit category placeholder clarify what to enter. “Create my service” is the solid green primary action; Cancel is secondary and sits beside it on larger screens. The marketplace return link appears on the invitation, so it no longer competes with the form actions. A short note explains that the service remains private until publication.

All changed copy is provided in EN/FR/LN/SW through the existing translation object. Restaurant entry copy and screens are unchanged. Opening the form focuses its first field; cancelling restores focus to the setup invitation. Existing confirmation protects unsaved input. Submission shows a localized working label, and uncertain saves retain the existing immutable body/idempotency key and retry control.

## Authorization and scope

The current marketplace entry policy is preserved. A valid Personal session must finish Services profile and capability discovery before setup can appear. An empty valid list invites explicit creation; discovery failure, denied access or malformed data does not open setup or management. The form never auto-creates a profile or grants access to another marketplace. Successful creation uses the same protected API and opens the saved service editor. Existing providers keep their catalog creation workflow.

No Backend executable code, ownership, publication, privacy, Free/Pro pilot allocation or Organization behavior changed. No new browser storage or personal-data collection was introduced.

## Historical report and evidence

The [complete 16 October implementation report](history/services-provider-setup-2026-10-16.md)
is archived with its original validation results, limitations and release notes.
Those results are historical evidence, not a fresh test run or a claim of live
acceptance. This existing path remains the current guidance entry point so
existing Website and Backend references continue to work.

The [marketplace management access contract](marketplace-management-access-2026-10-16.md)
and [provider area guide](services-provider-area-2026-10-16.md) remain applicable.
Original [setup screenshots](evidence/services-setup/) remain unchanged; the archived
report links to individual captures. Open PostgreSQL/live pilot acceptance gates
and future Services features are not closed by this documentation cleanup.
