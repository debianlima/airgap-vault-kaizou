#!/usr/bin/env node
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..')
const allowedProductChanges = new Set([
  'package.json',
  'yarn.lock',
  'src/app/pages/account-address/account-address.page.ts',
  'src/app/pages/account-address/account-address.page.spec.ts',
  'src/app/pages/account-share/account-share.page.ts',
  'src/app/pages/account-share/account-share.page.html',
  'src/app/pages/account-share/account-share.page.spec.ts',
  'src/app/pages/transaction-signed/transaction-signed.page.ts',
  'src/app/pages/transaction-signed/transaction-signed.page.html',
  'src/app/pages/transaction-signed/transaction-signed.page.spec.ts',
  'src/app/services/iac/iac.service.ts',
  'src/app/services/iac/iac.service.spec.ts',
  'src/app/services/interaction/interaction.service.ts',
  'src/app/services/interaction/interaction.service.spec.ts',
  'src/app/services/solflare-keystone/solflare-keystone.service.ts',
  'src/app/services/solflare-keystone/solflare-keystone.service.spec.ts',
  'src/app/pages/deserialized-detail/deserialized-detail.effects.ts',
  'src/app/pages/deserialized-detail/deserialized-detail.effects.spec.ts'
])
const changed = execFileSync(
  'git',
  ['diff', '--name-only', 'v3.34.4', '--', 'package.json', 'yarn.lock', 'src/app'],
  { cwd: root, encoding: 'utf8' }
).trim().split(/\r?\n/).filter(Boolean)
const unexpected = changed.filter((file) => !allowedProductChanges.has(file))
if (unexpected.length) throw new Error(`unexpected product changes outside Solflare surface: ${unexpected.join(', ')}`)
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
if (pkg.dependencies['@keystonehq/bc-ur-registry-sol'] !== '0.9.5') throw new Error('Solana registry dependency is not pinned to 0.9.5')
const address = fs.readFileSync(path.join(root, 'src/app/pages/account-address/account-address.page.ts'), 'utf8')
for (const legacy of ['MainProtocolSymbols.BTC', 'MainProtocolSymbols.BTC_SEGWIT', 'MainProtocolSymbols.BTC_TAPROOT', 'MainProtocolSymbols.ETH', 'MainProtocolSymbols.AE']) {
  if (!address.includes(legacy)) throw new Error(`legacy sync branch missing: ${legacy}`)
}
const iac = fs.readFileSync(path.join(root, 'src/app/services/iac/iac.service.ts'), 'utf8')
for (const legacy of ['MainProtocolSymbols.BTC_SEGWIT', 'MainProtocolSymbols.BTC_TAPROOT', 'MainProtocolSymbols.ETH', 'MainProtocolSymbols.OPTIMISM', 'MainProtocolSymbols.BNB', 'MainProtocolSymbols.BASE']) {
  if (!iac.includes(legacy)) throw new Error(`legacy IAC branch missing: ${legacy}`)
}
if (!iac.includes('signTransactionRequest.protocol === SOLFLARE_KEYSTONE_PROTOCOL')) throw new Error('Solflare branch is not protocol-guarded')
const share = fs.readFileSync(path.join(root, 'src/app/pages/account-share/account-share.page.html'), 'utf8')
if (!share.includes('<airgap-iac-qr') || !share.includes('*ngIf="!solflareSyncQr"')) throw new Error('existing IAC QR path not preserved')
const signed = fs.readFileSync(path.join(root, 'src/app/pages/transaction-signed/transaction-signed.page.html'), 'utf8')
if (!signed.includes('<airgap-iac-qr') || !signed.includes('!solflareSignatureQr')) throw new Error('existing signed IAC QR path not preserved')

const detailsEffects = fs.readFileSync(path.join(root, 'src/app/pages/deserialized-detail/deserialized-detail.effects.ts'), 'utf8')
if (!detailsEffects.includes("String(walletProtocolIdentifier) === 'solana'")) throw new Error('Solana detail guard missing')
if (!detailsEffects.includes('details = await wallet.protocol.getTransactionDetails(request.payload as UnsignedTransaction)')) throw new Error('Solana direct detail path missing')
if (!detailsEffects.includes('details = await this.transactionService.getDetailsFromIACMessages([request])')) throw new Error('upstream non-Solana detail path missing')
console.log(`PASS: Solflare changes isolated; ${changed.length} product files differ from v3.34.4 and all are declared`)
