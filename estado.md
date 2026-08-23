# Estado — 2026-08-23 — contrato v9

## Decisões vigentes
- `airgap-vault-kaizou` permanece fork do AirGap Vault v3.34.4 com integração Solana isolada das demais redes.
- A unidade v9 integra exatamente `airgap-solana-module 0.1.5`; a versão de desenvolvimento Kaizou é `1.1.1`, sem publicação automática.
- Stake já homologado permanece semanticamente inalterado; a correção desta unidade é a classificação offline de liquidity pool e o restante da matriz Keystone Solana suportada pelo módulo.
- A mesma `airgap-wallet-engineering-skill` v0.1.0 fica vinculada ao módulo e ao Kaizou porque esta integração originou a Skill.
- Próximo módulo de outra moeda deverá derivar uma nova skill da atual.

## Decisões superadas
- `airgap-solana-module 0.1.4` como módulo da linha de desenvolvimento corrente — permanece na release publicada Kaizou 1.1.0, mas é substituído por 0.1.5 na unidade v9.

## Decisões humanas pendentes
- Nenhuma.

## Decisões fechadas nesta emenda
- H01: compartilhar a Skill atual entre módulo Solana e Kaizou; derivar nova skill quando outra moeda virar novo módulo.
- Escopo funcional v9: todo o escopo de classificação Solana do parser Keystone fixado no módulo 0.1.5, com stake preservado e zero mudança semântica nas demais redes.

## Pendências técnicas não humanas
- Alterar package/build/README para 1.1.1 + 0.1.5, rodar gates completos, construir APK e homologar o fluxo no Android.

## Trabalho compartilhado
- ponteiro: `manifesto.yaml.trabalho_compartilhado` — `null`; nenhuma zona de exclusão ativa.

## Competências ativas nesta unidade
- `keystone-solflare-ur` — interoperabilidade Solana/Keystone.
- `angular-ionic-integration` — integração no host Vault.
- `android-vault-runtime` — build/homologação Android.
- `skill-projeto` — `airgap-wallet-engineering-skill` v0.1.0.

## Competências instaladas para unidades futuras
- `keystone-solflare-ur`, `angular-ionic-integration`, `android-vault-runtime` e `skill-projeto`.

## Falhas de portão por tipo de entrada
- `estrutura-contrato`: 1 falha intermediária do script de emenda ao apontar `gates` em vez de `homologation`; corrigida antes de escrever o schema.

## Divergências da última reconciliação
- corrigidas: contrato atualizado para v9 e Skill de projeto vinculada conforme decisão humana.
- pendentes de autorização: nenhuma.

## Entradas aceitas
- As entradas históricas v8 permanecem aceitas; entradas 21, 118, 141, 228, 231, 936 e 938 estão em curso na emenda v9.

## Próxima unidade
- Produzir as alterações v9 governadas pelos contratos já emendados e executar os portões.
