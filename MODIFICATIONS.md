# Modifications and file provenance

## Base and scope

AirGap Vault Kaizou is based on `airgap-it/airgap-vault` v3.34.4 at commit
`aa50b7f0371ed2e681f358d22b546c7c000e05b7` (MIT, Copyright 2020 Papers AG).
The current branch is a fork containing a Solana/Solflare/Keystone integration,
tests, release tooling and project-control documents.

## Modified upstream application files

The following files existed in the upstream base and were modified. Each now
contains an origin/modification header, except generated or lock files whose
provenance is recorded centrally here.

| Area | Files | Kaizou modification |
|---|---|---|
| Account sharing | `src/app/pages/account-address/account-address.page.ts`, `.spec.ts`; `src/app/pages/account-share/account-share.page.ts`, `.html`, `.spec.ts` | Adds the guarded AirGap Solflare companion option and Keystone-compatible account sync QR. |
| Request display | `src/app/pages/deserialized-detail/deserialized-detail.effects.ts` | Preserves Solana flow state and guarded error behavior. |
| QR collection | `src/app/pages/tab-scan/tab-scan.page.ts`, `.spec.ts` | Routes dynamic UR frames without changing the upstream non-Solana paths. |
| Signed response | `src/app/pages/transaction-signed/transaction-signed.page.ts`, `.html`, `.spec.ts` | Displays the guarded `sol-signature` response QR. |
| IAC routing | `src/app/services/iac/iac.service.ts`, `.spec.ts` | Registers the Solflare handler and matches a local Solana account. |
| Interaction | `src/app/services/interaction/interaction.service.ts`, `.spec.ts` | Produces the response QR only for the Solflare/Keystone context. |
| Dependency/build metadata | `package.json`, `yarn.lock` | Adds fixed BC-UR registry/transport dependencies and Kaizou version metadata. |
| Documentation | `README.md` | Adds the fork disclosure, experimental status, cumulative history and license/provenance links before the preserved upstream README. |

## New Kaizou integration files

- `src/app/services/solflare-keystone/solflare-keystone.service.ts` and its
  specification implement the adapter against Keystone registry and NGRAVE
  BC-UR APIs.
- `contratos/`, `scripts/`, `docs/`, `logs/`, `manifesto.yaml`, `lexico.yaml`,
  `competencias.yaml` and `estado.md` describe and mechanically verify the
  Kaizou-specific contract. These files are original project-control material
  unless they explicitly cite an external source.
- `THIRD_PARTY_NOTICES.md`, `LEGAL_AUDIT.md` and this file document license and
  provenance controls added in release 1.1.3.

## Separately maintained embedded module

The module is not stored as source in this repository. Release tooling injects
a production-signed `airgap-solana-module` package into a staging tree. Starting
with the 0.1.7 contract, the required package files are:

- `airgap-solana-module.bundle.js`
- `manifest.json`
- `module.sig`
- `LICENSE`
- `THIRD_PARTY_NOTICES.md`
- `THIRD_PARTY_DEPENDENCIES.md`

The three legal files are hashed in the signed manifest. The Kaizou build gate
rejects a missing file or hash mismatch.

## Generated and historical material

Generated diagrams and logs are evidence derived from the Kaizou contracts and
test runs. They are not claims of upstream authorship. Historical release
descriptions and APK hashes are preserved in
`releases/airgap-vault-kaizou-1.1.3.md` even when the superseded GitHub release
pages are removed. The original tags and commits remain available.
