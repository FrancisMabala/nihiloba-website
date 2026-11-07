# Wenze draft confirmation refinement — 2026-11-07

The saved individual-listing draft dialog now uses an opt-in compact heading: its warning icon sits left of the title, with centered alignment. Explicit keep/delete labels are translated through the existing FR/EN/LN/SW dictionary. The red destructive action and existing confirmation, ownership, revision, deletion and error behavior are unchanged. Other confirmation callers retain their existing layout.

Validation: typecheck passed; lint passed with 11 pre-existing warnings; production webpack build passed. Eight browser tests passed (four languages at 390px and 1440px), covering alignment, overflow, safe initial focus, keep/Escape preservation, failed deletion and successful retry. Seven shared confirmation regression tests passed, covering Wenze archive/cart and Services template behavior. Desktop/mobile French screenshots were inspected. Tests used isolated browser fixtures; no production records were deleted. No migration, environment, dependency or WhatsApp-template changes.

Evidence remains in the task workspace outputs/individual-selling-refinement directory. This narrowly scoped release does not complete the separate Appartements wizard batch.
