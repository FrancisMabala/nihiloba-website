# Receiving orders tracker update

Applied to the three existing workbooks on 15 October 2026, retaining **Partial**:

| Workbook | Added rows |
| --- | --- |
| OneDrive main Restaurant/Malewa validation tracker | Automated checks A58:J58 (`INT01`); Sources and runs A50:H50 |
| OneDrive pilot tracker | Batch log A28:F28; Evidence A38:C38 (`S33`) |
| Backend WhatsApp release validation tracker | Automated checks A58:J58 (`INT01`); Sources and runs A50:H50 |

The new rows record 52 production-browser cases, 116 focused Website unit executions, 253 Backend executions, passing build/typecheck/lint and current sole head 0163. They preserve the six older combined C1-E failures, historical broader red gates and pending staging, real WhatsApp phone/provider, physical devices, human languages and reusable-schedule work.

Artifact Tool authored and rendered the changes. Its native process returned a nonzero exit after producing the exports; saved workbooks were independently reopened and verified. Only the authored new rows were transferred into original XLSX packages to preserve unrelated features. Every original row, value, formula and style was checked; all other package parts remained byte-identical. Source hashes were checked before application and output hashes after copying. See `tracker-preservation.json` for exact source paths, hashes and ranges. Final saved packages were reopened with Artifact Tool and rendered again. Native Excel UI acceptance was not performed.
