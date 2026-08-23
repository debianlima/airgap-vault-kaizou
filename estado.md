# Estado — 2026-08-23 — contrato v10

## Decisões vigentes
- AirGap Vault Kaizou 1.1.2 é a linha de correção do host para QR dinâmico Solflare; `airgap-solana-module 0.1.5` permanece o módulo integrado.
- `sol-sign-request` é transporte Keystone UR e pode carregar mensagem Solana ou transação Solana serializada completa; o host deve preservar a representação recebida corretamente.
- Stake e protocolos não-Solana não mudam semanticamente nesta unidade.
- `airgap-wallet-engineering-skill` v0.1.1 permanece vinculada.

## Decisões superadas
- Kaizou 1.1.1 como linha de desenvolvimento corrente — permanece release publicada, substituída por 1.1.2 para a correção do host.
- Hipótese de que todo `SignType.Transaction` recebido do Solflare contém somente bytes de mensagem — superada pelo comportamento do firmware Keystone e do wallet-adapter Keystone.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- U10: captura do usuário é QR dinâmico/fountain; um frame isolado é parcial e não deve disparar `Incompatible code`.
- U10: transação completa recebida em `signData` não recebe segundo prefixo de assinatura.

## Pendências técnicas não humanas
- Implementar a normalização mensagem/transação completa após o teste de regressão multipart reproduzir a falha.
- Rodar build, Karma, nonregression e Android runtime antes de qualquer aceite/release 1.1.2.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; nenhuma zona de exclusão ativa.

## Competências ativas nesta unidade
- `keystone-solflare-ur` — contrato real `sol-sign-request`/`sol-signature` e QR fountain.
- `angular-ionic-integration` — caminho IAC do scanner para `deserialized-detail`.
- `skill-projeto` — `airgap-wallet-engineering-skill` v0.1.1.

## Competências instaladas para unidades futuras
- `android-vault-runtime` será ativada no gate Android desta unidade.

## Falhas de portão por tipo de entrada
- `backend-integracao`: release 1.1.1 falhou no caso real do usuário com QR Solflare dinâmico, exibindo `Incompatible code`.

## Divergências da última reconciliação
- corrigidas: contrato v10 declara a correção antes da geração; nenhuma divergência de árvore foi criada.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 931/938 permanecem aceitas; entradas 21, 141, 228, 231, 801, 802 e 936 estão `em_curso` na U10.

## Próxima unidade
- U10 — primeiro gate: regressão multipart com transação versionada serializada deve falhar no 1.1.1 e passar somente após a correção do host.
