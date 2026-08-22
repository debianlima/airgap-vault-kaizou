# Emenda v6 — README principal do AirGap Vault Kaizou 1.0.0

Data: 2026-08-21
Origem: pedido explícito do usuário para preservar a documentação original e apresentar claramente o fork Kaizou.

## Base upstream

- Repositório original: `airgap-it/airgap-vault`
- Tag de origem: `v3.34.4`
- Commit de produto da tag: `aa50b7f0371ed2e681f358d22b546c7c000e05b7`

## Alteração autorizada

O `README.md` deixa de ser byte a byte idêntico ao upstream somente para receber uma introdução anterior ao conteúdo original. O corpo original de `v3.34.4` deve permanecer intacto após essa introdução.

A introdução deve documentar:

1. o nome de distribuição `AirGap Vault Kaizou 1.0.0`;
2. a origem exata no AirGap Vault upstream;
3. as diferenças homologadas do Kaizou, restritas à integração Solana/Solflare;
4. que as rotas não-Solana permanecem baseadas no comportamento upstream e são protegidas pelos portões de não-regressão;
5. que as modificações Kaizou foram desenvolvidas colaborativamente pelo administrador humano com apoio de um agente de IA ChatGPT;
6. que o processo usou método de manutenção orientado por manifesto, contrato, portões mecânicos e reconciliação, sem usar a avaliação do agente como portão de aceite.

## Critério mecânico

O README é aprovado somente se a introdução contiver os identificadores verificáveis acima e o arquivo completo terminar exatamente com os bytes de `git show v3.34.4:README.md`.
