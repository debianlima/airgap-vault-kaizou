# Estado — 2026-08-25 — contrato v33

## Decisões vigentes
- `airgap-vault-kaizou-1.1.3` permanece a release pública corrente e o único alvo do APK desta unidade; não criar 1.1.4 apenas para o APK.
- O binário 1.1.3 incorpora exatamente `airgap-solana-module 0.1.7` do handoff de produção, ZIP SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`.
- A U27 continua no perfil `terminal`, resolvido pelo inventário residente, sem reutilizar o transporte Work.
- A publicação exige APK fixado por SHA-256 antes da instalação, módulo estático byte-equivalente e homologação Android 11/API 30 Google Play `user/release-keys`, non-root.
- Skill de projeto ativa: `airgap-wallet-engineering-skill@0.2.9`; delta remoto lido até `763c05baba4d694aacd07c974af28552e0a45742`.

## Decisões superadas
- Executar a continuação U27 exclusivamente no perfil `work` — superada pela decisão humana explícita de continuar no perfil `terminal` e registrada na emenda v33.
- Tratar 1.1.3 como permanentemente source-only — superada pela decisão humana de continuar a publicação binária na própria 1.1.3.
- Criar 1.1.4 apenas porque a página 1.1.3 já existe — descartado.
- Usar Node 14.x do workflow histórico para a árvore atual — incompatível com `bip32@5.0.0-rc.0`, que exige Node >=18.

## Decisões humanas pendentes
- Nenhuma no gate de licença Android desta unidade: o SDK persistente do perfil terminal já contém as licenças/componentes requeridos e um probe com stdin fechado instalou `build-tools;34.0.0` e `platforms;android-35` sem solicitar novo aceite.

## Decisões fechadas nesta emenda
- Emenda v33: roteamento da U27 para o perfil `terminal`, preservando release 1.1.3, módulo 0.1.7 e todos os gates binários da v32.

## Pendências técnicas não humanas
- Concluir os gates funcionais U27 no APK já instalado, sem rebuild.
- Fechar `RECONCILIATION_CLOSURE=PASS` e `DEPENDENCY_REFERENCES=PASS`, incluindo referências atrasadas no catálogo.
- Anexar o APK à release 1.1.3 somente após `U27_BINARY_HOMOLOGATION_PASS` e conferir o asset publicado.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — unidade `U27-binary-homologation-continuation`, ativo; conteúdo não duplicado aqui.

## Competências ativas nesta unidade
- `telemetry-data-visualization@2` — macro global obrigatória.
- `desenvolvedor-de-software@14` — método da unidade.
- `github-incremental-reconciliation@7` — reconciliação incremental e release.
- `governanca-ontologica-de-skills@1.0.4` — fecho de dependências.
- `airgap-wallet-engineering-skill@0.2.9` — raiz do projeto.
- `android-container-avd-lab@0.1.4` — laboratório Android.
- `android-airgap-runtime@0.1.4` — runtime non-root.
- `release-packaging@0.2.0` — integridade/publicação.

## Competências instaladas para unidades futuras
- Nenhuma nova nesta unidade até agora.

## Falhas de portão por tipo de entrada
- estrutura: 1 reprovação causada pelo verificador ainda codificar perfil `work` após a emenda v33; correção estrutural em curso.
- ambiente-build: duas interrupções artificiais do canal remoto antes do Gradle, contornadas por unidade transitória `systemd --user`; o build contratado posterior concluiu com rc=0.

## Divergências da última reconciliação
- corrigidas: contrato v33; referência da skill lida até o remoto atual; gate de licença terminal provado não bloqueante; verificador estrutural alinhado ao perfil terminal.
- pendentes de autorização: nenhuma.
- pendentes técnicas: referências de versão atrasadas no `indice.yaml` do catálogo precisam ser reconciliadas antes da release.

## Entradas aceitas
- Histórico aceito preservado. Entradas 936/938/946 permanecem `em_curso`; 947 permanece `preexistente` até fechamento dos gates e atualização final.

## Evidência binária U27 atual
- APK produzido sem rebuild posterior: `app-debug.apk`.
- SHA-256 congelado: `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`.
- tamanho: `85705684` bytes.
- package id: `it.airgap.vault`; versionName `1.1.3`; versionCode `10013`.
- módulo 0.1.7 dentro do APK: byte-equivalente ao handoff verificado.
- runtime instalado: Android 11/API30/x86_64, Google Play presente, `ro.build.type=user`, `ro.build.tags=release-keys`, `adb root` recusado, instalação inicialmente limpa.

## Próxima unidade
- Continuar os gates funcionais U27 no APK já instalado; não rebuildar. Se todos passarem, fechar o fecho de reconciliação e publicar o mesmo APK na release 1.1.3.
