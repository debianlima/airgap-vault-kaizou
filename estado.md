# Estado — 2026-08-26 — contrato v33

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` continua sendo a única release alvo do APK desta homologação; não criar 1.1.4 apenas para o APK.
- O candidato continua sendo o mesmo `app-debug.apk`, SHA-256 `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`, sem rebuild após fixação do hash.
- O APK incorpora exatamente `airgap-solana-module 0.1.7`, handoff ZIP SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- `RECONCILIATION_CLOSURE=PASS` e `DEPENDENCY_REFERENCES=PASS`; publicação continua condicionada a `U27_BINARY_HOMOLOGATION_PASS`.
- Skill de projeto: `airgap-wallet-engineering-skill@0.2.9`, reconciliada até `4741f19df57950a9f487748e1b7d41c97dfef4b9`.
- Evidência real Solflare é transitória e privada; o próprio contrato/log U23 exclui payload real de evidência versionada. Bancos sintéticos podem ser versionados; captura real não.

## Decisões superadas
- H01 — recuperar o PIN sintético perdido do AVD anterior — superada pela autorização humana de clean-room.
- H02 — disclaimer inicial do AirGap Vault — resolvida por aceite humano explícito do operador em 25/08/2026.
- Presumir que a captura real Solflare deveria estar versionada no projeto — superado pelo log U23 e contrato, que exigem `synthetic-only` no Git e permitem captura real apenas transitoriamente.
- Continuar U27 exclusivamente no perfil `work` — superada pela emenda v33 (`terminal`).
- Criar 1.1.4 apenas porque 1.1.3 já existia — descartado.

## Decisões humanas pendentes
### H03 — elegibilidade e aceite humano dos Termos de Serviço/Política de Privacidade da Solflare
**Contexto:** a Solflare Wallet 2.34.1 foi instalada em perfil isolado de homologação, a conta Keystone foreign sintética foi pareada e a senha sintética foi configurada. A tela final `onboard/success` informa que clicar `I agree, let's go` aceita Terms of Service e Privacy Policy. Os Termos oficiais observados (v5.0, jun/2026) também exigem idade de maioridade legal na jurisdição aplicável e plena capacidade contratual. O agente não aceita nem contorna esse requisito.
**Bloqueia:** entrada na carteira Solflare configurada, geração transitória do `sol-sign-request` real foreign-account e, por consequência, fechamento dos gates runtime restantes da U27.

| | Operador humano legalmente elegível conclui o aceite | Não concluir o uso da Solflare |
|---|---|---|
| **O que faz** | Um operador que satisfaça os requisitos de elegibilidade dos Termos lê os documentos e realiza pessoalmente o aceite na UI; depois o agente retoma os testes mecânicos | Mantém a release 1.1.3 sem APK binário publicado |
| **Vantagem** | Preserva o contrato atual e permite gerar o QR real/transitório da Solflare sem fundos reais | Nenhuma aceitação contratual adicional |
| **Desvantagem** | Requer um humano legalmente elegível e uma ação de aceite que o agente não pode executar | `realSolflareForeignAccount` e os gates posteriores não fecham |
| **Custo de reverter** | Baixo para o laboratório; o perfil U27 pode ser descartado depois | Baixo |
| **Impacto no contrato** | Nenhum | Nenhum; 946 permanece `em_curso` e 947 `preexistente` |

**Recomendação:** preservar o contrato atual e solicitar que um operador humano legalmente elegível leia e, se concordar, realize pessoalmente o aceite na UI da Solflare. Não registrar idade/identidade no projeto.

## Decisões fechadas nesta emenda
- H02 resolvida por aceite humano; o disclaimer do AirGap Vault foi aplicado no APK real.
- Instalação do Vault configurada como `offline`, conforme o contrato; companion wallet opcional foi `SKIP`.
- Secret BIP39 sintético e conta Solana clean-room foram criados no APK real com autenticação `lockPassword` estável e PIN sintético do cofre.
- Matriz runtime de captura fechou 4/4 PASS pelo callback Cordova real/one-shot de `QRScanner.scan`: `normalize-corrupt`, `stale-partial-target`, `five-stale-target`, `two-complete-ambiguous`; `Incompatible code` = 0.
- O diagnóstico do foreign-account foi corrigido: `logs/U23-2026-08-24-solflare-capture-resilience.log` declara `synthetic-only; real Solflare user capture excluded from versioned evidence`, e o contrato permite captura privada apenas transitoriamente.
- Solflare Wallet 2.34.1 foi instalada em laboratório isolado a partir do pacote oficial da Chrome Web Store, com identidade/versionamento conferidos pela organização oficial `solflare-wallet`; CRX SHA-256 `427924b56987583ab3a3b09cab8754970a83da69a2bc9d56f5114469e6f7db8e`.
- Conta Keystone foreign sintética, sem fundos, foi pareada pela câmera virtual real da Solflare: endereço público `EPYB3u35GhLmDKv7c8ReiBrYGm3cSSYNP8eWsAdCN7oU`, fingerprint `b35695ff`; mnemonic/senha permanecem somente no cofre local e nunca foram impressas/versionadas.

## Pendências técnicas não humanas
- Após H03, reabrir o perfil Solflare U27 preservado somente depois que um operador humano legalmente elegível tiver realizado pessoalmente o aceite na UI; então gerar um `sol-sign-request` real/transitório de mensagem inofensiva da conta Keystone foreign.
- Reproduzir esse request no scanner real do Vault e exigir exatamente `No account found`, sem `Incompatible code` e sem null dereference; persistir somente hashes/metadados, não o payload real.
- Executar as quatro assinaturas `controlled-solana`, `pancake-clmm`, `stake-deactivate`, `tokenswap-v3`, verificando requestId, 64 bytes e Ed25519 sobre a mensagem exata.
- Executar persistência por `am force-stop` → `am start` enquanto o emulator permanece vivo; restart do container é clean-room reset porque o comando contém `-wipe-data`.
- Recalcular fecho de dependências antes do upload se skill/catálogo mudarem.

## Trabalho compartilhado
- `manifesto.yaml.trabalho_compartilhado` está `null`; reserva da unidade foi liberada após parar browser/guest e registrar H03.

## Competências ativas nesta unidade
- `telemetry-data-visualization@2`
- `desenvolvedor-de-software@14`
- `github-incremental-reconciliation@7`
- `governanca-ontologica-de-skills@1.0.4`
- `airgap-wallet-engineering-skill@0.2.9`
- `android-container-avd-lab@0.1.4`
- `android-airgap-runtime@0.1.4`

## Falhas de portão por tipo de entrada
- `evidencia-teste`: `realSolflareForeignAccount` não executado porque a Solflare exige aceite humano de Terms of Service + Privacy Policy e os Termos observados exigem elegibilidade/capacidade contratual; esse passo não é executado pelo agente.
- `assinatura`: request `controlled-solana` chegou a `/deserialized-detail`, mas a assinatura final/Ed25519 ainda não foi executada; demais três casos não executados.
- `persistencia`: `force-stop/start` ainda não executado nesta clean-room.
- `harness`: algumas primeiras tentativas de CDP terminaram em target/reload sem marcador; foram descartadas e não contaram como PASS. A matriz aceita usa resultado observável por rota/arquivo de resultado independente.

## Divergências da última reconciliação
- corrigidas: a suposição de que deveria existir captura real Solflare versionada foi corrigida pela evidência U23/contrato; o projeto deliberadamente não guarda payload real de usuário.
- portões mantidos: `RECONCILIATION_CLOSURE=PASS`, `DEPENDENCY_REFERENCES=PASS` do fechamento anterior.
- recurso legado observado e não removido: `airgap-vault-kaizou-signing-simulation.lock`, U18, recurso `cpu-signing-simulation`; não pertence à unidade atual e não foi tratado como órfão por inferência.
- pendente humana: H03.

## Entradas aceitas
- Histórico aceito preservado. Entradas 936/938/946 permanecem `em_curso`; 947 permanece `preexistente`.

## Evidência binária U27 atual
- APK SHA-256: `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`.
- clean-room: Android 11/API30/x86_64, Google Play, `user`, `release-keys`, `ro.debuggable=0`, `ro.secure=1`, `adb root` recusado.
- instalação limpa: app inicialmente ausente; `base.apk` instalado teve o mesmo SHA-256 do candidato antes da execução runtime.
- conta Vault clean-room: Solana pública `5U13P2iuS1FWH66RvVTY2G4o59ew6xkGx7pFjerCmoSX`, fingerprint `477097b9`; PIN/mnemonic somente no cofre local.
- matriz de captura: 4/4 PASS, `Incompatible code` = 0.
- fixture de assinatura atual: SHA-256 `1c69a8ddb3463d8c113e7de234f151536b1e3316ab15ffb03f269b99711c1400`; ainda não constitui evidência das quatro assinaturas finais.
- Solflare 2.34.1: CRX oficial SHA-256 `427924b56987583ab3a3b09cab8754970a83da69a2bc9d56f5114469e6f7db8e`; perfil de homologação preservado em `/mnt/e/airgap-vault-kaizou-workspace/tools/solflare-extension-u27/profile-u27-v2`.
- foreign account Keystone: pareamento Solflare PASS; `realSolflareForeignAccount` NÃO EXECUTADO por H03.
- `U27_BINARY_HOMOLOGATION_PASS`: NÃO DECLARADO.
- publicação: NÃO EXECUTADA.

## Próxima unidade
- Um operador humano legalmente elegível deve realizar pessoalmente o aceite dos Terms of Service e Privacy Policy na UI da Solflare. Depois disso, retomar o perfil U27 preservado e gerar o request real/transitório foreign-account; então fechar assinaturas e persistência, sem rebuildar o APK.
