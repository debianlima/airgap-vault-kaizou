# Estado — 2026-08-23 — contrato v12

## Decisões vigentes
- AirGap Vault Kaizou 1.1.2 corrige o host Solflare/Keystone; `airgap-solana-module 0.1.5` permanece o módulo integrado e não muda nesta unidade.
- O QR real do usuário é `sol-sign-request` fountain/multipart com `SignType.Message`; o handler deve aceitar `SignType.Message` e `SignType.Transaction` e preservar corretamente mensagem ou transação serializada completa.
- Stake e protocolos não-Solana permanecem semanticamente inalterados.
- `airgap-wallet-engineering-skill` foi recarregada para a versão de trabalho 0.2.0 antes da continuação do gate Android.
- `android-container-avd-lab` atua somente na montagem/reparo do laboratório; `android-airgap-runtime` continua responsável pela homologação do APK.

## Decisões superadas
- Kaizou 1.1.1 como linha de desenvolvimento corrente — permanece release publicada, substituída por 1.1.2 para a correção do host.
- Hipótese de que todo pedido real Solflare chega como `SignType.Transaction` — superada pelo vídeo real do usuário: o payload reconstrói como `SignType.Message` (valor 2).
- Hipótese de que todo `SignType.Transaction` recebido do Solflare contém somente bytes de mensagem — superada pelo comportamento do firmware Keystone e do wallet-adapter Keystone.
- `airgap-wallet-engineering-skill` v0.1.1 como versão ativa desta unidade — superada por 0.2.0 após criação da subskill de laboratório Android.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- U10/U11: regressões foram escritas antes das correções; `SignType.Message` real e `VersionedTransaction` serializada completa são cobertos.
- U11: o vídeo real foi decodificado sem OCR; 4 frames fountain reconstruíram `sol-sign-request` completo, requestId válido, path Solana e mensagem v0.
- U12: a skill 0.2.0 foi recarregada; o workflow-infra 110 permanece fonte do inventário e a nova subskill fornece apenas procedimento do laboratório.

## Pendências técnicas não humanas
- Concluir a homologação Android do APK 1.1.2 no runtime Google Play API 30 user/non-root, reproduzindo o QR dinâmico real sem `Incompatible code`, assinando e verificando a resposta.
- Repetir stake/cold restart exigidos pelo contrato, fechar as entradas v12 e publicar a release somente após todos os portões passarem.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; nenhuma zona de exclusão ativa.

## Competências ativas nesta unidade
- `keystone-solflare-ur` — contrato real `sol-sign-request`/`sol-signature`, fountain e sign types.
- `angular-ionic-integration` — caminho IAC do scanner para `deserialized-detail`.
- `android-vault-runtime` — build/instalação/smoke no Android user/non-root.
- `skill-projeto` — `airgap-wallet-engineering-skill` v0.2.0; subskill ativa no laboratório: `android-container-avd-lab`.

## Competências instaladas para unidades futuras
- As competências existentes permanecem; `android-container-avd-lab` está disponível via skill de projeto somente quando a tarefa tocar montagem/reparo de container/AVD.

## Falhas de portão por tipo de entrada
- `backend-integracao`: release 1.1.1 falhou no caso real do usuário com QR Solflare dinâmico, exibindo `Incompatible code`; a exceção foi reproduzida como `Unsupported Solflare Solana sign type: 2`.
- `teste-integracao`: o agregador Karma foi alinhado de 3 para 5 specs Solflare; ChromeLauncher deixou de depender da porta DevTools fixa 9222 e passou a usar Chromium Linux/porta efêmera.
- `deploy-android`: uma retomada encontrou AVD com locks residuais; a nova subskill exige provar ausência de owner antes de limpar lock e iniciar nova instância.

## Divergências da última reconciliação
- corrigidas: contrato v12 e `competencias.yaml` agora apontam para `airgap-wallet-engineering-skill` 0.2.0; diagrams regenerados; nenhuma zona de exclusão ativa.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 927/938 permanecem aceitas; entradas 21, 118, 141, 228, 229, 231, 801, 802, 933, 934 e 936 estão `em_curso` nas U10/U11/U12.

## Próxima unidade
- U12 — concluir o gate Android com a nova subskill de laboratório e só então aceitar/publicar 1.1.2.
