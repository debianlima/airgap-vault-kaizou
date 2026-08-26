#!/usr/bin/env node
'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cp = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const CONTRACT = JSON.parse(fs.readFileSync(path.join(ROOT, 'contratos/airgap-vault-kaizou-monero.schema.json'), 'utf8'))
const P = CONTRACT.properties

function fail(message) { console.error(`MONERO_ORACLE_GATE=FAIL ${message}`); process.exit(1) }
function pass(label) { console.log(`${label}=PASS`) }
function eq(actual, expected, label) { if (actual !== expected) fail(`${label} expected=${expected} actual=${actual}`); pass(label) }
function constant(node, label) { if (!node || !Object.prototype.hasOwnProperty.call(node, 'const')) fail(`${label} missing const`); return node.const }
function hex(s) { return Buffer.from(s, 'utf8').toString('hex') }
function sha256File(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }
function gitHead(dir) { return cp.execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }

function verifyContract() {
  eq(constant(P.projectContractVersion, 'projectContractVersion'), 34, 'PROJECT_CONTRACT_VERSION')
  eq(constant(P.protocol.properties.id, 'protocol.id'), 'monero', 'PROTOCOL_ID')
  eq(constant(P.protocol.properties.ticker, 'protocol.ticker'), 'XMR', 'PROTOCOL_TICKER')
  eq(constant(P.protocol.properties.homologationNetwork, 'protocol.network'), 'stagenet', 'HOMOLOGATION_NETWORK')

  const ur = P.offlineTransport.properties.urTypes.properties
  eq(constant(ur.outputs, 'ur.outputs'), 'xmr-output', 'UR_XMR_OUTPUT')
  eq(constant(ur.keyImages, 'ur.keyImages'), 'xmr-keyimage', 'UR_XMR_KEYIMAGE')
  eq(constant(ur.unsignedTransaction, 'ur.unsigned'), 'xmr-txunsigned', 'UR_XMR_TXUNSIGNED')
  eq(constant(ur.signedTransaction, 'ur.signed'), 'xmr-txsigned', 'UR_XMR_TXSIGNED')

  const magic = P.wallet2Magic.properties
  eq(constant(magic.outputsHex, 'magic.outputs'), hex('Monero output export\x04'), 'MAGIC_OUTPUTS')
  eq(constant(magic.keyImagesHex, 'magic.keyImages'), hex('Monero key image export\x03'), 'MAGIC_KEY_IMAGES')
  eq(constant(magic.unsignedTransactionHex, 'magic.unsigned'), hex('Monero unsigned tx set\x05'), 'MAGIC_UNSIGNED_TX')
  eq(constant(magic.signedTransactionHex, 'magic.signed'), hex('Monero signed tx set\x05'), 'MAGIC_SIGNED_TX')

  const steps = P.choreography.prefixItems.map(x => x.const)
  if (steps.length !== 4 || !steps[0].includes('xmr-output') || !steps[1].includes('xmr-keyimage') || !steps[2].includes('xmr-txunsigned') || !steps[3].includes('xmr-txsigned')) fail('choreography')
  pass('MONERO_MULTI_STAGE_CHOREOGRAPHY')
  console.log('MONERO_CONTRACT_GATE=PASS')
}

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function verifyReferences(root) {
  if (!root) fail('--references-root requires a path')
  const primary = P.oracles.properties.primary.properties
  const feather = P.oracles.properties.interoperability.properties
  const moneroSrc = path.join(root, 'monero-v0.18.5.1')
  const featherSrc = path.join(root, 'feather-2.8.1')
  const moneroBase = path.join(root, 'monero-cli-v0.18.5.1-linux-x64')
  const featherBase = path.join(root, 'feather-cli-2.8.1-linux')
  const moneroArchive = path.join(moneroBase, 'monero-linux-x64-v0.18.5.1.tar.bz2')
  const walletCli = cp.execFileSync('bash', ['-lc', `find ${JSON.stringify(path.join(moneroBase, 'extracted'))} -type f -name monero-wallet-cli -perm -111 | head -1`], { encoding: 'utf8' }).trim()
  const featherArchive = path.join(featherBase, 'feather-2.8.1-linux.zip')

  eq(gitHead(moneroSrc), constant(primary.commit, 'oracle.primary.commit'), 'MONERO_SOURCE_COMMIT')
  eq(sha256File(moneroArchive), constant(primary.linuxX64ArchiveSha256, 'oracle.primary.archive'), 'MONERO_ARCHIVE_SHA256')
  if (!walletCli) fail('monero-wallet-cli missing')
  eq(sha256File(walletCli), constant(primary.walletCliSha256, 'oracle.primary.cli'), 'MONERO_WALLET_CLI_SHA256')
  const version = cp.execFileSync(walletCli, ['--version'], { encoding: 'utf8' }).trim()
  if (!version.includes('v0.18.5.1-release')) fail(`monero-wallet-cli version=${version}`)
  pass('MONERO_WALLET_CLI_VERSION')

  eq(gitHead(featherSrc), constant(feather.commit, 'oracle.feather.commit'), 'FEATHER_SOURCE_COMMIT')
  eq(sha256File(featherArchive), constant(feather.linuxArchiveSha256, 'oracle.feather.archive'), 'FEATHER_ARCHIVE_SHA256')
  console.log('MONERO_EXTERNAL_ORACLES=PASS')
}

verifyContract()
if (process.argv.includes('--verify-references')) verifyReferences(argValue('--references-root'))
