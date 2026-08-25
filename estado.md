# Estado — 2026-08-25 — contrato v31

## Decisões vigentes
- AirGap Vault Kaizou `1.1.3` é a release pública corrente de código-fonte, licenças e proveniência; ela não publica APK.
- A última evidência binária permanece histórica na tag `airgap-vault-kaizou-1.1.2`, com `airgap-solana-module 0.1.6`; sua página de release e APK foram retirados da distribuição corrente.
- As páginas 1.0.0, 1.1.0, 1.1.1 e 1.1.2 foram consolidadas nas notas 1.1.3 e removidas somente após criação, download e verificação do novo arquivo legal.
- As tags e commits 1.0.0–1.1.2 permanecem preservados para auditoria.
- Um próximo APK exige `airgap-solana-module 0.1.7` assinado com a chave de produção, os três arquivos legais com hashes no manifesto assinado, build limpo, inspeção do APK e nova homologação Android.
- `sol-sign-request` aceita `SignType.Message` e `SignType.Transaction`; a resposta é `sol-signature` com requestId preservado e assinatura Ed25519 sobre a mensagem exata.
- A coleta multipart Solflare usa fingerprint Fountain, dedupe por stream, limite de quatro streams, TTL e ambiguidade explícita.
- Skill de projeto ativa: `airgap-wallet-engineering-skill` 0.2.7, com gate mecânico de licenças e proveniência de release.

## Decisões superadas
- Apresentar 1.1.2 e seus APKs como distribuição corrente — substituído pela release-fonte 1.1.3.
- Empacotar módulo sem lockfile, avisos completos e hashes legais — substituído pelo contrato 0.1.7.
- Decoder Fountain linear único — substituído pela coleta stream-aware homologada.
- Descartar QR duplicado no `TabScanPage` antes do IAC — substituído por dedupe visual com entrega ao handler.

## Evidência histórica preservada
- APK 1.1.2: SHA-256 `6885cc59cc9f0050bb0e2614ac4a0a4c165aa0011f086e3e8b68881dd3742a45`; Android 11 Google Play `user/release-keys`, non-root; 99/99 specs.
- No APK histórico, controlled, Pancake CLMM, Stake e TokenSwap retornaram requestId correto, assinatura de 64 bytes e Ed25519 válido; `broadcast=false`.
- A descrição e os hashes das versões 1.0.0–1.1.2 estão preservados em `releases/airgap-vault-kaizou-1.1.3.md`.

## Correções legais 1.1.3
- `LICENSE.md` preserva o MIT/copyright Papers AG do upstream.
- `THIRD_PARTY_NOTICES.md` registra AirGap, Keystone, NGRAVE, versões, licenças e procedência.
- `MODIFICATIONS.md` mapeia os arquivos upstream modificados; arquivos de código/teste alterados contêm cabeçalho SPDX/origem.
- `LEGAL_AUDIT.md` registra a descoberta do `rpc-websockets` LGPL-3.0-only no bundle antigo e o controle corretivo do módulo 0.1.7.
- O build Kaizou futuro exige `LICENSE`, `THIRD_PARTY_NOTICES.md` e `THIRD_PARTY_DEPENDENCIES.md` no módulo e confere seus SHA-256 a partir do manifesto assinado.

## Pendências técnicas
- Produzir o pacote 0.1.7 com a chave de assinatura de produção, que permanece fora dos repositórios.
- Construir um APK novo, conferir seus arquivos legais e hashes e repetir a homologação Android antes de qualquer release binária.
- Submeter as alterações a revisão humana e auditoria independente antes de recomendar uso com fundos reais.

## Trabalho compartilhado
- `manifesto.yaml.trabalho_compartilhado`: `null`.

## Entradas aceitas
- Entradas históricas 1–942 permanecem como evidência da homologação 1.1.2.
- Os novos documentos/gates legais foram verificados separadamente na publicação 1.1.3.

## Próxima unidade
- Somente uma unidade binária futura: assinar o módulo 0.1.7 em ambiente autorizado, reconstruir/homologar o APK e publicar uma nova versão, sem reutilizar artefatos 1.0.0–1.1.2.
