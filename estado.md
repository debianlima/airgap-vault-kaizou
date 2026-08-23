# Estado — 2026-08-23 — contrato v9

## Decisões vigentes
- `airgap-vault-kaizou` permanece fork do AirGap Vault v3.34.4 com integração Solana isolada das demais redes.
- A release atual publicada é Kaizou `1.1.1` com `airgap-solana-module 0.1.5`; a release anterior 1.1.0/0.1.4 permanece imutável.
- Stake permanece semanticamente preservado; a correção v9 é a classificação offline de liquidity pool e do restante da matriz Keystone Solana implementada no módulo 0.1.5.
- A mesma `airgap-wallet-engineering-skill` permanece vinculada ao módulo e ao Kaizou porque esta integração originou a Skill; após a homologação desta unidade ela foi atualizada e recarregada como v0.1.1.
- Próximo módulo de outra moeda deverá derivar uma nova skill da atual no ponto de divergência.
- Nenhuma alteração v9 pode introduzir mudança semântica intencional em protocolos não-Solana.

## Decisões superadas
- `airgap-solana-module 0.1.4` como módulo da linha corrente — preservado apenas na release publicada Kaizou 1.1.0; substituído por 0.1.5 em 1.1.1.
- `airgap-wallet-engineering-skill` v0.1.0 como versão ativa do projeto — superada por v0.1.1 após evidência de homologação Android desta unidade.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- H01: compartilhar a Skill atual entre módulo Solana e Kaizou; derivar nova skill quando outra moeda virar novo módulo.
- Escopo funcional v9: toda a classificação Solana implementada pelo parser Keystone fixado no módulo 0.1.5, com stake preservado e zero mudança semântica nas demais redes.
- A publicação de Kaizou 1.1.1 foi iniciada somente após decisão explícita do usuário e concluída sob a tag `airgap-vault-kaizou-1.1.1`.

## Pendências técnicas não humanas
- Nenhuma pendência técnica bloqueia a integração v9 aceita.
- Release/tag `airgap-vault-kaizou-1.1.1` publicada em GitHub com APK SHA-256 `bc02869877b8473a933694980e5b6c53a61ead87389dbcff7fb1c389acc8803b`.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; nenhuma zona de exclusão ativa.

## Competências ativas nesta unidade
- `keystone-solflare-ur` — interoperabilidade Solana/Keystone e preservação de requestId.
- `angular-ionic-integration` — roteamento real `IACService` → `deserialized-detail` → `transaction-signed`.
- `android-vault-runtime` — instalação limpa, user/non-root, credencial nativa, assinatura e cold restart.
- `skill-projeto` — `airgap-wallet-engineering-skill` v0.1.1, atualizada por evidência homologada desta unidade.

## Competências instaladas para unidades futuras
- `keystone-solflare-ur`, `angular-ionic-integration`, `android-vault-runtime` e `skill-projeto`.

## Falhas de portão por tipo de entrada
- `estrutura-contrato`: 1 falha intermediária do script de emenda ao apontar `gates` em vez de `homologation`; corrigida antes de escrever o schema final.
- `toolchain-web`: `yarn` não estava exposto no `PATH`; Corepack 1.22.19 já residente foi habilitado em `~/.local/bin` e o build passou sem mudança de produto.
- `android-runtime`: a criação/leitura do segredo exigiu credencial de bloqueio real no Android 11 Google Play `user`; configurada a credencial, `SecurityUtils` autenticou e a assinatura real passou.
- `android-runtime`: 1 tentativa de cold restart perdeu a sessão CDP quando o WebView reiniciou; após rebinding ao novo socket o gate passou sem mudança de produto.
- `stake-ui`: 1 tentativa de navegar novamente para a mesma rota exibiu estado visual antigo; repetida a partir de rota distinta, o handler retornou sucesso, não houve aviso `unrecognized` e o decoder runtime permaneceu `verified-stake`.

## Divergências da última reconciliação
- corrigidas: `estado.md`, vínculo da skill e status das entradas v9 alinhados ao contrato v9; release externa `airgap-vault-kaizou-1.1.1` reconciliada após publicação; declarado→existe e existe→declarado passam.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- 938/938 entradas em `aceito`.
- Release Kaizou `1.1.1`: APK debug de homologação publicado sob `airgap-vault-kaizou-1.1.1`, SHA-256 `bc02869877b8473a933694980e5b6c53a61ead87389dbcff7fb1c389acc8803b`, 85.946.906 bytes.
- Módulo estático no APK: `airgap-solana-module 0.1.5`, chave pública `26df40a034fa5b4b52c54b69286f6828e23d91e6fd72c6d7fa764466c1401f5a`, bundle byte-idêntico ao pacote assinado.
- Android 11 Google Play `user/release-keys`, `ro.debuggable=0`, `ro.secure=1`, `adb root` recusado; instalação limpa sem ZIP import passou.
- Liquidity pool: `SPL Token Swap v3 / DepositAllTokenTypes` classificou `keystone-classified` no WebView, sem `Solana transaction not recognized offline`; o `IACService` real retornou sucesso e abriu a tela de assinatura.
- Solflare: o Vault real assinou a requisição, navegou a `transaction-signed` e produziu `ur:sol-signature` de 64 bytes; requestId `550e8400e29b41d4a716446655440015` foi preservado e Ed25519 verificou `true` contra a mensagem e a chave derivada.
- Stake: fixture `Stake Deactivate` permaneceu `verified-stake`, sem acknowledgment extra nem aviso `unrecognized`; o handler real retornou sucesso e manteve a ação de assinatura disponível.
- Cold restart: módulo 0.1.5 permaneceu disponível e o segredo `Kaizou Test` com carteira Solana persistiu.
- Regressão: `yarn build` PASS; Karma gate completo PASS; `deserialized-detail` 2/2 PASS; gate de não-regressão PASS; nenhuma alteração v9 em `src/app`.

## Próxima unidade
- Nenhuma unidade funcional aberta; Kaizou 1.1.1 está publicado. Futura moeda inicia em módulo próprio com skill derivada da atual.
