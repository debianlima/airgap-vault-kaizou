# Third-party notices and provenance

This document covers the code copied, modified, adapted or newly integrated by
AirGap Vault Kaizou relative to AirGap Vault v3.34.4. Project and product names
are used only to identify origin and compatibility; no endorsement is implied.

## AirGap Vault upstream

- Project: `airgap-it/airgap-vault`
- Base: tag `v3.34.4`, commit
  `aa50b7f0371ed2e681f358d22b546c7c000e05b7`
- License: MIT
- Copyright: Copyright 2020 Papers AG
- Local license copy: [`LICENSE.md`](LICENSE.md)
- Changes: the files and change classes are enumerated in
  [`MODIFICATIONS.md`](MODIFICATIONS.md). Modified TypeScript, HTML and test
  files contain an origin/modification header.

The upstream MIT permission and warranty notice in `LICENSE.md` applies to the
upstream-derived portions of this fork. Kaizou changes are distributed under
the same MIT terms unless a file says otherwise.

## Keystone BC-UR libraries

The Kaizou source imports the following libraries; their code is obtained from
the dependency graph at build time and retains its independent license:

| Component | Version | License | Use |
|---|---:|---|---|
| `@keystonehq/bc-ur-registry` | 0.6.3 | Apache-2.0 | common BC-UR registry types |
| `@keystonehq/bc-ur-registry-eth` | 0.19.1 | ISC | existing Ethereum registry integration |
| `@keystonehq/bc-ur-registry-sol` | 0.9.5 | ISC | `crypto-multi-accounts`, `sol-sign-request` and `sol-signature` |

The published Solana package identifies author
`soralit <soralitria@gmail.com>` and git snapshot
`83d8e223d29e5cc71dccc963388d65a87c894636`. The common registry identifies
`Soralit <soralitria@gmail.com>` and source
<https://github.com/KeystoneHQ/ur-registry>.

`src/app/services/solflare-keystone/solflare-keystone.service.ts` is a Kaizou
adapter written against these public library APIs; it is not a copy of the
Keystone firmware parser.

## NGRAVE BC-UR

- Component: `@ngraveio/bc-ur@1.1.6`
- Source: <https://github.com/ngraveio/bc-ur>
- License: MIT
- Author metadata: Antonis Poulakis `<antwnic4@gmail.com>`
- Use: single- and multipart/fountain UR encoding and decoding.

## AirGap Solana Module and Keystone firmware provenance

The binary Kaizou releases 1.0.0 through 1.1.2 embedded versions 0.1.3 through
0.1.6 of the separately maintained `airgap-solana-module`. The corrected module
source version 0.1.7 records its own full bundled dependency inventory and the
following Keystone provenance:

- source: <https://github.com/KeystoneHQ/keystone3-firmware>
- commit: `6ab436a2c34a5bcce2e72aae1e6ff8ee43bf057f`
- license: MIT
- copyright: Copyright (c) Year YANSSIE HK LIMITED
- selectively adapted parser surfaces: program identifiers, instruction names
  and discriminants from the Solana resolvers for System, Vote, Stake, Token,
  Token Lending, Token Swap v3, Squads v4 and Jupiter v6.

The complete mapping and license texts live in that module's `LICENSE`,
`THIRD_PARTY_NOTICES.md` and `THIRD_PARTY_DEPENDENCIES.md`. A future Kaizou APK
must embed all three files and validate their hashes from the signed module
manifest. Release 1.1.3 is source/licensing documentation only and contains no
APK or module bundle.

## No trademark grant

AirGap, Keystone, Solflare, NGRAVE, Solana and other names remain the property
of their respective owners. Open-source copyright licenses do not grant a
right to suggest official status or endorsement.
