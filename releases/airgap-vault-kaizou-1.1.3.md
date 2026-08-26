# AirGap Vault Kaizou 1.1.3 — consolidação de histórico, licenças e proveniência

Esta release consolida as descrições das versões públicas anteriores e corrige
o controle de licenças/proveniência do fork e do módulo Solana.

## Natureza desta release

A publicação inicial de 25/08/2026 foi **somente código-fonte e documentação legal**, sem APK 1.1.3. Esse estado histórico foi preservado até a homologação binária U27 concluir todos os portões do contrato v33.

Em 26/08/2026, após `U27_BINARY_HOMOLOGATION_PASS=PASS`, a mesma release recebeu o APK homologado — nenhum APK anterior foi renomeado ou reaproveitado e nenhum rebuild foi feito depois da fixação do hash:

- asset: `airgap-vault-kaizou-1.1.3.apk`;
- SHA-256: `5d32bdac6de6f7414034d253f131a137e7dfc75deb49909d6ce1b447c57be79b`;
- tamanho: 85.705.684 bytes;
- package Android: `it.airgap.vault`, `versionName=0.0.0`, `versionCode=1`;
- Android 11/API30/x86_64, Google Play, build `user/release-keys`, non-root;
- módulo estático: `airgap-solana-module 0.1.7`, ZIP de produção SHA-256 `5032d045cd0e93bcb2a6a666bf4213add2f787fd70da79a0f431927916fded0c`;
- checksum publicado separadamente em `airgap-vault-kaizou-1.1.3.apk.sha256`.

O redownload autenticado do asset publicado reproduziu exatamente o SHA-256 e o tamanho locais. Os assets legais preexistentes `airgap-vault-kaizou-1.1.3-license-provenance.zip` e `.sha256` foram preservados sem sobrescrita.

O arquivo adicional `airgap-vault-kaizou-1.1.3-license-provenance.zip` contém os documentos legais e de proveniência desta release, acompanhados de SHA-256. O source archive automático do GitHub contém o repositório completo.

### Homologação binária U27

- APK exato e módulo 0.1.7 byte-equivalente ao handoff de produção: PASS;
- clean install Android 11/API30 Google Play non-root: PASS;
- matriz QR resiliente: 4/4 PASS, zero `Incompatible code`;
- replay real público de transação Solflare da documentação oficial Keystone: retorno exato `No account found`, sem rota de assinatura nem mutação relevante;
- `controlled-solana`, Pancake CLMM, Stake Deactivate e TokenSwapV3: requestId, assinatura de 64 bytes e Ed25519 sobre mensagem exata PASS;
- persistência por `am force-stop` → relaunch com emulator vivo: PASS;
- `DELTA_INVENTORY`, `LEARNING_PRESERVED`, `RECONCILIATION_CLOSURE` e `DEPENDENCY_REFERENCES`: PASS.

## Licenças e proveniência implementadas em 1.1.3

- preservação do `LICENSE.md` MIT do AirGap Vault/Papers AG;
- `THIRD_PARTY_NOTICES.md` com AirGap, Keystone, NGRAVE e a relação com o módulo;
- `MODIFICATIONS.md` com base upstream, arquivos modificados e natureza das mudanças;
- cabeçalhos de origem/modificação nos arquivos TypeScript, HTML e testes alterados;
- `LEGAL_AUDIT.md` com achados, correções, limites e natureza não jurídica da revisão;
- contrato do módulo 0.1.7 passa a exigir `LICENSE`, avisos completos e hashes legais no manifesto assinado;
- build Kaizou futuro reprova ausência ou divergência desses arquivos/hashes;
- a skill de release passa a exigir inventário do bundle real, lockfile, avisos no artefato e verificação da release substituta antes de retirar páginas antigas.

## Histórico funcional consolidado

### 1.0.0 — módulo 0.1.3

- primeira integração pública Solana no Vault;
- opção AirGap Solflare, sync `crypto-multi-accounts` e fluxo
  `sol-sign-request` → assinatura offline → `sol-signature`;
- preservação de requestId, derivation path e master fingerprint;
- assinatura Ed25519 verificada e gates de não-regressão;
- Android 11 Google Play `user`, non-root; 86 specs aprovados;
- APK histórico SHA-256
  `f014e3031de68d3fcec9a06da78f99e850db2305916b3a5657763a93dbcb7976`.

### 1.1.0 — módulo 0.1.4

- módulo estático disponível em instalação limpa;
- parser offline das instruções Stake Initialize, Authorize,
  AuthorizeWithSeed, Delegate, Split, Withdraw, Deactivate e Merge;
- ComputeBudget ignorado somente para classificação e programas desconhecidos
  preservados/assináveis com alerta explícito;
- Android 11 non-root; 88 specs aprovados;
- APK histórico SHA-256
  `6fdc4258b9e51d6736d0718530a774edf53557d3355fc61d5e3716213263fb32`.

### 1.1.1 — módulo 0.1.5

- classificação `keystone-classified` para SPL Token Swap v3
  `DepositAllTokenTypes`/liquidity pool;
- Stake Deactivate preservado como `verified-stake`;
- fluxo real IAC → detalhes → resposta, requestId preservado e assinatura
  Ed25519 verificada; persistência após reinício;
- Android 11 `user/release-keys`, non-root;
- APK histórico SHA-256
  `bc02869877b8473a933694980e5b6c53a61ead87389dbcff7fb1c389acc8803b`.

### 1.1.2 — módulo 0.1.6

- suporte a `SignType.Message` e `SignType.Transaction`;
- coleta Fountain multipart resiliente, até quatro streams, descarte de quadro
  inválido/stale e ambiguidade sem seleção silenciosa;
- replay real de conta não local encerra em `No account found`;
- assinaturas controlada, Pancake CLMM, Stake Deactivate e TokenSwapV3
  verificadas por requestId, 64 bytes e Ed25519 sobre a mensagem exata;
- Android 11 non-root, 99/99 specs, persistência após `force-stop`/restart;
- APK histórico SHA-256
  `6885cc59cc9f0050bb0e2614ac4a0a4c165aa0011f086e3e8b68881dd3742a45`.

### 1.1.3 — módulo-fonte 0.1.7

- consolidação acima e correção dos controles legais/de supply chain;
- árvore npm reproduzível e inventário gerado do bundle real;
- exclusão mecânica do código `rpc-websockets` LGPL-3.0-only não utilizado;
- avisos dentro do pacote e hashes legais no manifesto assinado;
- publicação inicial sem APK; atualização binária U27 de 26/08/2026 publicou o APK homologado acima após todos os portões PASS.

## Segurança e limites

Projeto experimental, não oficial. Não houve revisão humana das mudanças
Kaizou nem auditoria independente de segurança. As homologações acima são
evidência histórica dos cenários medidos, não garantia para fundos reais. A
revisão de licença é técnica e não substitui aconselhamento jurídico.

## Substituição das páginas anteriores

Depois que esta release e seu arquivo de proveniência forem verificados, as
páginas GitHub Releases 1.0.0, 1.1.0, 1.1.1 e 1.1.2 e seus APKs serão removidas
como distribuições substituídas. As tags e commits históricos permanecerão
intactos para auditoria e reprodução do histórico.

## Verificação da consolidação

A publicação transacional inicial criou a 1.1.3, baixou e validou o SHA-256 do arquivo legal e só então removeu as quatro páginas substituídas. A execução final também alinha a tag 1.1.3 ao estado documental final. As tags históricas 1.0.0–1.1.2 continuam presentes.

O workflow de consolidação é limitado nominalmente às quatro páginas históricas acima; ele não remove releases futuras ou não relacionadas.
