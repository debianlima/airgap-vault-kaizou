# Engineering license review — Kaizou 1.1.3

Review date: 2026-08-25.

## Result

The public source fork can continue to be shared under MIT terms if the
upstream Papers AG MIT notice is preserved and the independently licensed
Keystone/NGRAVE dependencies and adapted module sources retain their notices.
This repository now records those relationships in `LICENSE.md`,
`THIRD_PARTY_NOTICES.md`, `MODIFICATIONS.md`, source headers and release notes.

Release 1.1.3 is intentionally source/licensing documentation only. No APK is
attached and no claim is made that module 0.1.7 has been production-signed,
embedded or Android-homologated.

## Finding corrected in the separately maintained module

An esbuild metafile reconstruction of `airgap-solana-module` 0.1.6 showed that
the closed IIFE bundle incorporated `rpc-websockets`, declared
LGPL-3.0-only, even though the module is offline and did not use networking.
The exact older dependency graphs were not locked and the prior public APKs
did not include the required module legal notices.

Module 0.1.7 corrects the distribution design by:

- committing a reproducible lockfile;
- replacing the unused WebSocket interface with an original fail-closed stub;
- failing the build if any `rpc-websockets` implementation input is bundled;
- generating notices from the actual esbuild input graph;
- rejecting unresolved/GPL/AGPL/LGPL bundle entries;
- placing project and dependency license files in the ZIP; and
- signing their SHA-256 values through the module manifest.

The corrected test bundle contained 131 dependency records and no GPL, AGPL or
LGPL implementation input. This statement describes the tested source build,
not an independent legal opinion.

## Historical release handling

The 1.0.0–1.1.2 release pages and APK assets are superseded because their
module packages lacked the 0.1.7 legal controls. Their descriptions and hashes
are consolidated in the 1.1.3 notes. Removal of the release objects happens
only after 1.1.3 and its legal/provenance archive are published and verified.
The historical tags and commits are retained for auditability.

## Residual limits

- No human code review or independent security audit has been performed on the
  Kaizou changes.
- No fresh APK was built or device-tested in this licensing-only release.
- Dependency metadata may be incomplete or incorrect; future binary builds
  must rerun the exact bundle/archive audit.
- Trademark, patent and jurisdiction-specific questions are outside this
  engineering review.

This document is an engineering compatibility review, not legal advice or a
guarantee against third-party claims.
