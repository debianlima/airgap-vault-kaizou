# Estado — 2026-08-22 — contrato v8

## Decisões vigentes
- Projeto canônico: `airgap-vault-kaizou`, fork público `debianlima/airgap-vault-kaizou`, derivado de `airgap-it/airgap-vault` tag `v3.34.4`, commit `aa50b7f0371ed2e681f358d22b546c7c000e05b7`.
- Nova distribuição homologada: `AirGap Vault Kaizou 1.1.0`; tag canônica `airgap-vault-kaizou-1.1.0`.
- A principal evolução da linha 1.1.0 é Solana disponível diretamente no APK Kaizou por `airgap-solana-module 0.1.4` como módulo estático.
- `airgap-solana-module` permanece projeto/release independente; sua evolução não é fundida ao ciclo do Kaizou.
- Integração `AirGap Solflare` e alterações de stake são exclusivas de Solana; protocolos não-Solana seguem os fluxos upstream v3.34.4.
- Transporte externo Solana: `crypto-multi-accounts`; assinatura: `sol-sign-request` → assinatura offline → `sol-signature`, preservando requestId.
- Base de build: Node 20, Yarn 1.22.19, JDK 21 e Android SDK 35 no servidor 110/WSL.
- As modificações Kaizou são desenvolvidas colaborativamente pelo administrador humano com apoio de agente de IA ChatGPT, usando manifesto, contratos, portões mecânicos e reconciliação; avaliação do agente não é portão.

## Decisões superadas
- Patch externo sem fork — superado por fork público real.
- Importação manual obrigatória do módulo Solana em release — superada por módulo estático integrado ao APK Kaizou 1.1.0.
- AccountShareResponse AirGap V2 para Solflare — superado pelo protocolo Keystone compatível com Solflare 2.34.0.
- Chromium 115 upstream como browser de gate — superado por Chrome atual e porta Karma exclusiva por job.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- Emenda v8: versão Kaizou `1.1.0`; módulo integrado `airgap-solana-module 0.1.4`; módulo continua independente e já foi publicado separadamente como `v0.1.4`.
- Emenda v7: módulo Solana estático em release e fluxo de assinatura tolerante a stake/programas customizados.
- Emenda v6: README Kaizou preserva byte a byte o README upstream v3.34.4 abaixo da introdução do fork.

## Pendências técnicas não humanas
- Não bloqueante: broadcast Solana devnet não verificado; a fixture permaneceu sem saldo quando o faucet consultado falhou. O contrato 1.1.0 é offline/QR e não exige broadcast de rede.
- Não bloqueante: o upstream Angular Core procura `assets/symbols/solana.*`/storage de símbolo e registra warning `getSymbol` porque o módulo 0.1.4 não possui ícone Solana versionado. A UI textual, derivação e assinatura continuam funcionais; não foi criado asset visual novo sem contrato.
- O APK homologado é debug-signed (`CN=Android Debug`) e será identificado como artefato de teste/homologação, não como binário oficial de loja.

## Trabalho compartilhado
- U02 ativa apenas para publicação: release Kaizou 1.1.0 com módulo Solana 0.1.4 integrado; previsão 2026-08-22T11:30:00-03:00; sem colisão.

## Competências ativas nesta unidade
- `keystone-solflare-ur` — verificada pelo parser/keyring real da Solflare 2.34.0.
- `angular-ionic-integration` — verificada por specs, TypeScript, build, suíte completa e runtime.
- `android-vault-runtime` — verificada em Android 11/API30 Google Play `user` non-root.
- `solana-ed25519` / `airgap-isolated-runtime` — verificadas por assinatura Ed25519 e carregamento do módulo estático.

## Competências instaladas para unidades futuras
- `keystone-solflare-ur` — ponte QR Keystone/Solflare.
- `angular-ionic-integration` — UI/backend do fork.
- `android-vault-runtime` — build/deploy/homologação Android.

## Falhas de portão por tipo de entrada
- `backend-integracao`: falhas históricas de ordenação de handlers/shape do request e enriquecimento ERC-20 em transação Solana; resolvidas e cobertas por regressão.
- `infraestrutura-homologacao`: reconnect cruzado de Chrome/Karma resolvido com porta exclusiva por job.
- `deploy-android`: primeira verificação final dependia de `unzip` ausente; segunda usou Python com escape inválido. Verificador corrigido para `python3 zipfile`; APK final passou integridade e assets byte a byte.
- `runtime-android`: automação de onboarding gerou diálogos ANR enquanto `BiometricPrompt` roubava foco; após autenticação o armazenamento/derivação concluíram. Não houve crash funcional no fluxo de stake homologado.

## Divergências da última reconciliação
- corrigidas: critérios v8 aplicados; dez entradas U02 promovidas somente após seus portões; diagramas derivados regenerados.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 938/938 entradas do manifesto em `aceito`.
- README 1.1.0 preserva byte a byte o README de `airgap-it/airgap-vault` v3.34.4 abaixo da introdução Kaizou.
- `airgap-solana-module 0.1.4` publicado separadamente; bundle SHA-256 `ce577b0fc7671b594e35b847547a5d654fe374d480956498aa3eb118c7e7044b`; ZIP SHA-256 `23856107a0b5a856c0599c3c386c461b61d82adfa59752fe8b93f3d5a7f0922e`.
- APK Kaizou 1.1.0 homologado: 85.943.730 bytes, SHA-256 `6fdc4258b9e51d6736d0718530a774edf53557d3355fc61d5e3716213263fb32`.
- APK ZIP íntegro; `manifest.json`, `airgap-solana-module.bundle.js` e `module.sig` internos são byte a byte idênticos ao pacote 0.1.4 publicado; assinatura Ed25519 do módulo válida.
- Instalação limpa: APK instalado é byte a byte idêntico ao candidato; `IsolatedModules.loadAllModules()` retornou `airgap-solana-module` / `solana` com `type: static`; nenhum ZIP de módulo foi importado.
- Derivação runtime: conta de laboratório `CgWJeEWkiYqosy1ba7a3wn9HAQuHyK48xs3LM4SSDc1C`, path `m/44'/501'/0'/0'`; opção `AIRGAP SOLFLARE` disponível.
- Stake Deactivate final: tela assinada mostra `TYPE Stake Deactivate`, sem `[object Object]`; `sol-signature`, requestId preservado, 64 bytes e Ed25519 PASS.
- Stake Withdraw final: `0.987654321 SOL`, `TYPE Stake Withdraw`; `sol-signature`, requestId preservado, 64 bytes e Ed25519 PASS.
- Programa customizado/liquid-staking-like: alerta `Solana transaction not recognized offline`, bytes preservados, assinatura permitida sem crash; `sol-signature`, requestId preservado, 64 bytes e Ed25519 PASS.
- Solflare 2.34.0 real: Deactivate, Withdraw e Custom com `progress=100`, `handledType=sol-signature`, 64 bytes e `accepted=true` pelo `BaseKeyring.requestSignature()`.
- Cold restart: mesmo APK SHA-256 após restart; segredo de laboratório persistiu; módulo Solana reapareceu `type: static`.
- Gates locais finais: stake effects `2/2`; cinco specs Solflare `3/3 + 2/2 + 2/2 + 2/2 + 1/1`; suíte completa `TOTAL: 88 SUCCESS`; não-regressão PASS (16 arquivos de produto declarados); TypeScript PASS; `yarn build` PASS; estrutura/diagramas PASS.

## Próxima unidade
- Publicar `AirGap Vault Kaizou 1.1.0`, verificar tag/asset remoto e então encerrar U02.
