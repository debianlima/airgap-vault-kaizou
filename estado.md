# Estado — 2026-08-24 — contrato v27

## Decisões vigentes
- AirGap Vault Kaizou alvo é `1.1.2` com `airgap-solana-module 0.1.6` estático e pacote Solana verificado por assinatura/hash antes do build.
- `sol-sign-request` aceita `SignType.Message` e `SignType.Transaction`; resposta Keystone é `sol-signature` com requestId preservado e assinatura Ed25519 sobre a mensagem exata.
- Coleta multipart Solflare usa normalização de carrier, fingerprint Fountain `type+seqLen+messageLen+checksum`, dedupe por stream, limite de 4 streams, TTL e ambiguidade explícita entre requests completos concorrentes.
- `TabScanPage` mantém cache visual deduplicado e encaminha leituras repetidas ao handler stream-aware.
- Homologação Android final usa Android 11 Google Play `user/release-keys`, non-root, e credencial só após o mesmo `BiometricPrompt` permanecer estável com `lockPassword` presente.
- No laboratório atual, `docker restart` é clean-room reset porque o emulator usa `-wipe-data`; persistência de produto é `am force-stop` → `am start` enquanto o emulator permanece vivo.
- Skill de projeto ativa e publicada: `airgap-wallet-engineering-skill` 0.2.6; `android-airgap-runtime` 0.1.4; `android-container-avd-lab` 0.1.2.

## Decisões superadas
- Decoder Fountain linear único — substituído por coleta stream-aware homologada.
- Descartar QR duplicado em `TabScanPage` antes do IAC — substituído por dedupe visual com entrega ao handler.
- Tratar container restart como teste de persistência neste laboratório — substituído pela inspeção de `-wipe-data` e restart de processo do app.
- Skill 0.2.4 — substituída por 0.2.6 após os aprendizados homologados U26.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- U26/U27 homologaram o coletor resiliente no APK U26 SHA-256 `364d0793f94e8221d4d3dc1d02c8de817e82d519f04b765585b6e55d42003381`: matriz scanner 4/4, replay estrangeiro Solflare em `No account found` sem `Incompatible code`, e respostas controlada/Pancake/Stake/TokenSwap com requestId, 64 bytes e Ed25519 válidos.
- Portões finais locais passaram: package 1.1.2, build Angular, agregador de seis specs, suíte integral 99/99, nonregression, módulo Solana 0.1.6, contrato de release, seis diagramas e estrutura 942/942.
- `github-incremental-reconciliation` v5 corrigiu catálogo `offline-transport` 0.1.2, sincronizou catálogo residente/dotfiles e encerrou com `REFERENCE_AUDIT=PASS`, verificador residente `INTEGRO` e auditorias GitHub sem erro de capacidade.
- As 27 entradas finais auditadas foram promovidas a `aceito`; todas as 942 entradas do manifesto estão aceitas e não há `preexistente` a montante.

## Pendências técnicas não humanas
- Reconstruir o APK a partir deste HEAD de fechamento em staging externo.
- Se o SHA-256 reconstruído diferir do APK U26 homologado, repetir o gate Android no novo artefato exato antes de publicar.
- Publicar branch/tag `airgap-vault-kaizou-1.1.2`, criar GitHub Release, baixar o asset publicado e conferir SHA-256 byte a byte.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; zona U26/U27 liberada após fechamento dos portões de árvore.

## Competências ativas nesta unidade
- `desenvolvedor-de-software` v11 — fechamento, portões e entrega.
- `github-incremental-reconciliation` v5 — sincronização incremental e auditoria de referências/GitHub.
- `airgap-wallet-engineering-skill` 0.2.6 — QR/signing/runtime homologados.

## Competências instaladas para unidades futuras
- Subskills do repositório `airgap-wallet-engineering-skill` permanecem disponíveis conforme `ativa_em`.

## Falhas de portão por tipo de entrada
- `backend-integracao`: critério antigo `yarn test` direto não encontrava Chromium Puppeteer; contrato v27 usa o `karma-gate` versionado, que passou 10/10.
- `teste-integracao`: contagem antiga de 5 specs Solflare ficou obsoleta após U25/U26; v27 exige 10/10.
- `android-auth`: prompts nativos sobrepostos causavam falso `UserNotAuthenticatedException`; método homologado espera prompt estável.
- `sincronizacao`: auditor detectou catálogo `offline-transport` 0.1.1 vs canônico 0.1.2; catálogo foi corrigido e a auditoria final passou.

## Divergências da última reconciliação
- corrigidas: versão da skill/catálogo, critérios 802/933, release contract U26, propósito do build 0.1.6 e índice `offline-transport` 0.1.2.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 1–942.

## Próxima unidade
- R01 — reconstrução/publicação da release `airgap-vault-kaizou-1.1.2` a partir do HEAD de fechamento, sem alterar a árvore salvo falha objetiva de portão.
