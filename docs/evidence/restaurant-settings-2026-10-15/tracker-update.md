# Settings release tracker update

Applied and hash-verified on 15 October 2026:

| Existing workbook | Added rows | Status |
| --- | --- | --- |
| OneDrive `SHIDA_Restaurant_Malewa_Release_Validation_Tracker.xlsx` | `Automated checks!A57:J57` (SET01), `Sources and runs!A49:H49` | Partial |
| OneDrive `shida_restaurants_pilot_tracker_2026-10-10.xlsx` | `Batch log!A27:F27`, `Evidence!A37:C37` (S32) | Partial; existing release gate unchanged |
| Backend `docs/evidence/restaurants_whatsapp_2026_10_12/release_validation_tracker.xlsx` | `Automated checks!A57:J57` (SET01), `Sources and runs!A49:H49` | Partial |

The rows record 25 production-preview browser passes, 132 focused Website test executions (including existing source-copy duplicates), 525 Backend passes and two expected Organization-only skips, plus passing build, typecheck and changed-file lint. They retain the prior full-suite failures and open staging, real WhatsApp phone/provider, physical-device and human FR/EN/LN/SW acceptance gates.

Artifact Tool authored and rendered the rows. Its native process exited abnormally after producing all exports and renders; each saved workbook was independently reopened and checked. To avoid rewriting unrelated workbook features, only those authored rows were inserted into copies of the original XLSX packages. Every existing cell value, formula and style was compared, and all other package parts remained byte-identical. The reviewed files were then copied to the three original paths, with source-before and output-after SHA-256 checks. `tracker-preservation.json` records the paths, hashes, ranges and successful application.

Existing formulas, tables, formatting, validation, sheet order and earlier gate history were preserved. No broad-suite row was changed to Pass. The saved `tracker-*-settings.xlsx` files reproduce the applied versions. Native Excel UI acceptance was not performed.
