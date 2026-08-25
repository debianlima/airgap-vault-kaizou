# Estado — 2026-08-25 — contrato v32

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` é a release pública corrente e o alvo da publicação binária U27; não criar 1.1.4 apenas para o APK.
- O binário 1.1.3 usa exatamente `airgap-solana-module 0.1.7` do handoff de produção, ZIP SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- O APK só pode ser anexado após build limpo, inspeção do módulo estático e homologação Android 11/API 30 Google Play `user/release-keys`, non-root.
- Skill de projeto ativa: `airgap-wallet-engineering-skill` 0.2.9; delta 0.2.7→0.2.9 lido e reconciliado até `e0ff39455e2b79cf842b95d86683a044f6bbb63b`.

## Decisões superadas
- Tratar 1.1.3 como permanentemente source-only — superada pela decisão humana de continuar a homologação/publicação binária na própria 1.1.3.
- Criar 1.1.4 apenas porque 1.1.3 já existe — descartado.

## Decisões humanas pendentes
- Nenhuma decisão de versão/release pendente nesta unidade.

## Pendências técnicas não humanas
- Verificar o módulo 0.1.7 pelo gate Kaizou, construir o APK e repetir a homologação Android non-root.
- Atualizar a nota pública 1.1.3 e anexar o APK somente depois de `U27_BINARY_HOMOLOGATION_PASS`.
- Se o download do system image exigir Android SDK License Agreement, a aceitação continua sendo ato humano/organizacional e não é inferida pelo agente.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — unidade U27.

## Competências ativas nesta unidade
- `airgap-wallet-engineering-skill@0.2.9`
- `android-container-avd-lab@0.1.4`
- `android-airgap-runtime@0.1.4`
- `release-packaging@0.2.0`

## Divergências da última reconciliação
- corrigidas: skill 0.2.7→0.2.9; alvo binário fixado na release 1.1.3; nota pública 1.1.3 declarada como entrada 947 `preexistente`.
- pendentes de autorização: eventual aceitação da licença Android SDK, se necessária para adquirir o system image.

## Entradas aceitas
- Histórico aceito preservado; 936 e 938 reabertas para v32; 946 pendente; 947 preexistente até auditoria/atualização final.

## Próxima unidade
- U27 — verificar 0.1.7, construir APK 1.1.3, homologar no Android non-root e publicar somente com todos os portões verdes.
