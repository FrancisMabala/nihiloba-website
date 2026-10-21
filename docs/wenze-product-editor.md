# Wenze product editor follow-up — 21 October 2026

Products have their own category and product type, independent of the shop. The protected backend supplies the taxonomy; the public catalog snapshot matches backend commit 2803d56c. Existing broad categories remain supported, including imported products. Future taxonomy changes must refresh the public snapshot in both frontends.

Details, Photos and Stock keep the same product heading and actions. Details includes sizes/formats with explicit quantities; the existing backend supports one stock option dimension per product. Conversion uses preflight and revision checks; reserved stock restrictions remain enforced. Sharing opens a focused dialog with the backend-provided public link, copy action, QR and public preview. Hidden products/shops do not expose a link. Receipt sending and DGI work remain excluded.

Validation: production build and targeted ESLint pass. Product editor browser coverage uses deterministic protected API fixtures in Edge at 390, 820 and 1366 pixels, in EN/FR/LN/SW. It verifies cross-category edits without changing the shop, details/photos navigation, allocation of 7 units into two formats, renaming, preserved category, share URL/QR and horizontal overflow. Existing seller journeys cover sales, inventory and receipt printing/PDF. Screenshots in evidence/wenze-product-editor are real browser captures with fixture data, not production customer data. Physical phones, tablet hardware and printers are not validated by viewport emulation.

## Quick/detailed entry and colour correction

Both Quick add and Detailed add are visible on the catalog. Quick add retains its existing minimal backend mode; detailed creation exposes condition, description, stock and variant choices. The existing `option` contract supports colour labels and combinations (for example Rouge / M); it is now labelled Colours / custom choices, with explanatory examples. No new variant enum, multi-axis matrix or migration was introduced.

An unsaved details form now provides Save and continue beside choices. Browser validation runs first, PATCH must succeed, and conversion preflight uses the saved product and current revision. Existing variants become editable after the details save. Failures preserve the details form; backend revision and reserved-stock safeguards remain authoritative. Authorization and privacy are unchanged.

The regression browser journey creates products through both quick and detailed modes with opaque upload references, checks custom colour/size quantities in the request, and exercises dirty-details save followed by conversion and rename. Coverage spans EN/FR/LN/SW and 390/820/1366 px on both clients. Evidence is under evidence/wenze-product-entry; it uses local protected-API fixtures, not production writes.
