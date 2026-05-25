#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Build a flat binary signature DB for offline lookup.
 *
 * Sources, in order of preference:
 *   1. 4byte.directory CSV/JSON dump (network)
 *   2. scripts/signatures.seed.json (committed, deterministic)
 *
 * Modes via env:
 *   SIGDB_SOURCE       = auto | 4byte | seed       (default: auto)
 *   SIGDB_DETERMINISTIC= 1 -> seed-only, no network. Use for reproducible CI builds.
 *   SIGDB_MAX_PAGES    = N -> cap 4byte fetch (debug)
 *   SIGDB_VERIFY       = 1 -> after build, verify sha256 against scripts/signatures.lock.json.
 *                              Exits non-zero on mismatch. Use in release CI.
 *   SIGDB_UPDATE_LOCK  = 1 -> rewrite scripts/signatures.lock.json with new sha256.
 *   SIGDB_FAIL_IF_EMPTY= 1 -> exit non-zero if final DB has 0 entries.
 *
 * Strategy:
 *   - Oldest-first per 4-byte selector (lowest id wins). Collision count is preserved
 *     and stored in the output so the runtime can warn about ambiguity.
 *   - Network fetch is best-effort by default. Set SIGDB_DETERMINISTIC=1 for CI.
 *
 * Output:
 *   src/assets/evm/signatures.db    (gitignored)
 *   src/assets/evm/signatures.meta.json
 *
 * File format documented in signature-database.service.ts.
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'evm')
const OUT_DB = path.join(OUT_DIR, 'signatures.db')
const OUT_META = path.join(OUT_DIR, 'signatures.meta.json')
const SEED = path.join(__dirname, 'signatures.seed.json')
const LOCK = path.join(__dirname, 'signatures.lock.json')

const FOURBYTE_API = 'https://www.4byte.directory/api/v1/signatures/?format=json&page='
const MAX_PAGES = parseInt(process.env.SIGDB_MAX_PAGES || '0', 10)
const SOURCE = process.env.SIGDB_DETERMINISTIC === '1' ? 'seed' : process.env.SIGDB_SOURCE || 'auto'
const VERIFY = process.env.SIGDB_VERIFY === '1'
const UPDATE_LOCK = process.env.SIGDB_UPDATE_LOCK === '1'
const FAIL_IF_EMPTY = process.env.SIGDB_FAIL_IF_EMPTY === '1'

const FORMAT_VERSION = 2

function httpJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'airgap-vault-build' } }, res => {
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode} ${url}`))
        }
        let body = ''
        res.setEncoding('utf8')
        res.on('data', c => (body += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', reject)
      .setTimeout(20000, function () {
        this.destroy(new Error('timeout'))
      })
  })
}

/**
 * Pull all 4byte rows. Track every distinct signature per selector so we can
 * record collision counts.
 */
async function fetchFourByte() {
  const sigsBySelector = new Map() // selector -> Map<sig, id>
  let page = 1
  let networkOk = true
  while (true) {
    if (MAX_PAGES > 0 && page > MAX_PAGES) break
    let json
    try {
      json = await httpJson(FOURBYTE_API + page)
    } catch (e) {
      console.warn(`4byte fetch failed on page ${page}: ${e.message}`)
      networkOk = false
      break
    }
    for (const row of json.results || []) {
      const sel = (row.hex_signature || '').replace(/^0x/i, '').toLowerCase()
      const sig = row.text_signature || ''
      const id = row.id
      if (!/^[0-9a-f]{8}$/.test(sel) || !sig) continue
      let bucket = sigsBySelector.get(sel)
      if (!bucket) {
        bucket = new Map()
        sigsBySelector.set(sel, bucket)
      }
      const prevId = bucket.get(sig)
      if (prevId === undefined || id < prevId) bucket.set(sig, id)
    }
    if (!json.next) break
    page++
    if (page % 100 === 0) console.log(`  fetched ${page} pages, ${sigsBySelector.size} unique selectors`)
  }
  return { sigsBySelector, networkOk }
}

function loadSeed() {
  const out = new Map()
  if (!fs.existsSync(SEED)) return out
  const arr = JSON.parse(fs.readFileSync(SEED, 'utf8'))
  for (let i = 0; i < arr.length; i++) {
    const sel = (arr[i].selector || '').replace(/^0x/i, '').toLowerCase()
    if (!/^[0-9a-f]{8}$/.test(sel) || !arr[i].signature) continue
    let bucket = out.get(sel)
    if (!bucket) {
      bucket = new Map()
      out.set(sel, bucket)
    }
    if (!bucket.has(arr[i].signature)) bucket.set(arr[i].signature, i)
  }
  return out
}

function mergeBuckets(primary, fallback) {
  for (const [sel, bucket] of fallback) {
    if (!primary.has(sel)) primary.set(sel, new Map(bucket))
  }
  return primary
}

/**
 * Per selector: pick the signature with the lowest id (oldest), and record
 * how many distinct signatures we saw for that selector.
 */
function chooseOldest(sigsBySelector) {
  const result = new Map()
  for (const [sel, bucket] of sigsBySelector) {
    let bestSig = null
    let bestId = Infinity
    for (const [sig, id] of bucket) {
      if (id < bestId) {
        bestId = id
        bestSig = sig
      }
    }
    if (bestSig !== null) {
      result.set(sel, { signature: bestSig, collisions: Math.min(bucket.size, 0xffff) })
    }
  }
  return result
}

function writeBinary(map) {
  const entries = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const count = entries.length
  const blobChunks = []
  const offsets = []
  let blobLen = 0
  for (const [, v] of entries) {
    const sigBytes = Buffer.from(v.signature, 'utf8')
    if (sigBytes.length > 0xffff) continue
    offsets.push(blobLen)
    const header = Buffer.alloc(4)
    header.writeUInt16LE(v.collisions, 0)
    header.writeUInt16LE(sigBytes.length, 2)
    blobChunks.push(header, sigBytes)
    blobLen += 4 + sigBytes.length
  }
  const header = Buffer.alloc(12)
  header.write('A4BY', 0, 4, 'ascii')
  header.writeUInt32LE(FORMAT_VERSION, 4)
  header.writeUInt32LE(count, 8)
  const index = Buffer.alloc(count * 8)
  for (let i = 0; i < count; i++) {
    const sel = entries[i][0]
    index.writeUInt8(parseInt(sel.slice(0, 2), 16), i * 8 + 0)
    index.writeUInt8(parseInt(sel.slice(2, 4), 16), i * 8 + 1)
    index.writeUInt8(parseInt(sel.slice(4, 6), 16), i * 8 + 2)
    index.writeUInt8(parseInt(sel.slice(6, 8), 16), i * 8 + 3)
    index.writeUInt32LE(offsets[i], i * 8 + 4)
  }
  return Buffer.concat([header, index, ...blobChunks])
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function checkLock(hash, count, source) {
  if (!fs.existsSync(LOCK)) return { ok: !VERIFY, reason: 'no lock file' }
  const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'))
  if (lock.sha256 !== hash) return { ok: false, reason: `sha256 mismatch (expected ${lock.sha256}, got ${hash})` }
  if (lock.count !== count) return { ok: false, reason: `count mismatch (expected ${lock.count}, got ${count})` }
  if (lock.source !== source) return { ok: false, reason: `source mismatch (expected ${lock.source}, got ${source})` }
  return { ok: true }
}

function writeLock(hash, count, source) {
  fs.writeFileSync(
    LOCK,
    JSON.stringify({ sha256: hash, count, source, formatVersion: FORMAT_VERSION }, null, 2) + '\n'
  )
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let primary = new Map()
  let networkOk = true
  let sourceLabel = 'seed'
  if (SOURCE === 'auto' || SOURCE === '4byte') {
    console.log('fetching 4byte.directory…')
    try {
      const res = await fetchFourByte()
      primary = res.sigsBySelector
      networkOk = res.networkOk
      sourceLabel = networkOk ? '4byte' : '4byte-partial'
    } catch (e) {
      console.warn('4byte fetch error:', e.message)
      networkOk = false
      sourceLabel = '4byte-failed'
    }
  }
  const seed = loadSeed()
  const merged = mergeBuckets(primary, seed)
  const chosen = chooseOldest(merged)

  if (chosen.size === 0) {
    console.warn('WARN: no signatures collected, writing empty DB')
    if (FAIL_IF_EMPTY) {
      console.error('ERROR: SIGDB_FAIL_IF_EMPTY set and DB is empty')
      process.exit(2)
    }
  }
  if (sourceLabel.startsWith('4byte-') && !networkOk) {
    console.warn(`WARN: 4byte fetch was incomplete (${sourceLabel}). DB may be missing entries.`)
  }

  const buf = writeBinary(chosen)
  fs.writeFileSync(OUT_DB, buf)
  const hash = sha256(buf)
  const meta = {
    generatedAt: new Date().toISOString(),
    sourcifyExportDate: new Date().toISOString().slice(0, 10),
    totalSignatures: chosen.size,
    schemaVersion: FORMAT_VERSION,
    source: sourceLabel,
    sha256: hash
  }
  fs.writeFileSync(OUT_META, JSON.stringify(meta, null, 2) + '\n')

  console.log('---')
  console.log('source        :', sourceLabel)
  console.log('entries       :', chosen.size)
  console.log('size          :', (buf.length / 1024 / 1024).toFixed(2), 'MB')
  console.log('sha256        :', hash)
  console.log('output        :', OUT_DB)

  if (UPDATE_LOCK) {
    writeLock(hash, chosen.size, sourceLabel)
    console.log('lock updated  :', LOCK)
  } else if (VERIFY) {
    const r = checkLock(hash, chosen.size, sourceLabel)
    if (!r.ok) {
      console.error('VERIFY FAILED:', r.reason)
      process.exit(3)
    }
    console.log('lock verified : ok')
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
