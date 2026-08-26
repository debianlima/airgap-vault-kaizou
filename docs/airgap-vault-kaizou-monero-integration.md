# AirGap Vault Kaizou — Monero integration design (contract v34)

## Status

Protocol research and oracle pinning are complete. XMR signing implementation is intentionally blocked until the contract and transport gates below are installed and passing. This is a multi-stage Monero flow, not a Solana-style one-shot signer.

## Reference behavior

Primary external oracle: Monero `monero-wallet-cli` v0.18.5.1, tag `v0.18.5.1`, commit `4f92268d7c16741cfb41e5bbe2aa46cc260a9ea5`. The Linux x64 package is pinned by SHA-256 `22a7dda7b0cb699fdd6b7674c3b4a4465b337cc98a54983523b759e1e7cc9958`; the extracted `monero-wallet-cli` is `34c2a49d6d4d426062bc0c2a18bcba4bf372edfa410bbfbedfabfd2af94e74b4`. The signed hash list verified with fingerprint `81AC591FE9C4B65C5806AFC3F0AF4D462A0BDF92`.

Interoperability reference: Feather Wallet 2.8.1, tag `2.8.1`, commit `51dc8ed04f0fc4cead2e867a249c32bd3e3b8126`. Linux archive SHA-256 `4779c57e9443f7755add3c2414447d1593ebe06998e39a9f765deab5bd64c466`; detached signature verified with Feather release key fingerprint `8185E158A33330C7FD61BC0D1F76E155CEFBA71C`.

Official Monero offline signing behavior uses a view-only online wallet and an offline wallet containing the secret spend key. The transaction path is unsigned transaction -> offline signing -> signed transaction -> online submission. Correct view-only balance/spent-state additionally requires outputs/key-image synchronization when the online wallet does not yet know the relevant key images.

## Offline choreography

1. Online/view-only -> Vault: `xmr-output`, wallet2 bytes beginning with `Monero output export\x04`. This step is conditional when key images are already synchronized.
2. Vault -> online/view-only: `xmr-keyimage`, wallet2 bytes beginning with `Monero key image export\x03`. This step is paired with step 1.
3. Online/view-only -> Vault: `xmr-txunsigned`, wallet2 bytes beginning with `Monero unsigned tx set\x05`.
4. Vault -> online/view-only: `xmr-txsigned`, wallet2 bytes beginning with `Monero signed tx set\x05`.

Feather 2.8.1 wraps the canonical wallet2 bytes as a CBOR byte string and then applies BC-UR fountain encoding for animated QR. File transfer is an equivalent carrier for the same byte payload; transport must never rewrite canonical wallet2 bytes.

## Security boundary

The secret spend key belongs only to the offline Monero signer/module. The view-only side may possess the primary address and secret view key as required by Monero's view-only model. The AirGap Vault host must not contact a Monero node, query spent status, broadcast transactions, or infer canonical bytes from rendered fields. It may render parsed metadata, but signing is always over the exact imported wallet2 payload.

The implementation must record hashes of incoming canonical payloads before parsing. Unknown transaction semantics must remain explicit. A generated signer cannot be its own final verifier: signed output must be accepted by the pinned Monero CLI; Feather is an additional interoperability oracle for the UR choreography.

## Implementation sequence

The next implementation unit may add a Monero protocol-module boundary and transport parser only. It must first prove `xmr-output`, `xmr-keyimage`, `xmr-txunsigned`, and `xmr-txsigned` round trips byte-for-byte against pinned Feather/Monero fixtures. Only after those gates pass may spend-key derivation and transaction signing be implemented.

The first runtime signing homologation must use stagenet/synthetic funds and must keep broadcast disabled inside AirGap Vault. A signed transaction is accepted only when the independent Monero oracle loads it successfully; on-chain submission is outside the Vault boundary.

## Sources pinned for this contract

- Monero offline transaction signing documentation: `https://docs.getmonero.org/cold-storage/offline-transaction-signing/`
- Monero source: `https://github.com/monero-project/monero`, tag `v0.18.5.1`
- Monero release announcement/hash list: `https://www.getmonero.org/2026/07/08/monero-0.18.5.1-released.html`
- Feather source: `https://github.com/feather-wallet/feather`, tag `2.8.1`
- Feather offline signing documentation: `https://docs.featherwallet.org/guides/offline-tx-signing`
