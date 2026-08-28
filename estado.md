# Estado — 2026-08-26 — contrato v34

## Decisões vigentes
- A U27/Solana 1.1.3 permanece concluída e publicada; o contrato v34 abre uma frente independente de integração Monero/XMR sem alterar o APK/release já homologados.
- A integração Monero é multiestágio e segue `xmr-output -> xmr-keyimage -> xmr-txunsigned -> xmr-txsigned`; não reutilizar a coreografia one-shot de Solana.
- Oracle primário XMR: `monero-wallet-cli v0.18.5.1` no commit `4f92268d7c16741cfb41e5bbe2aa46cc260a9ea5`, pacote/hashes assinados e verificados.
- Oracle de interoperabilidade: Feather Wallet `2.8.1` no commit `51dc8ed04f0fc4cead2e867a249c32bd3e3b8126`, distribuição Linux com assinatura destacada verificada.
- `airgap-vault-kaizou-1.1.3` é a release publicada e contém agora o APK homologado da U27; não foi criada 1.1.4 apenas para o binário.
- Asset APK: `airgap-vault-kaizou-1.1.3.apk`, SHA-256 `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`, 85.705.684 bytes.
- Android metadata do APK: package `it.airgap.vault`, `versionName=0.0.0`, `versionCode=1`; `1.1.3` é versão/tag da release/package.
- Módulo incorporado: `airgap-solana-module 0.1.7`, ZIP de produção SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- `U27_BINARY_HOMOLOGATION_PASS=PASS`, `RECONCILIATION_CLOSURE=PASS`, `DEPENDENCY_REFERENCES=PASS`, `publication_gate=PASS`.
- Skill de projeto: `airgap-wallet-engineering-skill@0.2.9`, reconciliada até `4741f19df57950a9f487748e1b7d41c97dfef4b9`.

## Decisões superadas
- H01 clean-room, H02 disclaimer e H03 necessidade de novo uso da Solflare estão fechadas/superadas.
- H03 foi eliminado por replay de captura real pública Solflare publicada na documentação oficial Keystone; nenhum uso de conta/aceite Solflare foi necessário.
- Registro histórico APK `1.1.3/10013` foi corrigido para o estado observado `0.0.0/1`.
- Criar 1.1.4 apenas para o APK foi descartado.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- Captura QR runtime: 4/4 PASS.
- Foreign-account real público: `No account found` PASS, sem `Incompatible code`, null dereference, assinatura ou mutação relevante.
- Quatro assinaturas runtime: requestId, 64 bytes e Ed25519 exata PASS.
- Persistência `force-stop/start`: PASS.
- Contrato 936 e build verifier 938: PASS; 936/938/946/947 agora `aceito`.
- Fecho atual: catálogo `b42494e6af95a78c79ef4f0ebd4f5caddc25f9a6`, skill `4741f19df57950a9f487748e1b7d41c97dfef4b9`; DELTA/LEARNING/RECONCILIATION/DEPENDENCIES PASS.
- APK e checksum foram publicados na release existente 1.1.3; redownload remoto do APK reproduziu hash/tamanho locais e o checksum remoto contém exatamente o hash homologado.
- Corpo da GitHub Release sincronizado com `releases/airgap-vault-kaizou-1.1.3.md` e verificado byte a byte pela API.

## Pendências técnicas não humanas
- Nenhuma pendência técnica U27.

## Trabalho compartilhado
- `manifesto.yaml.trabalho_compartilhado` está `null`; U29 Monero transport/parser encerrada e sem locks de recurso.

## Competências ativas nesta unidade
- `telemetry-data-visualization@2`
- `desenvolvedor-de-software@14`
- `github-incremental-reconciliation@7`
- `governanca-ontologica-de-skills@1.0.4`
- `airgap-wallet-engineering-skill@0.2.9`
- `android-container-avd-lab@0.1.4`
- `android-airgap-runtime@0.1.4`
- `release-packaging@0.2.0`

## Falhas de portão por tipo de entrada
- Nenhuma falha vigente; falhas e NOT_RUN anteriores permanecem no log como histórico, sempre superados por evidência posterior explícita.

## Divergências da última reconciliação
- Corrigidas: metadata APK, checkout local stale do catálogo, `dist` 0.1.6 descartado em favor do ZIP 0.1.7 exato e dependência desnecessária de novo uso Solflare.
- Pendentes de autorização: nenhuma.
- Lock legado U18 `airgap-vault-kaizou-signing-simulation.lock` continua fora do escopo e não foi removido por inferência.

## Entradas aceitas
- Histórico aceito preservado; 936, 938, 946 e 947 estão `aceito`.

## Evidência binária U27 atual
- APK exato + módulo 0.1.7: PASS.
- Android 11/API30/x86_64 Google Play `user/release-keys` non-root e clean install: PASS.
- Matriz QR: 4/4 PASS.
- Foreign account real público: PASS.
- Assinaturas: 4/4 PASS criptográfico.
- Persistência: PASS.
- Reconciliação/dependências: PASS.
- `U27_BINARY_HOMOLOGATION_PASS=PASS`.
- Publicação: APK asset id `531346364`; checksum asset id `531346490`; redownload/hash PASS; corpo da release sincronizado; quatro assets remotos presentes.

## Próxima unidade
- Próxima unidade: integrar o parser XMR ao scanner/roteamento do Vault, mantendo signer e rede fora do escopo até a homologação de transporte runtime.

## Integração Monero v34
- Contrato: `contratos/airgap-vault-kaizou-monero.schema.json`.
- Documento de arquitetura: `docs/airgap-vault-kaizou-monero-integration.md`.
- Gate mecânico: `scripts/airgap-vault-kaizou-monero-oracle-gate.js`.
- Evidência U28: `logs/U28-2026-08-26-monero-protocol-research.log`.
- UR types fixados pelo Feather 2.8.1: `xmr-output`, `xmr-keyimage`, `xmr-txunsigned`, `xmr-txsigned`.
- Magic wallet2 fixados pelo Monero v0.18.5.1: outputs `Monero output export\x04`, key images `Monero key image export\x03`, unsigned tx `Monero unsigned tx set\x05`, signed tx `Monero signed tx set\x05`.
- Implementação do signer ainda não começou nesta unidade por desenho: primeiro devem existir fixtures canônicas e round-trip byte-a-byte aceitos pelos oráculos.

- U28 protocol research: PASS; entradas 948–951 aceitas.

- U29 transport/parser: PASS; `MoneroAirgapService` implementa BC-UR byte-preserving para `xmr-output`, `xmr-keyimage`, `xmr-txunsigned`, `xmr-txsigned`; 11/11 testes PASS; fixtures oficiais Monero v3 são rejeitados como versões legadas.
- Entradas 952–954: `aceito`.
- U30 nonregression Solflare/Monero: PASS; 23 arquivos de produto divergentes do upstream estão em allowlist explícita, mantendo guards IAC/Solflare e proibindo rede/signer no transport XMR.

## U31 — Cake × Feather × Keystone3 Monero QR
- Estudo de source/licenças concluído em refs pinados: Cake `v6.4.1` (`8f38ba6b...`), Feather `2.8.1` (`51dc8ed0...`) e Keystone3 `3.0.0` Cypherpunk (`7f2c4423...`).
- Pareamento público: wire-compatible nos três. Keystone gera JSON version 0 com `primaryAddress`, `privateViewKey` e `restoreHeight`; Cake e Feather reconhecem esses campos. Cake v6.4.1 ainda mantém Keystone como `coming soon` na UI; Feather tem apenas ressalva de nome local porque Keystone não envia `walletName`.
- Pareamento privado/PIN do Keystone: bloqueado para Cake/Feather nesta versão; nenhum decoder correspondente foi encontrado nos refs auditados.
- Outputs↔key-images: compatibilidade direta três-vias por `xmr-output`/`xmr-keyimage`, CBOR byte string e bytes wallet2 canônicos.
- Unsigned↔signed tx: compatibilidade direta três-vias por `xmr-txunsigned`/`xmr-txsigned`, CBOR byte string e bytes wallet2 canônicos.
- Simulação byte-preserving: 4/4 PASS; relatório visual `reports/airgap-vault-kaizou-monero-compatibility.html`.
- Licenças: Cake MIT; `cw_monero` MIT; `monero_c` LGPL-3.0; bc-ur-dart MIT; C++ bc-ur BSD-2-Clause-Patent; Feather BSD-3-Clause; Keystone3 root MIT; ur-registry e crates Monero Serai/Cuprate usados pelo firmware MIT. Biblioteca MH1903 QRDecode é pré-compilada/IP-restricted e não deve ser importada.
- Diretriz: preferir interoperabilidade por protocolo/implementação própria no Kaizou. Qualquer futura incorporação de `monero_c` exige decisão explícita sobre LGPL-3.0 e obrigações de distribuição; qualquer componente Keystone copiado exige novo fecho de licenças por crate/arquivo.
- Entradas 960–963: `aceito`.

## U32 — pareamento público Keystone isolado
- Parser version-0 público implementado em serviço Monero dedicado: primary address 95-char Monero Base58, private view key 32-byte hex e restoreHeight não negativo.
- Private/PIN QR (`encrypted=true`) continua explicitamente bloqueado até existir decoder auditado.
- Página dedicada `/monero-keystone-pairing` usa o scanner existente por composição/herança, mas não chama IACService, NavigationService, TransactionService nem WalletService.
- A private view key permanece somente em memória durante parsing e não é exibida nem registrada; a UI mostra apenas endereço público, restore height, origem e confirmação de shape válido.
- Tests: pairing service 9/9 PASS; pairing page 4/4 PASS.
- Guard de preservação: `TabScanPage`, `NavigationService`, `IACService` e `TransactionService` estão byte-idênticos ao commit U31 `0c14f3cc...`.
- `package.json` e `yarn.lock` não mudaram; nenhuma nova dependência/licença foi incorporada. Gate de licenças U31 foi rerodado e permaneceu PASS.
- Entradas 964–970 aceitas; entrada 241 foi alterada somente por rota lazy aditiva e 932 passou a proteger explicitamente métodos runtime compartilhados.
