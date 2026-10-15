# Schedule tracker update

Applied to the three existing source workbooks on 15 October 2026, retaining **Partial**:

| Workbook | Appended ranges |
| --- | --- |
| Main Restaurant/Malewa release tracker | Automated checks A59:J59 (`SCH01`); Sources and runs A51:H51 |
| Pilot tracker | Batch log A29:F29; Evidence A39:C39 (`S34`) |
| Backend WhatsApp release tracker | Automated checks A59:J59 (`SCH01`); Sources and runs A51:H51 |

Rows record the exact local test results, migration ordering (existing Services 0164, then Restaurant 0165), and outstanding live/broader gates. The [handoff](../../restaurants-schedules-2026-10-15.md) describes individual test runs and corrected diagnostic failures.

Artifact Tool authored the new rows, exported, reopened and rendered the final packages. Its bundled Windows runtime returned exit code 1 after producing the exports and after read-only verification, as in the prior tracker batch. Outputs were independently parsed and verified. A first package-preservation attempt missed namespaced closing tags and transferred no new rows; this was corrected, then final rows were reopened and visually checked before the final source copy.

Only new rows were transferred into the existing packages. Every previous row remains byte-for-byte intact within worksheet XML; new wrapping styles were appended without modifying existing styles. Other package parts remain byte-identical. Source hashes were checked before application and saved-source hashes after copying. Exact paths, hashes and preservation checks are in `tracker-preservation.json`. Final previews and value inspections are adjacent. Native Excel acceptance is not claimed.
