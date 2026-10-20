# Wenze receipt clarification

The receipt preview now identifies the document as a commercial receipt, not a
DGI-authenticated fiscal invoice or independent verification of payment.
EN/FR/LN/SW text accompanies the existing reference-only QR explanation.

Existing totals, reversal evidence and payment-state labels remain unchanged.
The shared backend PDF provides equivalent explanations for both 58 and 80 mm
paper. No API, schema, authentication, dependency or environment change.

Implementation requirements and fiscal prerequisites:
[Backend WNZ-01](https://github.com/FrancisMabala/shida-backend/blob/main/docs/wenze/WNZ_01_COMMERCIAL_RECEIPTS.md).
Actual test and release evidence belongs in the existing Wenze implementation
tracker. No fiscal integration or deployment is implied by this document.
