# Estado — 2026-08-26 — contrato v33

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` é a única release alvo deste APK; não criar 1.1.4 apenas para o binário.
- O candidato permanece o mesmo `app-debug.apk`, SHA-256 `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`, 85.705.684 bytes, sem rebuild após fixação do hash.
- O APK usa exatamente `airgap-solana-module 0.1.7`, ZIP de produção SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- Metadados Android reais do APK: package `it.airgap.vault`, `versionName=0.0.0`, `versionCode=1`; `1.1.3` é versão/tag da release/package.
- `U27_BINARY_HOMOLOGATION_PASS=PASS`; publicação na release existente 1.1.3 está autorizada pelos portões, condicionada agora apenas ao upload e verificação remota do mesmo hash.
- Skill de projeto: `airgap-wallet-engineering-skill@0.2.9`, reconciliada até `4741f19df57950a9f487748e1b7d41c97dfef4b9`.

## Decisões superadas
- H01 — recuperar PIN do AVD anterior — superada pela clean-room autorizada.
- H02 — disclaimer inicial do AirGap Vault — resolvida por aceite humano explícito.
- H03 — depender de novo uso/aceite da Solflare para obter captura real — superada por uma captura pública real de transação Solflare publicada na documentação oficial Keystone; o gate foi executado sem usar conta Solflare.
- Registro histórico do APK como `1.1.3/10013` — superado: quatro canais independentes provam `0.0.0/1` no APK exato.
- Criar 1.1.4 apenas porque 1.1.3 já existia — descartado.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- Matriz runtime de captura: 4/4 PASS; `Incompatible code` = 0.
- Quatro assinaturas runtime (`controlled-solana`, `pancake-clmm`, `stake-deactivate`, `tokenswap-v3`): requestId PASS, 64 bytes PASS e Ed25519 sobre mensagem exata PASS.
- Persistência por `am force-stop` → relaunch com emulator vivo: PASS; PID mudou, `U27 Cleanroom` reapareceu e o APK manteve hash idêntico.
- `realSolflareForeignAccount`: PASS usando QR real público Solflare da documentação oficial Keystone; requestId `75729c2d9e1140ff96a15546bee3d1fe`, retorno exato `No account found`, sem `Incompatible code`, null dereference, rota de assinatura ou mutação relevante.
- Entrada 936: contrato v33 PASS.
- Entrada 938: `--verify-only` PASS contra o ZIP de produção 0.1.7 exato; bundle SHA-256 `89da228dc516532a7470cf2bcc60734fc6a31c8b3c5456618f77688d67c026a9`.
- Fecho final: catálogo `b42494e6af95a78c79ef4f0ebd4f5caddc25f9a6`; `DELTA_INVENTORY=PASS`, `LEARNING_PRESERVED=PASS`, `RECONCILIATION_CLOSURE=PASS`, `DEPENDENCY_REFERENCES=PASS`.
- `U27_BINARY_HOMOLOGATION_PASS=PASS`.

## Pendências técnicas não humanas
- Publicar `airgap-vault-kaizou-1.1.3.apk` e `airgap-vault-kaizou-1.1.3.apk.sha256` na release existente.
- Redownload remoto do APK e checksum; exigir SHA-256 exato `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`.
- Atualizar a nota pública acumulativa da release preservando todo o histórico e promover entrada 947 somente após a verificação remota.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — unidade `U27-final-foreign-account-publish`, ativa até o fechamento da publicação.

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
- `evidencia-teste`: nenhuma falha vigente; falhas/NOT_RUN anteriores permanecem no log como histórico e foram superadas por evidência posterior explícita.
- `deploy-android`: nenhuma falha vigente; o primeiro `--verify-only` apontou para `dist` antigo do checkout e foi descartado, depois o mesmo gate passou contra o ZIP de produção 0.1.7 hash-fixado.
- `documentacao-release`: entrada 947 ainda `preexistente` até upload/verificação remota e atualização da nota pública.

## Divergências da última reconciliação
- corrigidas: metadados APK `0.0.0/1`; checkout local stale do catálogo; fonte correta do gate 938 é o ZIP de produção 0.1.7; H03 eliminado pela captura pública oficial.
- atuais: catálogo `b42494e6af95a78c79ef4f0ebd4f5caddc25f9a6`, skill `4741f19df57950a9f487748e1b7d41c97dfef4b9`; todos os portões de reconciliação/dependência PASS.
- recurso legado `airgap-vault-kaizou-signing-simulation.lock` da U18 continua fora do escopo e não foi removido por inferência.

## Entradas aceitas
- Histórico aceito preservado; 936, 938 e 946 agora `aceito`. 947 permanece `preexistente` até a publicação remota ser comprovada.

## Evidência binária U27 atual
- APK SHA-256: `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`.
- clean-room: Android 11/API30/x86_64, Google Play, `user`, `release-keys`, `ro.debuggable=0`, `ro.secure=1`, `adb root` recusado.
- instalação limpa e `base.apk` hash-idêntico ao candidato: PASS.
- módulo estático 0.1.7 byte-equivalente ao handoff de produção: PASS.
- matriz de captura: 4/4 PASS.
- foreign-account real público: PASS `No account found`.
- assinaturas: 4/4 PASS criptográfico completo.
- persistência de processo: PASS.
- reconciliação/dependências: PASS.
- `U27_BINARY_HOMOLOGATION_PASS`: PASS.
- publicação: pronta, ainda não verificada remotamente neste snapshot.

## Próxima unidade
- Concluir a publicação transacional da release 1.1.3: upload APK + checksum, redownload/hash, atualização da nota pública, promover 947 e fechar recursos/telemetria.
