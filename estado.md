# Estado — 2026-08-25 — contrato v32

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` é a release pública corrente e o alvo da publicação binária; não criar 1.1.4 apenas para o APK.
- O binário 1.1.3 deve incorporar exatamente `airgap-solana-module 0.1.7` do handoff de produção, ZIP SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- A publicação exige build limpo, módulo estático verificado e homologação Android 11/API 30 Google Play `user/release-keys`, non-root.
- Skill de projeto ativa: `airgap-wallet-engineering-skill@0.2.9`, delta 0.2.7→0.2.9 reconciliado.

## Decisões superadas
- Tratar 1.1.3 como permanentemente source-only — superada pela decisão humana de continuar a publicação binária na própria 1.1.3.
- Criar 1.1.4 apenas porque a página 1.1.3 já existe — descartado.
- Usar Node 14.x do workflow histórico para a árvore atual — incompatível com `bip32@5.0.0-rc.0`, que exige Node >=18.

## Decisões humanas pendentes
- H01 — aceitação do Android SDK License Agreement por representante adulto/autorizado da organização. Bloqueia aquisição de `build-tools;34.0.0`, `platforms;android-35`, geração do APK e o laboratório Android Google Play. O agente não pode aceitar esse acordo em nome da organização.

## Pendências técnicas não humanas
- Após H01: instalar os componentes Android requeridos e repetir o build Gradle.
- Gerar o APK 1.1.3 e registrar seu SHA-256.
- Criar/reusar Android 11/API 30 Google Play non-root, instalar o APK exato e executar os gates U27.
- Atualizar a nota pública 1.1.3 e anexar o APK somente após `U27_BINARY_HOMOLOGATION_PASS`.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — livre após encerramento bloqueado da U27.

## Competências ativas nesta unidade
- `airgap-wallet-engineering-skill@0.2.9` — raiz do projeto.
- `android-container-avd-lab@0.1.4` — laboratório Android.
- `android-airgap-runtime@0.1.4` — gate non-root.
- `release-packaging@0.2.0` — integridade/publicação.

## Falhas de portão por tipo de entrada
- deploy-android: 1 bloqueio por licença Android SDK não aceita.
- ambiente-build: Node 14.x histórico reprovou por dependência corrente que exige Node >=18; Node 22.22.1 + Yarn 1.22.19 instalou o lockfile sem alterar a árvore.

## Divergências da última reconciliação
- corrigidas: skill 0.2.7→0.2.9; contrato v32; alvo binário na release 1.1.3; módulo 0.1.7 verificado.
- pendentes de autorização: H01 Android SDK License Agreement.

## Entradas aceitas
- Histórico aceito preservado; 936, 938 e 946 permanecem `em_curso`; 947 permanece `preexistente` até auditoria/atualização final.

## Próxima unidade
- Após H01: reabrir a homologação binária, repetir Gradle com SDK completo, gerar APK, homologar Android non-root e publicar somente com todos os portões em PASS.
