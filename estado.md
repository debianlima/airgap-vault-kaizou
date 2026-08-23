# Estado — 2026-08-23 — contrato v11

## Decisões vigentes
- AirGap Vault Kaizou 1.1.2 é a linha de correção do host para QR dinâmico Solflare; `airgap-solana-module 0.1.5` permanece o módulo integrado.
- `sol-sign-request` é transporte Keystone UR e pode carregar mensagem Solana ou transação Solana serializada completa; o host deve preservar a representação recebida corretamente.
- Stake e protocolos não-Solana não mudam semanticamente nesta unidade.
- `airgap-wallet-engineering-skill` v0.1.1 permanece vinculada.

## Decisões superadas
- Kaizou 1.1.1 como linha de desenvolvimento corrente — permanece release publicada, substituída por 1.1.2 para a correção do host.
- Hipótese de que todo pedido real Solflare chega como `SignType.Transaction` — superada pelo vídeo real do usuário: o payload reconstrói como `SignType.Message` (valor 2).
- Hipótese de que todo `SignType.Transaction` recebido do Solflare contém somente bytes de mensagem — superada pelo comportamento do firmware Keystone e do wallet-adapter Keystone.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- U10: captura do usuário é QR dinâmico/fountain; um frame isolado é parcial e não deve disparar `Incompatible code`.
- U10: transação completa recebida em `signData` não recebe segundo prefixo de assinatura.
- U11: o vídeo real foi decodificado sem OCR; 4 frames fountain reconstruíram `sol-sign-request` completo, `SignType.Message`, requestId válido, path Solana e mensagem v0. O handler 1.1.1 rejeita esse sign type antes de chegar à tela de transação.

## Pendências técnicas não humanas
- Implementar aceitação de `SignType.Message` após o novo teste reproduzir a rejeição observada no payload real; a normalização mensagem/transação completa já está implementada localmente e verde no teste específico.
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
- `teste-integracao`: o agregador `--all` esperava 3 specs Solflare após a U10 adicionar a quarta regressão; declaração já exigia 4 e o runner precisa acompanhar o conjunto declarado.

## Divergências da última reconciliação
- corrigidas: contrato v10 declara a correção antes da geração; nenhuma divergência de árvore foi criada.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 930/938 permanecem aceitas; entradas 21, 141, 228, 231, 801, 802, 934 e 936 estão `em_curso` nas U10/U11.

## Próxima unidade
- U11 — primeiro gate: `SignType.Message` multipart deve falhar no handler atual e passar somente após a correção; depois repetir o vídeo real no Android runtime.
