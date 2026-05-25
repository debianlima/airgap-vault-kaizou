#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Build a flat binary signature DB for offline lookup.
 *
 * Sources, in order of preference:
 *   1. 4byte.directory CSV/JSON dump (smaller, ~1.4M entries)
 *   2. A seed file at scripts/signatures.seed.json (hand-maintained well-known set)
 *
 * Strategy:
 *   - Network fetch is best-effort. If it fails (no internet, sandboxed build),
 *     we fall back to the seed file. Build never fails.
 *   - Oldest-first dedup: lowest id wins per selector.
 *
 * Output:
 *   src/assets/evm/signatures.db
 *   src/assets/evm/signatures.meta.json
 *
 * File format documented in signature-database.service.ts.
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'evm')
const OUT_DB = path.join(OUT_DIR, 'signatures.db')
const OUT_META = path.join(OUT_DIR, 'signatures.meta.json')
const SEED = path.join(__dirname, 'signatures.seed.json')

const FOURBYTE_API = 'https://www.4byte.directory/api/v1/signatures/?format=json&page='
const MAX_PAGES = parseInt(process.env.SIGDB_MAX_PAGES || '0', 10)
const SOURCE = process.env.SIGDB_SOURCE || 'auto'

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

async function fetchFourByte() {
  const result = new Map()
  let page = 1
  while (true) {
    if (MAX_PAGES > 0 && page > MAX_PAGES) break
    let json
    try {
      json = await httpJson(FOURBYTE_API + page)
    } catch (e) {
      console.warn(`4byte fetch failed on page ${page}: ${e.message}`)
      break
    }
    for (const row of json.results || []) {
      const sel = (row.hex_signature || '').replace(/^0x/i, '').toLowerCase()
      const sig = row.text_signature || ''
      const id = row.id
      if (!/^[0-9a-f]{8}$/.test(sel) || !sig) continue
      const prev = result.get(sel)
      if (!prev || id < prev.id) result.set(sel, { id, signature: sig })
    }
    if (!json.next) break
    page++
    if (page % 100 === 0) console.log(`  fetched ${page} pages, ${result.size} unique selectors`)
  }
  return result
}

function loadSeed() {
  if (!fs.existsSync(SEED)) return new Map()
  const arr = JSON.parse(fs.readFileSync(SEED, 'utf8'))
  const m = new Map()
  for (let i = 0; i < arr.length; i++) {
    const sel = (arr[i].selector || '').replace(/^0x/i, '').toLowerCase()
    if (!/^[0-9a-f]{8}$/.test(sel) || !arr[i].signature) continue
    if (!m.has(sel)) m.set(sel, { id: i, signature: arr[i].signature })
  }
  return m
}

function mergeOldestFirst(primary, fallback) {
  for (const [sel, val] of fallback) if (!primary.has(sel)) primary.set(sel, val)
  return primary
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
    const lenBuf = Buffer.alloc(2)
    lenBuf.writeUInt16LE(sigBytes.length, 0)
    blobChunks.push(lenBuf, sigBytes)
    blobLen += 2 + sigBytes.length
  }
  const header = Buffer.alloc(12)
  header.write('A4BY', 0, 4, 'ascii')
  header.writeUInt32LE(1, 4)
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let primary = new Map()
  if (SOURCE === 'auto' || SOURCE === '4byte') {
    console.log('fetching 4byte.directory…')
    try {
      primary = await fetchFourByte()
    } catch (e) {
      console.warn('4byte fetch error:', e.message)
    }
  }
  const seed = loadSeed()
  const merged = mergeOldestFirst(primary, seed)
  if (merged.size === 0) {
    console.warn('no signatures collected, writing empty DB')
  }
  console.log(`writing ${merged.size} entries to ${OUT_DB}`)
  const buf = writeBinary(merged)
  fs.writeFileSync(OUT_DB, buf)
  const meta = {
    generatedAt: new Date().toISOString(),
    sourcifyExportDate: new Date().toISOString().slice(0, 10),
    totalSignatures: merged.size,
    schemaVersion: 1
  }
  fs.writeFileSync(OUT_META, JSON.stringify(meta, null, 2) + '\n')
  console.log('done.', (buf.length / 1024 / 1024).toFixed(2), 'MB')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
