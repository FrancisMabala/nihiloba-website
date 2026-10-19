# Document-tool dependency preservation

On 19 October 2026, the approved cleanup removes only the 8,524 installed files
under `tmp/tracker-edit/node_modules/` from Git tracking. Local files remain in
place. First-party scripts, application code, evidence, École work and production
backups are unchanged. `node_modules/` is ignored at every depth.

Exact public-npm recreation of private `@oai/artifact-tool` 2.8.93 is unverified;
the active local tool is 2.8.99. Both versions are preserved, not silently replaced.
The owner's private OneDrive folder `SHIDA/document-tool-preservation` contains
`document-tools.zip`, `manifest.json`, `restore_tree.py`, README and verification
results. A local copy is at `C:/NIHILOBA/document-tool-preservation-20261019-final`.

The combined Backend/Website archive is 174,604,220 bytes. SHA-256:
`36b06336eb69aa19109cdd85185e1eb851e51df72581e2ae800bc0dc4a6540d2`.

All eight cloud files were downloaded and checksum-matched to their originals.
All 8,114 archive blobs were verified; physical restore tests read back 8,523
committed Backend files and 8,526 current Website files byte-for-byte. The
manifest preserves all four trees separately, including missing/replaced files.
These checks establish file recovery, not every historical tool workflow.

To recover this Website tree, verify the ZIP checksum, then use the provided
helper with `--archive <zip> --tree 3 --version local --destination <new-folder>`.
Use `--version committed` for the original Git version. The helper refuses an
existing destination and verifies every restored file. Keep the private bundle
and recovery helper together; do not publish them. The Microsoft 365 payment
warning observed during verification needs owner attention for continued cloud
availability; no new paid service was added.

Before pulling the untracking commit into another active checkout, preserve its
needed dependency files outside that checkout: Git may remove formerly tracked
files during a pull. Do not reset, clean or stash another task's changes. Restore
needed files as ignored files only after safely integrating the commit. This
batch uses isolated checkouts and does not pull into active École checkouts.
Git history is not rewritten, so old dependency blobs remain in prior commits.
