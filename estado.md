# Estado — 2026-08-21 — contrato v6

## Decisões vigentes
- Nome de distribuição da primeira release: `AirGap Vault Kaizou 1.0.0`; tag canônica `airgap-vault-kaizou-1.0.0`.
- Hospedagem canônica: servidor 110 (`DESKTOP-KQAHRF0`), WSL, em `/home/anderson/airgap-solana-work/airgap-vault-kaizou`; a VPS é somente ponte.
- `workflow-infra.md` é global ao ambiente e não pertence ao repositório `airgap-vault-kaizou`.
- Fork público canônico: `debianlima/airgap-vault-kaizou`, derivado de `airgap-it/airgap-vault` tag `v3.34.4`.
- Nome do projeto: `airgap-vault-kaizou`.
- A integração `AirGap Solflare` é exclusiva de Solana; protocolos não-Solana seguem os fluxos upstream v3.34.4.
- Sync externo: `crypto-multi-accounts`; assinatura: `sol-sign-request` → assinatura interna → `sol-signature` com requestId preservado.
- O módulo isolado `airgap-solana-module` continua responsável por derivação/assinatura Solana; o fork adiciona UX e transporte QR externo.
- Base de build: Node 20, Yarn 1.22.19, JDK 21 e Android SDK 35.

## Decisões superadas
- Patch externo sem fork — superado pela decisão de manter fork real.
- AccountShareResponse AirGap V2 para pareamento Solflare — incompatível com o parser Keystone da Solflare 2.34.0.
- `androidx.appcompat:appcompat` 1.3.1 gerado transitoriamente — não incorporado; baseline final preserva 1.6.1.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- Emenda v6: README principal pode receber introdução Kaizou verificável, preservando byte a byte o README upstream v3.34.4 abaixo dela.
- Emenda v5: gate Karma mecânico aprova somente `TOTAL: N SUCCESS` e limpa o processo/browser do job antes do próximo.
- Emenda v4: harness Karma do Kaizou usa Chrome atual via `CHROME_BIN` porque o Chromium 115 upstream perde heartbeat no WSL.
- Emenda v3: localização canônica no servidor 110/WSL; VPS somente ponte; `workflow-infra.md` externo ao projeto.
- Emenda v2: integração estritamente Solana; build/test completo e não-regressão obrigatórios para proteger outras redes.
- Bootstrap v1 do fork e fronteiras da integração Keystone/Solflare.

## Pendências técnicas não humanas
- Não bloqueante ao contrato v5: broadcast Solana devnet não verificado porque `requestAirdrop` retornou erro e a fixture permaneceu com saldo zero. O fluxo offline/QR, a assinatura Ed25519 e a aceitação pela Solflare foram verificados.

## Trabalho compartilhado
- U01 — integração AirGap Solflare/Keystone no fork público; agente Meu Terminal Oracle; previsão 2026-08-21T23:30:00-03:00.

## Competências ativas nesta unidade
- keystone-solflare-ur — verificada pelo parser/keyring real da Solflare 2.34.0.
- angular-ionic-integration — verificada pelos specs, build e runtime do Vault.
- android-vault-runtime — verificada no Android 11 Google Play user/non-root.

## Competências instaladas para unidades futuras
- keystone-solflare-ur — ativa em backend/teste da ponte Solana.
- angular-ionic-integration — ativa em UI/backend do fork.
- android-vault-runtime — ativa em build/deploy/homologação Android.

## Falhas de portão por tipo de entrada
- backend-integracao: 5 reprovações runtime na cadeia `sol-sign-request` até isolar ordenação de handlers e shape `TransactionSignRequest`; todas resolvidas e revalidadas.
- infraestrutura-homologacao: 2 reprovações no ciclo final por processos Chrome/Karma residuais/Chromium 115; runner v5 corrigido e rodada final canônica concluída.

## Divergências da última reconciliação
- corrigidas: estados das 31 entradas abertas promovidos somente após seus portões; `estado.md` reescrito; diagramas derivados serão regenerados nesta mesma passada.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- README principal: introdução Kaizou adicionada por emenda v6; corpo original de `airgap-it/airgap-vault` v3.34.4 preservado byte a byte.
- Origem documentada: `airgap-it/airgap-vault` tag `v3.34.4`, commit `aa50b7f0371ed2e681f358d22b546c7c000e05b7`.
- Processo documentado: modificações Kaizou desenvolvidas colaborativamente pelo administrador humano com apoio de agente de IA ChatGPT, pelo método orientado por manifesto, contrato, portões mecânicos e reconciliação.
- 935/935 entradas do manifesto em `aceito`.
- Commit funcional homologado e publicado: `6804defb356fcbd024a3f71e1f2e95aec23a8487` em `origin/feature/airgap-solflare`; SHA remoto confirmado igual ao local.
- Integração runtime: `crypto-multi-accounts` aceito pela Solflare 2.34.0; `sol-sign-request` processado pelo APK; `sol-signature` preservou requestId e foi aceito pelo `BaseKeyring.requestSignature()` real.
- Criptografia: assinatura de 64 bytes verificada por Ed25519 contra a mensagem Solana devnet original.
- Não-regressão: `TOTAL: 86 SUCCESS` na suíte completa upstream; cinco specs Solflare `3/3 + 2/2 + 2/2 + 2/2 + 1/1`; `airgap-vault-kaizou-nonregression.js` PASS; TypeScript PASS; `yarn build` PASS.
- Android: API 30 Android 11 Google Play user/non-root; módulo Solana v0.1.3 verificado/instalado; conta `CgWJeEWkiYqosy1ba7a3wn9HAQuHyK48xs3LM4SSDc1C` em `m/44'/501'/0'/0'`; helper temporário removido.

## Próxima unidade
- Nenhuma unidade bloqueante. U01 homologada e publicada no fork; broadcast devnet pode ser repetido futuramente quando houver saldo de teste.
