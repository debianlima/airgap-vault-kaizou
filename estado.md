# Estado — 2026-08-24 — contrato v30

## Decisões vigentes
- AirGap Vault Kaizou `1.1.2` está publicado com `airgap-solana-module 0.1.6` estático e verificado por assinatura/hash antes do build.
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
- U26/U27 homologaram o coletor resiliente e todos os 942 artefatos declarados foram promovidos a `aceito` após seus portões mecânicos.
- O APK final R01 foi reconstruído a partir do commit `9a546eed4882f29e29dc28624e907fbd1f3922d0` e tem SHA-256 `6885cc59cc9f0050bb0e2614ac4a0a4c165aa0011f086e3e8b68881dd3742a45`.
- O APK instalado no Android foi puxado do device e confirmou o mesmo SHA-256 do candidato.
- No APK R01 exato, a matriz de captura passou 4/4; o replay Solflare real de conta estrangeira terminou em `No account found` sem `Incompatible code`; controlled, Pancake CLMM, Stake e TokenSwap retornaram `sol-signature` com requestId correto, 64 bytes e Ed25519 válido.
- O restart do processo do app preservou `Kaizou Test` e a conta `HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk`.
- Tag anotada `airgap-vault-kaizou-1.1.2` foi publicada apontando para `9a546eed4882f29e29dc28624e907fbd1f3922d0`.
- GitHub Release `https://github.com/debianlima/airgap-vault-kaizou/releases/tag/airgap-vault-kaizou-1.1.2` foi criada com APK e arquivo `.sha256`.
- O APK publicado foi baixado novamente via GitHub API autenticada; tamanho `85663983` bytes e SHA-256 remoto/local/esperado são idênticos: `6885cc59cc9f0050bb0e2614ac4a0a4c165aa0011f086e3e8b68881dd3742a45`.

- R03 homologado no APK publicado 1.1.2: segunda conta Solana adicionada e persistente; PancakeSwap V3 CLMM open-position/add-liquidity e StakeProgram.Delegate foram assinados 2/2 com requestId correto, 64 bytes e Ed25519 válido; `broadcast=false`.

- R04 README revisado: documentação pública declara uso de agentes de IA, ausência de revisão humana/auditoria independente, funcionamento previsto, escopo de testes e uso por conta e risco; detalhes internos do processo ficam reservados para artigos futuros.

## Pendências técnicas não humanas
- Nenhuma para a release `1.1.2` e para a homologação pós-release R03.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; R04 liberada após verificação pública.

## Competências ativas nesta unidade
- `desenvolvedor-de-software` v14 — busca externa, documentação e entrega.
- `telemetry-data-visualization` v2 — telemetria mínima da unidade e procedência dos eventos.
- `airgap-wallet-engineering-skill` 0.2.6 — QR/signing/runtime homologados.

## Competências instaladas para unidades futuras
- Subskills do repositório `airgap-wallet-engineering-skill` permanecem disponíveis conforme `ativa_em`.

## Falhas de portão por tipo de entrada
- `backend-integracao`: critério antigo `yarn test` direto não encontrava Chromium Puppeteer; contrato v27 usa o `karma-gate` versionado, que passou 10/10.
- `teste-integracao`: contagem antiga de 5 specs Solflare ficou obsoleta após U25/U26; v27 exige 10/10.
- `android-auth`: prompts nativos sobrepostos causavam falso `UserNotAuthenticatedException`; método homologado espera prompt estável.
- `sincronizacao`: catálogo `offline-transport` 0.1.1 divergia do canônico 0.1.2; catálogo foi corrigido e `REFERENCE_AUDIT=PASS`.

## Divergências da última reconciliação
- reconciliada em R04: `origin/master` continha duas edições manuais de README (`697ae743`, `ea006078`); a documentação corrente preserva o título 1.1.2 e a redação pública aprovada na v30.
- corrigidas: versão da skill/catálogo, critérios 802/933, release contract U26, propósito do build 0.1.6, índice `offline-transport` 0.1.2 e estado pós-publicação.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 1–942.

## Próxima unidade
- Nenhuma obrigatória para R04; detalhes internos do processo ficam reservados até a publicação dos artigos.