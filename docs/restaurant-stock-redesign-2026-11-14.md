# Mon stock — 14 November 2026

The Personal restaurant workspace uses a short stock form and explicit Add quantity,
Remove quantity and Correct what remains actions. The Business workspace uses the
same component and translations. The existing management shell, fullscreen control,
restaurant selection, archive confirmation and menu bindings remain available.

## Wording and rules

French entry points: **Mon stock**, **Ajouter un produit**, **Combien avez-vous
maintenant ?**, **Ajouter une quantité**, **Retirer une quantité**, **Corriger ce qui
reste**, **Voir les changements**. A correction asks for the entire counted balance.
Blank quantities are not zero; an explicitly entered zero is supported. Weights and
volumes retain three decimal places, using exact arithmetic for previews.

Prepared dishes map to `prepared`, packaged drinks/goods to `packaged`, ingredients
to `ingredient`. Other supplies use the existing private ingredient purpose with no
stock kind. Legacy unclassified records stay unclassified. Packaged goods are labelled
“Boissons et unités emballées” because the model also permits packaged non-drinks.
No conversion, recipe deduction, price or menu publication is inferred from stock.
Menu links remain explicit. Low-stock alerts are on-screen warnings only, based on
available stock after reservations. Physical balance and reserved amounts stay distinct.

Search, type and stock-state filters run on the server before pagination (20 rows).
History loads only on request. New identical active records are rejected by name,
purpose, kind and unit within the existing restaurant write lock. Replays are checked
first, so a successful operation can still be retried. Existing duplicate records are
not merged. Stock movements, revisions, permissions and audit history are preserved.

## Validation and review

Focused component checks cover explicit zero, exact decimals, distinct movement
payloads, immutable retries, inactive access and archive confirmation in FR/EN/LN/SW.
Browser fixtures exercise the real management entry, all four languages at 320, 375,
390, 820 and 1440 px, no page overflow, creation, pagination, history, stale revisions
and lost-response replay. These are synthetic browser data, not production writes.
Backend checks cover canonical inventory, API scope, preservation, worker grants and
WhatsApp integration; final results are recorded in the release evidence.

Screenshots and run logs: `C:/NIHILOBA/release-evidence/restaurant-seven-20261114/`.
Lingala and Swahili need native-speaker review. No real-user usability session is
claimed. Suggested exercise: add 24 bottles of water, receive 12, remove 2 damaged
bottles, enter the physical total after counting, then find the latest change.

No migration is introduced. Deployment status is reported separately from local
implementation and validation. Existing PostgreSQL locking is preserved; SQLite
tests are not evidence of simultaneous PostgreSQL writes.
