# Estado — 2026-08-25 — contrato v33

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` continua sendo a release pública corrente e o único alvo do APK desta homologação; não criar 1.1.4 apenas para o APK.
- O APK candidato incorpora exatamente `airgap-solana-module 0.1.7` do handoff de produção, ZIP SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- A U27 executa no perfil `terminal` conforme emenda v33, preservando todos os gates binários da v32.
- Publicação somente após `U27_BINARY_HOMOLOGATION_PASS`, `RECONCILIATION_CLOSURE=PASS` e `DEPENDENCY_REFERENCES=PASS`; os dois últimos passam no fecho atual, mas o primeiro continua bloqueado por H01.
- Skill de projeto: `airgap-wallet-engineering-skill@0.2.9`, reconciliada até `4741f19df57950a9f487748e1b7d41c97dfef4b9`.

## Decisões superadas
- Continuar U27 exclusivamente no perfil `work` — superada pela decisão humana registrada na emenda v33.
- Tratar 1.1.3 como permanentemente source-only — superada pela decisão de permitir APK posterior à homologação binária na própria 1.1.3.
- Criar 1.1.4 apenas porque a release 1.1.3 já existia — descartado.
- Usar Node 14.x do workflow histórico — incompatível com a árvore atual; Node 22.22.1 + Yarn 1.22.19 passou `--frozen-lockfile` sem alterar o lockfile.

## Decisões humanas pendentes
### H01 — credencial sintética do lockscreen do AVD U27
**Contexto:** o Android 11 `user/release-keys` está com `CredentialType: Pin`. O `BiometricPrompt`/`lockPassword` permaneceu estável, mas o valor do PIN de teste não está declarado em projeto, inventário, container nem histórico local. O Android exige o PIN antigo para verificar, alterar ou limpar a credencial existente.
**Bloqueia:** gates runtime U26 incorporados à U27 — matriz de captura 4/4, foreign-account Solflare, quatro casos de assinatura e persistência após force-stop/start.

| | Fornecer o PIN sintético existente | Recriar o laboratório em clean-room com novo PIN humano | Não executar runtime |
|---|---|---|---|
| **O que faz** | Permite continuar no mesmo guest/instalação já hash-fixada | Recomeça apenas o laboratório runtime e repete instalação/hash com um PIN definido pelo operador | Mantém a release sem APK |
| **Vantagem** | Menor retrabalho e preserva o estado exato já validado | Remove dependência de credencial perdida e cria estado reproduzível | Nenhum risco operacional adicional |
| **Desvantagem** | Exige recuperar o PIN de teste | Repete gates de runtime/base.apk e instalação limpa | U27 permanece bloqueada |
| **Custo de reverter** | Baixo | Médio | Baixo |
| **Impacto no contrato** | Nenhum | Nenhum, desde que Android 11/API30 Google Play user/release-keys/non-root e clean install sejam provados novamente | Mantém 946 em curso e 947 preexistente |

**Recomendação:** fornecer o PIN sintético existente se ele for conhecido. Não enviar credencial real de uso pessoal; prefira um caminho/variável de cofre local.

## Decisões fechadas nesta emenda
- O gate de licença que bloqueou Work não bloqueia terminal: SDK persistente já licenciado e probe com stdin fechado instalou `build-tools;34.0.0` e `platforms;android-35` sem novo aceite.
- Verificador estrutural foi alinhado ao perfil `terminal` do contrato v33 e voltou a PASS.
- A skill compartilhada foi reconciliada sem alterar `SKILL.md`: entrada 74 declarou o gate de licença já existente, índice derivado foi regenerado e o catálogo foi alinhado a root 0.2.9, AVD 0.1.4 e release-packaging 0.2.0.
- O Kaizou leu o delta `763c05b…→4741f19…`, atualizou `delta_lido_ate` e obteve `RECONCILIATION_CLOSURE=PASS` e `DEPENDENCY_REFERENCES=PASS` contra catálogo `b0748d1…`.

## Pendências técnicas não humanas
- Após resolver H01, executar os quatro casos da matriz de captura, o caso Solflare foreign-account, os quatro casos de assinatura e persistência de app-process no APK já fixado, sem rebuild.
- Se skill/catálogo mudarem antes do upload, recalcular o fecho de reconciliação antes da publicação.
- Com `U27_BINARY_HOMOLOGATION_PASS`, anexar o mesmo APK hash-fixado à release 1.1.3 e verificar o asset publicado.

## Trabalho compartilhado
- `manifesto.yaml.trabalho_compartilhado` está `null`; a reserva desta unidade foi liberada após o fechamento dos portões de dependência.

## Competências ativas nesta unidade
- `telemetry-data-visualization@2`
- `desenvolvedor-de-software@14`
- `github-incremental-reconciliation@7`
- `governanca-ontologica-de-skills@1.0.4`
- `airgap-wallet-engineering-skill@0.2.9`

## Competências instaladas para unidades futuras
- Nenhuma nova nesta unidade.

## Falhas de portão por tipo de entrada
- `evidencia-teste`: runtime U27 continua bloqueado por credencial sintética de lockscreen não declarada; nenhum caso foi marcado PASS sem execução.
- `estrutura`: a divergência anterior do verificador `work`→`terminal` foi corrigida e permanece PASS.
- `teste-typescript`: a execução válida observou `jasmine-core 3.9.0` + `@types/jasmine 3.10.18` e passou 99/99 upstream + 20/20 Kaizou, sem mudança no APK.
- `dependencia`: divergências anteriores de catálogo/índice/manifesto da skill foram reparadas em unidade separada e o fecho atual passa.

## Divergências da última reconciliação
- corrigidas: root skill 0.2.9, 12/12 subskills e 4/4 métodos/macros globais convergem entre fonte, índice, catálogo e consumidor; catálogo valida; `delta_lido_ate` avança para `4741f19df57950a9f487748e1b7d41c97dfef4b9`.
- portões: `DELTA_INVENTORY=PASS`, `LEARNING_PRESERVED=PASS`, `RECONCILIATION_CLOSURE=PASS`, `DEPENDENCY_REFERENCES=PASS`.
- pendentes de autorização: somente H01 do runtime Android.

## Entradas aceitas
- Histórico aceito preservado. Entradas 936/938/946 permanecem `em_curso`; 947 permanece `preexistente` até a homologação binária e publicação efetivas.

## Evidência binária U27 atual
- build source HEAD: `d1ed951a5583538eff300f9555399012ae6a5c56`.
- APK: `app-debug.apk`, SHA-256 `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`, tamanho `85705684` bytes.
- package `it.airgap.vault`, versionName `1.1.3`, versionCode `10013`.
- módulo 0.1.7 no APK: byte-equivalente ao handoff verificado.
- `base.apk` instalado: mesmo SHA-256 `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`.
- guest: Android 11/API30/x86_64, fingerprint `google/sdk_gphone_x86_64/generic_x86_64_arm64:11/RSR1.201211.001/7027799:user/release-keys`, Google Play presente, `user`, `release-keys`, `ro.debuggable=0`, `ro.secure=1`, `adb root` recusado.
- instalação inicial: app ausente antes da instalação limpa.
- regressão: non-regression/estrutura PASS; Karma upstream 99/99 PASS; seis gates Kaizou 20/20 PASS.
- dependências: `RECONCILIATION_CLOSURE=PASS`; `DEPENDENCY_REFERENCES=PASS`.
- runtime de assinatura/captura: NÃO EXECUTADO por H01; portanto `U27_BINARY_HOMOLOGATION_PASS` não foi declarado.
- publicação: NÃO EXECUTADA.

## Próxima unidade
- Resolver H01. Com PIN sintético disponibilizado por canal seguro, retomar do mesmo laboratório/mesmo APK sem rebuild; se o operador escolher clean-room, repetir somente os gates dependentes do guest e da instalação.
