# WNZ-08 — Category-aware product forms

Personal and Organization product editors now provide category-specific help for clothing, shoes/accessories and electronics, with a useful generic fallback. The existing canonical variant suggestion is listed first (size, shoe size, storage, or volume), but is never automatically selected. Size/configuration examples clarify option entry.

Descriptions, condition, selected variant type, labels and quantities remain unchanged when the seller changes category. Product editing does not silently convert stock; the existing reviewed conversion flow remains responsible for changing the stock structure. There is still one stock-bearing option dimension. Colour/material/fit/specifications use the existing description; no new structured attributes or import format are introduced.

The guidance uses the existing Nihiloba cream/green visual style and EN/FR/LN/SW. Mobile browser checks change categories repeatedly and verify the description, selected size and quantity survive. Both interfaces use identical guidance and retain their existing authorization and save contracts.

No migration, dependency, payment or public visibility change. Backend category suggestions and import/WhatsApp contracts are reused unchanged. Exact validation, commits and deployments are recorded in the existing Wenze tracker.
