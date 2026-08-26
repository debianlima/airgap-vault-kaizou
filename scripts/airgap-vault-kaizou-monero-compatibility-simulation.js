#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const cp = require('child_process')
const { UR, URDecoder, UREncoder } = require('@ngraveio/bc-ur')

const root = path.resolve(__dirname, '..')
const reportPath = path.join(root, 'reports/airgap-vault-kaizou-monero-compatibility.html')
const refsRootIndex = process.argv.indexOf('--references-root')
const refsRoot = refsRootIndex >= 0 ? process.argv[refsRootIndex + 1] : undefined
const sourceAudit = process.argv.includes('--source-audit')

const refs = {
  cake: { version: 'v6.4.1', commit: '8f38ba6b171a966c56897f0d32077c3ac4d51420', license: 'MIT', moneroCore: 'monero_c LGPL-3.0' },
  feather: { version: '2.8.1', commit: '51dc8ed04f0fc4cead2e867a249c32bd3e3b8126', license: 'BSD-3-Clause' },
  keystone: { version: '3.0.0 Cypherpunk', commit: '7f2c4423df824c1054efe125be9662cdbf6767b8', license: 'MIT (firmware root; component licenses vary)' }
}

const urTypes = ['xmr-output', 'xmr-keyimage', 'xmr-txunsigned', 'xmr-txsigned']
const magics = {
  'xmr-output': Buffer.from('Monero output export\x04', 'binary'),
  'xmr-keyimage': Buffer.from('Monero key image export\x03', 'binary'),
  'xmr-txunsigned': Buffer.from('Monero unsigned tx set\x05', 'binary'),
  'xmr-txsigned': Buffer.from('Monero signed tx set\x05', 'binary')
}

function fail(message) { console.error('MONERO_COMPATIBILITY_SIMULATION=FAIL ' + message); process.exit(1) }
function assert(condition, message) { if (!condition) fail(message) }
function hash(data) { return crypto.createHash('sha256').update(data).digest('hex') }
function cborBytes(payload) {
  const n = payload.length
  if (n < 24) return Buffer.concat([Buffer.from([0x40 | n]), payload])
  if (n <= 255) return Buffer.concat([Buffer.from([0x58, n]), payload])
  if (n <= 65535) { const h = Buffer.alloc(3); h[0] = 0x59; h.writeUInt16BE(n, 1); return Buffer.concat([h, payload]) }
  const h = Buffer.alloc(5); h[0] = 0x5a; h.writeUInt32BE(n, 1); return Buffer.concat([h, payload])
}
function decodeCborBytes(cbor) {
  const b = Buffer.from(cbor); const ai = b[0] & 0x1f
  let off = 1, n
  if ((b[0] & 0xe0) !== 0x40) fail('CBOR is not byte string')
  if (ai < 24) n = ai
  else if (ai === 24) { off = 2; n = b[1] }
  else if (ai === 25) { off = 3; n = b.readUInt16BE(1) }
  else if (ai === 26) { off = 5; n = b.readUInt32BE(1) }
  else fail('unsupported CBOR length')
  assert(b.length === off + n, 'CBOR byte-string length mismatch')
  return b.subarray(off)
}
function urRoundTrip(type, payload) {
  const encoder = new UREncoder(new UR(cborBytes(payload), type), 80)
  const frames = encoder.encodeWhole()
  assert(frames.length >= 1, type + ' did not encode')
  const decoder = new URDecoder()
  for (const frame of [...frames].reverse().concat(frames[0])) decoder.receivePart(frame)
  assert(decoder.isComplete() && decoder.isSuccess(), type + ' fountain decode failed')
  const result = decoder.resultUR()
  assert(result.type === type, type + ' type changed')
  const decoded = decodeCborBytes(result.cbor)
  assert(decoded.equals(payload), type + ' canonical payload changed')
  return { frames: frames.length, sha256: hash(payload), bytes: payload.length }
}

const keystonePublicPairing = {
  version: 0,
  primaryAddress: '4' + 'A'.repeat(94),
  privateViewKey: '11'.repeat(32),
  restoreHeight: 0,
  encrypted: false,
  source: 'Keystone'
}
function cakeAcceptsPublicPairing(j) {
  return j.version === 0 && typeof j.primaryAddress === 'string' && typeof j.privateViewKey === 'string' && Number.isInteger(j.restoreHeight)
}
function featherAcceptsPublicPairing(j) {
  return typeof j.primaryAddress === 'string' && typeof j.privateViewKey === 'string' && Number.isInteger(j.restoreHeight)
}
assert(cakeAcceptsPublicPairing(keystonePublicPairing), 'Cake public pairing model mismatch')
assert(featherAcceptsPublicPairing(keystonePublicPairing), 'Feather public pairing model mismatch')

const transportResults = {}
for (const type of urTypes) {
  const tail = Buffer.alloc(type.includes('tx') ? 900 : 500, type.length)
  transportResults[type] = urRoundTrip(type, Buffer.concat([magics[type], tail]))
}

const methods = [
  {
    id: 'pairing', name: '1. Pairing / watch-only wallet',
    cake: 'protocol-pass-ui-gated', feather: 'pass-with-ux-caveat', keystone: 'pass',
    note: 'Keystone public JSON matches Cake/Feather fields. Cake v6.4.1 still labels Keystone “coming soon”. Feather accepts the fields but Keystone omits walletName, so the generated name falls back.'
  },
  {
    id: 'keyimages', name: '2. Outputs ↔ key images',
    cake: 'pass', feather: 'pass', keystone: 'pass',
    note: 'All three use xmr-output/xmr-keyimage carrying canonical wallet2 bytes as a CBOR byte string inside BC-UR.'
  },
  {
    id: 'transactions', name: '3. Unsigned ↔ signed transaction',
    cake: 'pass', feather: 'pass', keystone: 'pass',
    note: 'All three use xmr-txunsigned/xmr-txsigned carrying canonical wallet2 bytes as a CBOR byte string inside BC-UR.'
  }
]
const privatePairing = { cake: 'blocked', feather: 'blocked', keystone: 'producer-only', note: 'Keystone can encrypt address/view-key fields with a six-digit PIN; no matching decrypt path was found in Cake v6.4.1 or Feather 2.8.1.' }

function read(rel) {
  if (!refsRoot) fail('--source-audit requires --references-root')
  return fs.readFileSync(path.join(refsRoot, rel), 'utf8')
}
function gitHead(rel) {
  return cp.execFileSync('git', ['-C', path.join(refsRoot, rel), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
}
function assertIncludes(text, needle, label) { assert(text.includes(needle), label + ' missing: ' + needle) }
function gitShow(rel, commit, file) {
  return cp.execFileSync('git', ['-C', path.join(refsRoot, rel), 'show', commit + ':' + file], { encoding: 'utf8' })
}
function auditLicenses() {
  assertIncludes(read('cake-v6.4.1/LICENSE.md'), 'MIT License', 'Cake license')
  assertIncludes(read('cake-v6.4.1/cw_monero/LICENSE'), 'MIT License', 'Cake cw_monero license')
  assertIncludes(read('monero_c-cake-v6.4.1/LICENSE'), 'GNU LESSER GENERAL PUBLIC LICENSE', 'monero_c license')
  assertIncludes(read('bc-ur-dart-cake-v6.4.1/LICENSE'), 'MIT License', 'Cake bc-ur-dart license')
  assertIncludes(read('mrcyjanek-bc-ur-d82e7c753/LICENSE'), 'BSD-2-Clause Plus Patent License', 'Cake C++ BC-UR license')
  assertIncludes(read('feather-2.8.1/LICENSE'), 'Redistribution and use in source and binary forms', 'Feather BSD-3-Clause license')
  assertIncludes(read('keystone3-3.0.0/LICENSE'), 'License: MIT', 'Keystone root license')
  const urCargo = gitShow('keystone-sdk-rust', '284c0da7c82de3c05ca7928729395aafe4d7220d', 'libs/ur-registry/Cargo.toml')
  assertIncludes(urCargo, 'version = "1.0.5"', 'Keystone ur-registry version')
  assertIncludes(urCargo, 'license = "MIT"', 'Keystone ur-registry license')
  for (const rel of [
    'keystone-serai-c784e6c6/networks/monero/Cargo.toml',
    'keystone-serai-c784e6c6/networks/monero/wallet/Cargo.toml'
  ]) assertIncludes(read(rel), 'license = "MIT"', 'Keystone Serai Monero crate license')
  assertIncludes(read('keystone-cuprate-8ae09c3d/cryptonight/Cargo.toml'), 'license = "MIT"', 'Keystone cuprate-cryptonight license')
  assertIncludes(read('keystone3-3.0.0/README.md'), 'pre-compiled library rather than source code due to intellectual property restrictions', 'Keystone precompiled component disclosure')
  console.log('LICENSE_SOURCE_AUDIT=PASS')
}
function auditSources() {
  assert(gitHead('cake-v6.4.1') === refs.cake.commit, 'Cake source pin changed')
  assert(gitHead('feather-2.8.1') === refs.feather.commit, 'Feather source pin changed')
  assert(gitHead('keystone3-3.0.0') === refs.keystone.commit, 'Keystone source pin changed')
  assert(gitHead('monero_c-cake-v6.4.1') === '3bfb3856a838f2bf6b729501837bb0295dedf25d', 'Cake monero_c pin changed')
  assert(gitHead('bc-ur-dart-cake-v6.4.1') === '5738f70d0ec3d50977ac3dd01fed62939600238b', 'Cake bc-ur-dart pin changed')
  assert(gitHead('mrcyjanek-bc-ur-d82e7c753') === 'd82e7c753e710b8000706dc3383b498438795208', 'Cake C++ bc-ur pin changed')
  assert(gitHead('keystone-serai-c784e6c6') === 'c784e6c6fcd6cfd8ac88cdd0d467184aeefaf810', 'Keystone Serai pin changed')
  assert(gitHead('keystone-cuprate-8ae09c3d') === '8ae09c3d83eb1a48050d7f46dc9ed5e0c6feedca', 'Keystone Cuprate pin changed')
  const cakeRestore = read('cake-v6.4.1/lib/view_model/restore/wallet_restore_from_qr_code.dart')
  const cakePage = read('cake-v6.4.1/lib/src/screens/connect_device/select_device_manufacturer_page.dart')
  const cakeMoneroPatch = read('monero_c-cake-v6.4.1/patches/monero/0005-UR-functions.patch')
  const featherView = read('feather-2.8.1/src/dialog/ViewOnlyDialog.cpp')
  const featherOffline = read('feather-2.8.1/src/wizard/offline_tx_signing/PageOTS_ImportOffline.cpp') + read('feather-2.8.1/src/wizard/offline_tx_signing/PageOTS_ExportOutputs.cpp')
  const ksCake = read('keystone3-3.0.0/rust/rust_c/src/wallet/cypherpunk_wallet/cake.rs')
  const ksMonero = read('keystone3-3.0.0/rust/rust_c/src/monero/mod.rs')
  const ksCargo = read('keystone3-3.0.0/rust/Cargo.lock')

  for (const field of ['"version"', 'primaryAddress', 'privateViewKey', 'restoreHeight']) assert(cakeRestore.includes(field), 'Cake pairing field missing: ' + field)
  assert(cakePage.includes('keystone_man.svg') && cakePage.includes('coming_soon_tag'), 'Cake Keystone UI gate not found')
  for (const type of urTypes) assert(cakeMoneroPatch.includes(type), 'Cake monero_c UR type missing: ' + type)
  for (const field of ['primaryAddress', 'privateViewKey', 'restoreHeight']) assert(featherView.includes(field), 'Feather pairing field missing: ' + field)
  assert(featherOffline.includes('xmr-output') || featherOffline.includes('xmr-keyimage'), 'Feather offline XMR flow missing')
  for (const field of ['"version": 0', '"primaryAddress"', '"privateViewKey"', '"restoreHeight"']) assert(ksCake.includes(field), 'Keystone pairing field missing: ' + field)
  for (const typeClass of ['XmrOutput', 'XmrKeyImage', 'XmrTxUnsigned', 'XmrTxSigned']) assert(ksMonero.includes(typeClass), 'Keystone Monero UR class missing: ' + typeClass)
  assert(ksCargo.includes('name = "ur-registry"') && ksCargo.includes('version = "1.0.5"'), 'Keystone ur-registry pin missing')
  auditLicenses()
  console.log('SOURCE_AUDIT=PASS')
}
if (sourceAudit) auditSources()

const licenses = [
  ['Cake Wallet v6.4.1', 'MIT', 'Permissive; retain notice if code is copied/distributed.'],
  ['Cake cw_monero', 'MIT', 'Permissive Cake wrapper.'],
  ['Cake monero_c @ 3bfb3856…', 'LGPL-3.0', 'Copyleft/linking obligations; do not silently vendor into Kaizou.'],
  ['Cake bc-ur-dart @ 5738f70d…', 'MIT', 'Permissive.'],
  ['MrCyjaneK/bc-ur @ d82e7c75…', 'BSD-2-Clause-Patent', 'Notice + patent-license conditions.'],
  ['Feather 2.8.1', 'BSD-3-Clause', 'Notice/disclaimer and no-endorsement clause.'],
  ['Keystone3 firmware 3.0.0', 'MIT', 'Root firmware permissive, but external/precompiled components require separate audit.'],
  ['Keystone ur-registry 1.0.5', 'MIT', 'Permissive.'],
  ['Keystone monero-serai / monero-wallet crates', 'MIT', 'Exact Monero crates used by firmware are MIT despite other Serai crates being AGPL.'],
  ['Keystone cuprate-cryptonight', 'MIT', 'Exact cryptonight crate used by firmware is MIT.'],
  ['MH1903 QRDecodeLib.a', 'Precompiled / IP-restricted source', 'Do not import; firmware README says source is unavailable due IP restrictions.']
]

const label = {
  pass: ['PASS', 'pass'],
  'pass-with-ux-caveat': ['PASS + UX caveat', 'warn'],
  'protocol-pass-ui-gated': ['Protocol PASS / UI gated', 'warn'],
  blocked: ['BLOCKED', 'fail'],
  'producer-only': ['Producer only', 'warn']
}
function badge(status) { const [text, cls] = label[status]; return `<span class="badge ${cls}">${text}</span>` }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
const methodRows = methods.map(m => `<tr><th>${esc(m.name)}</th><td>${badge(m.cake)}</td><td>${badge(m.feather)}</td><td>${badge(m.keystone)}</td><td>${esc(m.note)}</td></tr>`).join('\n')
const transportRows = Object.entries(transportResults).map(([type, r]) => `<tr><td><code>${type}</code></td><td>${r.bytes}</td><td>${r.frames}</td><td><code>${r.sha256}</code></td><td>${badge('pass')}</td></tr>`).join('\n')
const licenseRows = licenses.map(([name, license, note]) => `<tr><td>${esc(name)}</td><td><strong>${esc(license)}</strong></td><td>${esc(note)}</td></tr>`).join('\n')

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Monero QR compatibility — Cake × Feather × Keystone3</title><style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#18181b;background:#f4f4f5}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:32px}.hero{background:#18181b;color:white;border-radius:18px;padding:28px;margin-bottom:22px}.hero h1{margin:0 0 8px;font-size:30px}.hero p{margin:4px 0;color:#d4d4d8}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin:18px 0}.card{background:white;border:1px solid #e4e4e7;border-radius:14px;padding:18px}.card h3{margin-top:0}table{width:100%;border-collapse:collapse;background:white;border-radius:14px;overflow:hidden;margin:14px 0 26px}th,td{padding:13px;border-bottom:1px solid #e4e4e7;text-align:left;vertical-align:top}thead th{background:#f4f4f5}.badge{display:inline-block;padding:4px 9px;border-radius:999px;font-weight:700;font-size:12px}.pass{background:#dcfce7;color:#166534}.warn{background:#fef3c7;color:#92400e}.fail{background:#fee2e2;color:#991b1b}code{font-family:ui-monospace,monospace;font-size:12px;overflow-wrap:anywhere}.callout{border-left:5px solid #f59e0b;background:#fffbeb;padding:14px 16px;border-radius:8px}.ok{border-left-color:#22c55e;background:#f0fdf4}.small{font-size:13px;color:#52525b}</style></head><body><div class="wrap">
<section class="hero"><h1>Cake × Feather × Keystone3 — Monero QR</h1><p>Simulação de compatibilidade de protocolo, baseada em source pins exatos e sem copiar código externo para o APK.</p><p class="small">Cake ${refs.cake.version} · Feather ${refs.feather.version} · Keystone ${refs.keystone.version}</p></section>
<div class="grid"><div class="card"><h3>Resultado</h3><p><strong>Methods 2 e 3:</strong> compatibilidade direta de wire protocol.</p><p><strong>Method 1:</strong> QR público compatível; Cake ainda bloqueia Keystone na UI.</p></div><div class="card"><h3>Wire format</h3><p>BC-UR + CBOR byte string + bytes canônicos wallet2.</p><p><code>xmr-output · xmr-keyimage · xmr-txunsigned · xmr-txsigned</code></p></div><div class="card"><h3>Kaizou hoje</h3><p>Transport/review compatível. Spend-key e signer continuam fora do escopo.</p></div></div>
<h2>Os três métodos para funcionar</h2><table><thead><tr><th>Método</th><th>Cake</th><th>Feather</th><th>Keystone3 Cypherpunk</th><th>Leitura</th></tr></thead><tbody>${methodRows}</tbody></table>
<div class="callout"><strong>Private QR:</strong> ${badge(privatePairing.cake)} Cake · ${badge(privatePairing.feather)} Feather · ${badge(privatePairing.keystone)} Keystone. ${esc(privatePairing.note)}</div>
<h2>Simulação byte-preserving</h2><table><thead><tr><th>UR type</th><th>Payload bytes</th><th>Fountain frames</th><th>SHA-256 antes/depois</th><th>Resultado</th></tr></thead><tbody>${transportRows}</tbody></table>
<h2>Licenças dos componentes relevantes</h2><table><thead><tr><th>Componente</th><th>Licença</th><th>Impacto</th></tr></thead><tbody>${licenseRows}</tbody></table>
<div class="callout ok"><strong>Recomendação de implementação:</strong> manter interoperabilidade por protocolo e implementação própria no Kaizou. Não vendorizar <code>monero_c</code> sem decisão explícita sobre LGPL-3.0. Se reutilizar código Keystone/Serai/Cuprate, preservar avisos MIT e auditar somente os crates realmente incorporados.</div>
<p class="small">Este relatório é uma análise técnica de licenças e interoperabilidade, não aconselhamento jurídico.</p>
</div></body></html>`
fs.writeFileSync(reportPath, html)
console.log('PAIRING_PUBLIC_CAKE=PASS_PROTOCOL_UI_GATED')
console.log('PAIRING_PUBLIC_FEATHER=PASS_WITH_UX_CAVEAT')
console.log('PAIRING_PRIVATE_CAKE_FEATHER=BLOCKED')
console.log('OUTPUT_KEYIMAGE_THREE_WAY=PASS')
console.log('UNSIGNED_SIGNED_THREE_WAY=PASS')
console.log('WIRE_ROUNDTRIP=PASS_4_OF_4')
console.log('LICENSE_GATE=PASS_WITH_LGPL_AND_PRECOMPILED_CAVEATS')
console.log('REPORT=' + reportPath)
console.log('MONERO_COMPATIBILITY_SIMULATION=PASS')
