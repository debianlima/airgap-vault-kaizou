# Estado — 2026-08-25 — contrato v33

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` continua sendo a única release alvo do APK desta homologação.
- O candidato continua sendo o mesmo `app-debug.apk`, SHA-256 `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`, sem rebuild após fixação do hash.
- O APK incorpora exatamente `airgap-solana-module 0.1.7`, handoff ZIP SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- `RECONCILIATION_CLOSURE=PASS` e `DEPENDENCY_REFERENCES=PASS`; publicação continua condicionada a `U27_BINARY_HOMOLOGATION_PASS`.
- Skill de projeto: `airgap-wallet-engineering-skill@0.2.9`, reconciliada até `4741f19df57950a9f487748e1b7d41c97dfef4b9`.

## Decisões superadas
- H01 — recuperar o PIN sintético perdido do AVD anterior — superada pela autorização humana explícita de clean-room.
- Continuar U27 exclusivamente no perfil `work` — superada pela emenda v33 (`terminal`).
- Criar 1.1.4 apenas porque 1.1.3 já existia — descartado.

## Decisões humanas pendentes
### H02 — disclaimer inicial do AirGap Vault
**Contexto:** o clean-room chegou ao onboarding do APK real e o app exige que o disclaimer inicial seja lido/aceito antes de concluir o save do secret. Essa aceitação não pode ser realizada pelo agente em nome do operador.
**Bloqueia:** conclusão do onboarding e todos os gates runtime restantes da U27.

| | Aceitar humanamente o disclaimer | Não aceitar e encerrar U27 binária |
|---|---|---|
| **O que faz** | O operador lê/aceita o disclaimer; depois o agente pode continuar mecanicamente o onboarding | Mantém a release 1.1.3 sem APK |
| **Vantagem** | Permite executar os gates runtime restantes no clean-room autorizado | Nenhuma aceitação contratual adicional |
| **Desvantagem** | Exige ação/decisão humana explícita | A homologação binária não fecha |
| **Custo de reverter** | Baixo para o laboratório; a aceitação registrada no app é estado do guest | Baixo |
| **Impacto no contrato** | Nenhum; apenas libera o gate humano | 946 permanece `em_curso` e 947 `preexistente` |

**Recomendação:** somente continuar se o operador realmente leu e aceita o disclaimer do aplicativo.

## Decisões fechadas nesta emenda
- H01 resolvida por clean-room autorizado.
- Guest novo criado em Docker named volume exclusivo, sem reutilizar userdata anterior.
- PIN sintético de 6 dígitos criado e guardado somente no cofre local `C:\ProgramData\agentes\segredos\airgap-vault-kaizou\u27-cleanroom-pin.txt`; valor não foi impresso/versionado.
- Mnemonic BIP39 sintética de 12 palavras criada e guardada somente no mesmo cofre; valor não foi impresso/versionado.

## Pendências técnicas não humanas
- Após H02, repetir apenas o onboarding necessário usando os fixtures sintéticos preservados e executar a matriz de captura, foreign-account Solflare, quatro casos de assinatura e persistência por restart de processo do app.
- Revalidar fecho de dependências se skill/catálogo mudarem antes do upload.

## Trabalho compartilhado
- `manifesto.yaml.trabalho_compartilhado` está `null`; unidade clean-room encerrada no gate H02.

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
- `evidencia-teste`: H02 — disclaimer inicial requer aceitação humana; runtime funcional não foi executado depois desse ponto.
- `ambiente-container`: primeira criação do clean-room falhou por GID KVM ausente; corrigida adicionando o GID real de `/dev/kvm`, após o que o guest passou todos os gates base.

## Divergências da última reconciliação
- `RECONCILIATION_CLOSURE=PASS` e `DEPENDENCY_REFERENCES=PASS` permanecem do fechamento anterior.
- catálogo avançou em commits antes desta unidade, mas as versões de todas as skills ativas permaneceram idênticas; nenhuma referência congelada mudou nesta unidade.
- pendente humana: H02.

## Entradas aceitas
- Histórico aceito preservado. Entradas 936/938/946 permanecem `em_curso`; 947 permanece `preexistente`.

## Evidência binária U27 atual
- APK SHA-256: `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`.
- clean-room: Android 11/API30/x86_64, Google Play, fingerprint `google/sdk_gphone_x86_64/generic_x86_64_arm64:11/RSR1.201211.001/7027799:user/release-keys`, `user`, `release-keys`, `ro.debuggable=0`, `ro.secure=1`, `adb root` recusado.
- PIN sintético: criado/verificado no guest; valor somente no cofre local.
- instalação limpa: app inicialmente ausente; `base.apk` instalado tem o mesmo SHA-256 do candidato.
- importação sintética: 12/12 palavras BIP39 selecionadas; confirmação de importação passou; onboarding bloqueou no disclaimer humano antes do save final.
- `U27_BINARY_HOMOLOGATION_PASS`: NÃO DECLARADO.
- publicação: NÃO EXECUTADA.

## Próxima unidade
- Se o operador declarar que leu e aceita o disclaimer, retomar o clean-room usando os fixtures sintéticos do cofre e seguir diretamente para os gates runtime restantes; não rebuildar o APK.
