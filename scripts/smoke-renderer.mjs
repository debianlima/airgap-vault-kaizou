#!/usr/bin/env node
// Renderer pipeline smoke test. Compiles the renderer + service files via tsc
// against a minimal angular stub, then exercises the pipeline.

import { execSync } from 'child_process'
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const tmp = mkdtempSync(join(tmpdir(), 'agv-rsmoke-'))
const projRoot = join(import.meta.dirname, '..')

const files = [
  'src/app/services/evm/abi-decoder.service.ts',
  'src/app/services/evm/abi-types.ts',
  'src/app/services/evm/known-tokens.ts',
  'src/app/services/evm/signature-database.service.ts',
  'src/app/services/evm/transaction-renderer.service.ts',
  'src/app/renderers/evm/base.renderer.ts',
  'src/app/renderers/evm/erc20.renderer.ts',
  'src/app/renderers/evm/erc721.renderer.ts',
  'src/app/renderers/evm/multicall.renderer.ts',
  'src/app/renderers/evm/generic-abi.renderer.ts',
  'src/app/renderers/evm/raw-hex.renderer.ts',
  'scripts/stubs/angular-core.ts',
  'scripts/stubs/angular-common-http.ts',
  'scripts/stubs/rxjs.ts'
].map(f => join(projRoot, f))

const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'node',
    strict: false,
    experimentalDecorators: true,
    skipLibCheck: true,
    esModuleInterop: true,
    outDir: tmp,
    rootDir: projRoot
  },
  files,
  include: []
}
writeFileSync(join(tmp, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
execSync(`npx tsc -p "${join(tmp, 'tsconfig.json')}"`, { cwd: projRoot, stdio: 'inherit' })

// Write tmp ESM stubs and rewrite bare-specifier imports in emitted JS to point at them.
const stubFiles = {
  'angular-core.js': 'export const Injectable = () => (_) => {}\n',
  'angular-common-http.js': 'export class HttpClient { get(_a, _b) { return null } }\n',
  'rxjs.js': 'export function firstValueFrom(_x) { return Promise.reject(new Error("no http")) }\n'
}
for (const [name, src] of Object.entries(stubFiles)) writeFileSync(join(tmp, name), src)
const stubMap = {
  '@angular/core': `${tmp}/angular-core.js`,
  '@angular/common/http': `${tmp}/angular-common-http.js`,
  rxjs: `${tmp}/rxjs.js`
}
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full)
    else if (full.endsWith('.js')) {
      let src = readFileSync(full, 'utf8')
      let changed = false
      // Add .js to extensionless relative imports for ESM
      const before = src
      src = src.replace(/from ['"](\.[^'"]+)['"]/g, (_m, p) => {
        if (/\.(js|mjs|cjs|json)$/.test(p)) return `from "${p}"`
        return `from "${p}.js"`
      })
      if (src !== before) changed = true
      for (const [k, v] of Object.entries(stubMap)) {
        const re = new RegExp(`from ['"]${k.replace(/[/.]/g, '\\$&')}['"]`, 'g')
        if (re.test(src)) {
          src = src.replace(re, `from "${v.replace(/\\/g, '/')}"`)
          changed = true
        }
      }
      if (changed) writeFileSync(full, src)
    }
  }
}
walk(tmp)

const { AbiDecoderService } = await import(`file://${tmp}/src/app/services/evm/abi-decoder.service.js`)
const { EvmTransactionRendererService } = await import(
  `file://${tmp}/src/app/services/evm/transaction-renderer.service.js`
)

class FakeDb {
  map = new Map()
  set(s, sig, c = 1) {
    this.map.set(s.toLowerCase(), { signature: sig, collisions: c })
  }
  async initialize() {}
  async lookup(s) {
    const v = this.map.get(s.toLowerCase())
    return v ? { signature: v.signature, selector: s.toLowerCase(), collisions: v.collisions } : null
  }
  async getMetadata() {
    return null
  }
}

let pass = 0
let fail = 0
function check(name, cond, detail) {
  if (cond) {
    console.log('  PASS', name)
    pass++
  } else {
    console.error('  FAIL', name, detail || '')
    fail++
  }
}

const dec = new AbiDecoderService()
const db = new FakeDb()
const svc = new EvmTransactionRendererService(dec, db)

console.log('Renderer pipeline')

// 1. ERC-20 transfer routed to dedicated renderer
{
  const tx = {
    to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    data:
      '0xa9059cbb' +
      '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' +
      '00000000000000000000000000000000000000000000000000000000000003e8',
    chainId: 1
  }
  await svc.prepare(tx)
  const r = svc.render(tx)
  check('erc20 routed', r.type === 'erc20-transfer' && r.confidence === 'high', JSON.stringify(r))
}

// 2. transferFrom -> low confidence with warning
{
  const tx = {
    to: '0xabc0000000000000000000000000000000000000',
    data:
      '0x23b872dd' +
      '000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
      '000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' +
      '000000000000000000000000000000000000000000000000000000000000002a'
  }
  await svc.prepare(tx)
  const r = svc.render(tx)
  check('transferFrom ambiguous', r.type === 'erc721-transfer' && r.confidence === 'low' && !!r.warningKey)
}

// 3. Unknown -> raw hex
{
  const tx = { to: '0xdead000000000000000000000000000000000000', data: '0xdeadbeef00' }
  await svc.prepare(tx)
  const r = svc.render(tx)
  check('unknown -> raw-hex', r.type === 'raw-hex' && r.confidence === 'unknown')
}

// 4. Generic DB match with collisions
{
  db.set('11111111', 'foo(uint256)', 3)
  const tx = {
    to: '0xabc0000000000000000000000000000000000000',
    data: '0x11111111' + '0000000000000000000000000000000000000000000000000000000000000007'
  }
  await svc.prepare(tx)
  const r = svc.render(tx)
  check('generic with collisions -> low', r.type === 'generic-decoded' && r.confidence === 'low')
}

// 5. Multicall with two ERC-20 transfers
{
  const inner =
    'a9059cbb' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' +
    '0000000000000000000000000000000000000000000000000000000000000001'
  const pad = '0'.repeat(56) // 68-byte blob padded to 96
  const data =
    '0xac9650d8' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000002' +
    '0000000000000000000000000000000000000000000000000000000000000040' +
    '00000000000000000000000000000000000000000000000000000000000000c0' +
    '0000000000000000000000000000000000000000000000000000000000000044' +
    inner +
    pad +
    '0000000000000000000000000000000000000000000000000000000000000044' +
    inner +
    pad
  const tx = { to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', data, chainId: 1 }
  await svc.prepare(tx)
  const r = svc.render(tx)
  check(
    'multicall decoded',
    r.type === 'multicall' && r.nested?.length === 2 && r.nested[0].type === 'erc20-transfer',
    JSON.stringify({ type: r.type, nested: r.nested?.length, inner0: r.nested?.[0]?.type })
  )
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
