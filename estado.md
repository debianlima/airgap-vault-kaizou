# Estado — 2026-08-26 — contrato v33

## Decisões vigentes
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
- `manifesto.yaml.trabalho_compartilhado` está `null`; guest parado/preservado e locks KVM/Docker/AVD liberados.

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
- U27 concluída e publicada; próxima unidade somente por nova entrada/contrato.
