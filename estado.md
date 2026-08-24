# Estado — 2026-08-24 — contrato v21

## Decisões vigentes
- AirGap Vault Kaizou 1.1.2 corrige o host Solflare/Keystone; `airgap-solana-module 0.1.6` passa a ser o módulo integrado após U18 encontrar e corrigir canonicalidade no signer.
- O QR real do usuário é `sol-sign-request` fountain/multipart com `SignType.Message`; o handler deve aceitar `SignType.Message` e `SignType.Transaction` e preservar corretamente mensagem ou transação serializada completa.
- Stake e protocolos não-Solana permanecem semanticamente inalterados.
- `airgap-wallet-engineering-skill` foi recarregada para a versão de trabalho 0.2.3 antes do fechamento da homologação; 0.2.2 inclui o método source-to-wire e os aprendizados de assinatura homologados em U15.
- `android-container-avd-lab` atua somente na montagem/reparo do laboratório; `android-airgap-runtime` continua responsável pela homologação do APK.

## Decisões superadas
- Kaizou 1.1.1 como linha de desenvolvimento corrente — permanece release publicada, substituída por 1.1.2 para a correção do host.
- Hipótese de que todo pedido real Solflare chega como `SignType.Transaction` — superada pelo vídeo real do usuário: o payload reconstrói como `SignType.Message` (valor 2).
- Hipótese de que todo `SignType.Transaction` recebido do Solflare contém somente bytes de mensagem — superada pelo comportamento do firmware Keystone e do wallet-adapter Keystone.
- `airgap-wallet-engineering-skill` v0.1.1 como versão ativa — superada por 0.2.0 após criação da subskill de laboratório Android; 0.2.0 foi superada por 0.2.2 após homologação U15 e formalização source-to-wire.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- U10/U11: regressões foram escritas antes das correções; `SignType.Message` real e `VersionedTransaction` serializada completa são cobertos.
- U11: o vídeo real foi decodificado sem OCR; 4 frames fountain reconstruíram `sol-sign-request` completo, requestId válido, path Solana e mensagem v0.
- U12: a skill 0.2.0 foi recarregada; o workflow-infra 110 permanece fonte do inventário e a nova subskill fornece apenas procedimento do laboratório.
- U13: homologação Android provou divergência real entre o `wallet.publicKey` anunciado pelo QR e a chave pública derivada da seed/endereço; signing chegou ao módulo mas falhou com `Cannot sign with non signer key`.
- U13 RED confirmado: `account-share.page.spec.ts` executou 3 specs e falhou 1/3 porque `encodeAccountSync` recebeu `wallet.publicKey=11…11` em vez da chave Ed25519 `f036…58f7` decodificada do endereço Solana de teste.
- U14: resposta `sol-signature` ganha portão RED próprio em `interaction.service.spec.ts` antes da alteração de `InteractionService`.
- U14 RED confirmado: transação v0 sintética com dois signers retornou a assinatura `0x21…` ligada a `wallet.publicKey`; o aceite exige `0x42…` ligada à chave Ed25519 decodificada de `receivingPublicAddress`.
- U15: evidência pública Solflare/Solana + caso PancakeSwap V3 fixa `SignType.Message` como mensagem transacional Solana, preservada byte-a-byte, com resposta Ed25519 destacada em `sol-signature`; o teste RED deve provar que o `signType` não é descartado.
- U15 RED confirmado: o gate dedicado falhou em compilação porque `SolflareDecodedSignRequest` não expunha `signType`; o contrato v15 exige preservar `Transaction=1` e `Message=2` até a conversão para transação local.
- U15 GREEN de software: `signType` passou a ser preservado no decode; `Message` usa wrapping explícito da mensagem e `Transaction` mantém a detecção de transação completa. Gate dedicado 5/5, agregador 6 grupos, suite 92/92, build, verify-only, nonregression, README, estrutura e diagramas passaram.
- U15 homologação Android controlada: APK `e66994a8…e61d` clean-installed byte-idêntico; pairing anunciou signer `f036…58f7`; `sol-signature` preservou requestId e passou Ed25519 independente; Stake Deactivate repetiu requestId+Ed25519; TokenSwapV3 retornou `keystone-classified` com `unknownProgramIds: []`; cold restart preservou `Kaizou Test`.
- U16: `airgap-wallet-engineering-skill` 0.2.2 foi recarregada; `protocol-research` agora exige source-to-wire do produtor até a wallet e concordância com captura real antes de alterar canonicalização/signing.
- U17 replay real: 6 fragmentos válidos do vídeo foram injetados pela callback Cordova QRScanner no APK U15; o handler chegou a 57%/completude e então `IACService` lançou `TypeError: Cannot read properties of undefined (reading 'publicKey')` porque a fingerprint real não pertence à conta de homologação. O defeito agora é account-mismatch após parsing válido, não SignType.Message.
- U17 RED confirmado: `iac.service.spec.ts` executou 3 specs e falhou 1/3 exatamente em `iac.service.ts:284`, ao acessar `correctWallet.publicKey` quando um `sol-sign-request` válido não encontrou conta local; o gate exige retorno sem exceção e `secret` indefinido.
- U17 GREEN de software: `IACService.findMatchingWallet` agora preserva `wallet`/`secret` indefinidos sem desreferenciar `correctWallet`; gates IAC 3/3, account-share 3/3, interaction 1/1, Solflare 5/5, nonregression e estrutura passaram.

- U18 — matriz adversarial source-to-wire: contrato fixou >=30 cenários, 6 execuções por cenário (1 aquecimento descartado + 5 medições), 100% de invariantes e mediana+MAD; fontes externas viram apenas formas de falha, nunca transações privadas copiadas.
- U18 preflight: primeira invocação abortou antes do caso 1 porque o harness tentou resolver `@solana/web3.js` no `node_modules` do host Kaizou; o projeto não declara essa dependência. Correção do harness: carregar a versão 1.98.4 pertencente ao source/bundle exato do `airgap-solana-module` 0.1.5. A tentativa não conta como medição.

- U18 medição RED: 47 cenários × 6 execuções (1 aquecimento + 5 medidas); 41 PASS, 6 FAIL, `semantic_pass_rate=0.8723404255`, mediana de latência por caso 18.1235 ms e MAD 4.3179 ms. Três ALT usavam programa custom desconhecido e esperavam classificação errada (`generic-solana` é o comportamento contratual), um caso de pressão de contas excedeu o limite de serialização antes do signer, e a corrupção do signature-count rejeitou com erro estável diferente do regex. O defeito de produto candidato é um payload truncado não canônico que `VersionedTransaction.deserialize` aceita e reserializa com bytes diferentes; o módulo 0.1.5 também o assina. Sweep confirmou cortes de 1 e 17 bytes aceitos/reconstruídos, enquanto outros cortes rejeitam.

- U20 — dependência promovida para `airgap-solana-module 0.1.6`; o patch rejeita serializações Solana não canônicas antes da assinatura. A matriz adversarial deve voltar a 47/47 PASS antes de reconstruir o APK.

- U20 primeira reexecução no módulo 0.1.6: 46/47 PASS; o único FAIL foi expectativa de texto do harness em `reject-corrupt-signature-count`. O módulo rejeitou corretamente mais cedo por `Non-canonical serialized Solana transaction bytes`; regex do caso foi ampliado para aceitar essa rejeição mais forte.

- U20 final: matriz adversarial no `airgap-solana-module 0.1.6` fechou 47/47 PASS, 6 execuções por cenário (1 aquecimento + 5 medidas), `semantic_pass_rate=1.0`, mediana 19.983 ms e MAD 3.7831 ms; 9 rejeições adversariais esperadas passaram e não houve mutação/aceite/rejeição inesperados.
- `airgap-solana-module v0.1.6` publicado; ZIP remoto verificado byte-idêntico ao local, SHA-256 `2515d1536938d7aca2709a63b9264e2439438cf441b4d45abe34acd6e1185150`.

## Pendências técnicas não humanas
- U21: executar portões globais no módulo 0.1.6, reconstruir APK final, homologar Android integralmente e publicar 1.1.2.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; nenhuma zona de exclusão ativa.

## Competências ativas nesta unidade
- `keystone-solflare-ur` — contrato real `sol-sign-request`/`sol-signature`, fountain e sign types.
- `angular-ionic-integration` — caminho IAC do scanner para `deserialized-detail`.
- `android-vault-runtime` — build/instalação/smoke no Android user/non-root.
- `skill-projeto` — `airgap-wallet-engineering-skill` v0.2.3; signing externo ativa `protocol-research` source-to-wire + `external-wallet-interoperability` + `cryptographic-boundaries`; `android-container-avd-lab` só monta/repara laboratório.

## Competências instaladas para unidades futuras
- As competências existentes permanecem; `android-container-avd-lab` está disponível via skill de projeto somente quando a tarefa tocar montagem/reparo de container/AVD.

## Falhas de portão por tipo de entrada
- `backend-integracao`: release 1.1.1 falhou no caso real do usuário com QR Solflare dinâmico, exibindo `Incompatible code`; a exceção foi reproduzida como `Unsupported Solflare Solana sign type: 2`.
- `teste-integracao`: o agregador Karma foi alinhado de 3 para 5 specs Solflare; ChromeLauncher deixou de depender da porta DevTools fixa 9222 e passou a usar Chromium Linux/porta efêmera.
- `deploy-android`: uma retomada encontrou AVD com locks residuais; a nova subskill exige provar ausência de owner antes de limpar lock e iniciar nova instância.

## Divergências da última reconciliação
- corrigidas: contrato v16 e `competencias.yaml` agora apontam para `airgap-wallet-engineering-skill` 0.2.2; source-to-wire recarregado; nenhuma zona de exclusão ativa.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 921/938 permanecem aceitas; entradas 21, 118, 127, 141, 228, 229, 231, 371, 372, 779, 780, 801, 802, 931, 933, 934 e 936 estão `em_curso` nas U10/U11/U12/U13/U14.

## Próxima unidade
- U17 — RED/GREEN de account-mismatch no IAC; depois APK final, homologação Android integral, portões finais e publicação da release 1.1.2.
