# Monero QR interoperability study — Cake Wallet × Feather × Keystone3 firmware 3

## Scope and pinned sources

This study compares three independent source trees without importing their implementation into the Kaizou APK:

- Cake Wallet `v6.4.1`, commit `8f38ba6b171a966c56897f0d32077c3ac4d51420`;
- Feather Wallet `2.8.1`, commit `51dc8ed04f0fc4cead2e867a249c32bd3e3b8126`;
- Keystone3 firmware `3.0.0`, commit `7f2c4423df824c1054efe125be9662cdbf6767b8`, specifically the `CYPHERPUNK_VERSION` Monero build.

Cake pins `monero_c` at `3bfb3856a838f2bf6b729501837bb0295dedf25d`. Keystone3 pins `ur-registry 1.0.5`; the corresponding source state in `KeystoneHQ/keystone-sdk-rust` is `284c0da7c82de3c05ca7928729395aafe4d7220d`.

## Finding 1 — one common transaction wire protocol

All three implementations converge on the same four registry types:

| Direction | UR type | Canonical wallet2 payload |
| --- | --- | --- |
| online/view-only → offline signer | `xmr-output` | `Monero output export\x04...` |
| offline signer → online/view-only | `xmr-keyimage` | `Monero key image export\x03...` |
| online/view-only → offline signer | `xmr-txunsigned` | `Monero unsigned tx set\x05...` |
| offline signer → online/view-only | `xmr-txsigned` | `Monero signed tx set\x05...` |

Cake's pinned `monero_c` patch serializes the existing wallet2 blob, converts it to bytes, wraps it as a CBOR byte string and applies BC-UR. Feather uses the same four types in its offline-signing wizard. Keystone3 imports `XmrOutput`, `XmrKeyImage`, `XmrTxUnsigned` and `XmrTxSigned`; its `ur-registry 1.0.5` represents each payload as `Bytes`, with the Monero UR types encoded/decoded as CBOR byte strings.

Therefore no semantic translation is required for methods 2 and 3 below. A carrier may fragment/reorder BC-UR fountain frames, but the reassembled wallet2 bytes must remain identical.

## Finding 2 — the public pairing QR is also shared

Feather's view-only export emits compact JSON with `version=0`, `primaryAddress`, `privateViewKey`, `restoreHeight` and `walletName`. Cake's QR restore logic has an explicit Monero special case for version 0 requiring `primaryAddress`, `privateViewKey` and `restoreHeight`.

Keystone3 Cypherpunk has a dedicated `get_connect_cake_wallet_ur()` implementation. Its unencrypted result is text JSON containing `version=0`, `primaryAddress`, `privateViewKey`, `restoreHeight=0`, `encrypted=false`, and `source="Keystone"`.

That public JSON is wire-compatible with Cake's parser and with Feather's view-only scanner. Feather uses `walletName` only for the local file name; Keystone does not send it, so interoperability is functional but has a naming/UX caveat.

Cake v6.4.1 nevertheless places Keystone in the `comingManufacturers` list and marks it `coming_soon_tag`. Consequently the protocol is compatible but the Cake product UI does not yet expose Keystone as a normal selectable hardware wallet.

### Private QR caveat

Keystone3 can instead encrypt `primaryAddress` and `privateViewKey` with a generated six-digit PIN and set `encrypted=true`. No matching decrypt path for this Keystone private-QR format was found in Cake v6.4.1 or Feather 2.8.1. The study therefore treats private pairing as **not interoperable yet**.

## Three functional methods

### Method 1 — pairing / watch-only creation

- Keystone3 public QR → Cake parser: **protocol compatible**, but Cake's Keystone device option is UI-gated as coming soon.
- Keystone3 public QR → Feather view-only restore: **compatible with UX caveat** because `walletName` is absent.
- Feather view-only JSON → Cake QR restore: **compatible**; Cake explicitly recognizes the same version-0 field set.
- Keystone3 private encrypted QR → Cake/Feather: **blocked pending a matching decrypt/PIN adapter**.

### Method 2 — outputs ↔ key images

**Direct protocol compatibility across Cake, Feather and Keystone3 Cypherpunk.** All three agree on `xmr-output`, `xmr-keyimage`, CBOR bytes, and the current wallet2 prefixes. Keystone3 actually decrypts outputs, verifies the wallet identity, generates key images from its offline seed, and emits `XmrKeyImage`.

### Method 3 — unsigned ↔ signed transaction

**Direct protocol compatibility across Cake, Feather and Keystone3 Cypherpunk.** Cake/Feather transport the canonical wallet2 unsigned/signed blobs. Keystone3 parses `XmrTxUnsigned`, shows transaction metadata, signs with the offline seed and emits `XmrTxSigned`.

## What this means for Kaizou

The Kaizou v34 transport implemented in U29/U30 already matches the same four UR types and CBOR byte-string envelope. It can therefore be an interoperable scanner/review carrier today. It is **not yet a Monero signer**: spend-key derivation, output decryption/key-image generation and unsigned-transaction signing remain future gates.

The safest implementation path is protocol-level interoperability rather than copying a wallet implementation wholesale. In particular, Cake's `monero_c` is LGPL-3.0, while Cake itself is MIT. Copying or linking that component into Kaizou would introduce LGPL obligations and needs a deliberate packaging/legal design.

## License audit

| Component | Pinned state | License / finding | Integration consequence |
| --- | --- | --- | --- |
| Cake Wallet | v6.4.1 | MIT | Permissive; retain notice for copied substantial code. |
| Cake `cw_monero` | v6.4.1 | MIT | Permissive wrapper. |
| Cake `monero_c` | `3bfb3856…` | **LGPL-3.0** | Do not vendor/link silently; combined-work/relink/source obligations need explicit design. |
| Cake `bc-ur-dart` | `5738f70d…` | MIT | Permissive. |
| `MrCyjaneK/bc-ur` used by Cake's Monero patch | `d82e7c75…` | BSD-2-Clause-Patent | Preserve notice and patent-license terms if incorporated. |
| Feather | 2.8.1 | BSD-3-Clause | Preserve notice/disclaimer; no endorsement. |
| Keystone3 firmware | 3.0.0 | MIT at repo root | Main source permissive, but firmware-wide dependency audit is still required for redistribution. |
| Keystone `ur-registry` | 1.0.5 | MIT | Permissive. |
| Keystone Monero `monero-serai` / `monero-wallet` crates | `c784e6c6…` | MIT | Exact crates used by Monero are MIT even though unrelated Serai crates are AGPL. |
| Keystone `cuprate-cryptonight` | `8ae09c3d…` | MIT | Exact crate used by Monero is MIT. |
| Keystone MH1903 QR decode library | firmware external binary | source not published due IP restriction | Must not be copied into Kaizou; not needed for protocol interoperability. |

The license matrix is a technical compliance inventory, not legal advice. If a later unit copies, links or redistributes any external implementation, that unit must recalculate the dependency-level license closure and update release notices before publication.

## Source evidence map

- Cake: `lib/view_model/restore/wallet_restore_from_qr_code.dart`; `lib/src/screens/connect_device/select_device_manufacturer_page.dart`; `lib/src/screens/ur/animated_ur_page.dart`; pinned `monero_c/patches/monero/0005-UR-functions.patch`.
- Feather: `src/dialog/ViewOnlyDialog.cpp`; `src/wizard/PageWalletRestoreKeys.cpp`; `src/wizard/offline_tx_signing/*`.
- Keystone3: `rust/rust_c/src/wallet/cypherpunk_wallet/cake.rs`; `rust/rust_c/src/monero/mod.rs`; `rust/apps/monero/src/{outputs,key_images,transfer,signed_transaction}.rs`; `src/ui/gui_chain/multi/cypherpunk/gui_monero.c`.
- Keystone UR registry 1.0.5: `libs/ur-registry/src/monero/xmr_{output,keyimage,txunsigned,txsigned}.rs` at source commit `284c0da7c82de3c05ca7928729395aafe4d7220d`.
