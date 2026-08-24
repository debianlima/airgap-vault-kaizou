#!/usr/bin/env node
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const vm = require('vm')
const { performance } = require('perf_hooks')
const nacl = require('tweetnacl')
const {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  StakeProgram,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} = require('/home/anderson/airgap-solana-work/airgap-solana-module/node_modules/@solana/web3.js')

const EXPECTED_MODULE_BUNDLE_SHA256 = '6b0e7f6c19af23d4594d4c4413974afaeaec01dcabca6b80bb3b4a1251b491d7'
const MODULE_BUNDLE = '/home/anderson/airgap-solana-work/airgap-solana-module/dist/airgap-solana-module.bundle.js'
const WALLET_ADAPTER_SOURCE = '/home/anderson/.cache/wallet-adapter-source-oracle'
const WALLET_ADAPTER_COMMIT = 'ca731858affa36fa91b593cc670747b671c4589f'
const TOKEN_SWAP_V3 = new PublicKey('SwapsVeCiPHMUAtzQWZw7RjsKjgCjhwU55QGu4U1Szw')
const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const BLOCKHASH_A = '11111111111111111111111111111111'
const BLOCKHASH_B = Keypair.fromSeed(Uint8Array.from({ length: 32 }, (_, i) => i + 101)).publicKey.toBase58()

function parseArgs(argv) {
  const out = { repetitions: 6, minCases: 30, log: 'logs/U18-2026-08-24-solana-signing-simulation.log' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--repetitions') out.repetitions = Number(argv[++i])
    else if (arg === '--min-cases') out.minCases = Number(argv[++i])
    else if (arg === '--log') out.log = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!Number.isInteger(out.repetitions) || out.repetitions < 6) throw new Error('--repetitions must be >= 6 (warmup + five measured runs)')
  if (!Number.isInteger(out.minCases) || out.minCases < 30) throw new Error('--min-cases must be >= 30')
  return out
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function loadModuleBundle() {
  const code = fs.readFileSync(MODULE_BUNDLE)
  const digest = sha256(code)
  if (digest !== EXPECTED_MODULE_BUNDLE_SHA256) throw new Error(`Module bundle hash mismatch: ${digest}`)
  const context = { console, Buffer, Uint8Array, TextEncoder, TextDecoder, setTimeout, clearTimeout }
  vm.createContext(context)
  vm.runInContext(code.toString('utf8'), context, { timeout: 15000, filename: MODULE_BUNDLE })
  if (!context.airgapSolanaModule?.signSerializedSolanaTransaction) throw new Error('Published module signer export missing')
  return { module: context.airgapSolanaModule, digest }
}

function deterministicKey(n) {
  const seed = Uint8Array.from({ length: 32 }, (_, i) => (n * 29 + i * 17 + 11) & 0xff)
  return Keypair.fromSeed(seed)
}

function signerKeys(message) {
  const keys = message.staticAccountKeys ?? message.accountKeys
  return keys.slice(0, message.header.numRequiredSignatures)
}

function signerIndex(transaction, signer) {
  return signerKeys(transaction.message).findIndex((key) => key.equals(signer.publicKey))
}

function isZeroSignature(signature) {
  return signature.every((byte) => byte === 0)
}

function verifySignature(signature, messageBytes, publicKey) {
  return nacl.sign.detached.verify(new Uint8Array(messageBytes), new Uint8Array(signature), new Uint8Array(publicKey.toBytes()))
}

function v0(payer, instructions, lookupTables = []) {
  const message = new TransactionMessage({ payerKey: payer.publicKey, recentBlockhash: BLOCKHASH_A, instructions }).compileToV0Message(lookupTables)
  return new VersionedTransaction(message)
}

function legacy(payer, instructions) {
  const message = new TransactionMessage({ payerKey: payer.publicKey, recentBlockhash: BLOCKHASH_A, instructions }).compileToLegacyMessage()
  return new VersionedTransaction(message)
}

function customInstruction(programId, keys, data = Buffer.alloc(0)) {
  return new TransactionInstruction({ programId, keys, data })
}

function signerMeta(kp, writable = true) {
  return { pubkey: kp.publicKey, isSigner: true, isWritable: writable }
}

function nonsignerMeta(pubkey, writable = false) {
  return { pubkey, isSigner: false, isWritable: writable }
}

function moduleRaw(transaction) {
  return Buffer.from(transaction.serialize())
}

function lut(keySeed, authority, addresses) {
  return new AddressLookupTableAccount({
    key: deterministicKey(keySeed).publicKey,
    state: {
      deactivationSlot: BigInt('18446744073709551615'),
      lastExtendedSlot: 0,
      lastExtendedSlotStartIndex: 0,
      authority: authority.publicKey,
      addresses
    }
  })
}

function transferInstruction(from, to, lamports) {
  return SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to.publicKey, lamports })
}

function tokenSwapDepositInstruction(signer) {
  return customInstruction(TOKEN_SWAP_V3, [signerMeta(signer)], Buffer.concat([Buffer.from([2]), Buffer.alloc(24)]))
}

function memoInstruction(text, keys = []) {
  return customInstruction(MEMO_PROGRAM, keys, Buffer.from(text, 'utf8'))
}

function multisigInstruction(programId, signers, extra = []) {
  return customInstruction(programId, [...signers.map((s) => signerMeta(s)), ...extra], Buffer.from([7, 3, 9]))
}

function makeAccept(name, source, build, options = {}) {
  return { name, source, expected: 'accept', build, ...options }
}

function makeReject(name, source, build, expectedError) {
  return { name, source, expected: 'reject', build, expectedError }
}

const keys = Array.from({ length: 100 }, (_, i) => deterministicKey(i + 1))
const P = keys[0]
const A = keys[1]
const B = keys[2]
const C = keys[3]
const D = keys[4]
const CUSTOM = keys[90].publicKey

function baseTransferTx(kind = 'v0', lamports = 1) {
  const tx = (kind === 'legacy' ? legacy : v0)(P, [transferInstruction(P, A, lamports)])
  return { tx, signer: P }
}

function twoSignerTx({ kind = 'v0', local = B, payer = P, preSign = [] } = {}) {
  const ix = multisigInstruction(CUSTOM, [payer, local])
  const tx = (kind === 'legacy' ? legacy : v0)(payer, [ix])
  if (preSign.length) tx.sign(preSign)
  return { tx, signer: local }
}

function manySignerTx(count) {
  const signers = keys.slice(10, 10 + count)
  const local = signers[signers.length - 1]
  const ix = multisigInstruction(CUSTOM, signers)
  const tx = v0(signers[0], [ix])
  tx.sign(signers.slice(0, -1))
  return { tx, signer: local }
}

function altCase(writable, many = false) {
  const addresses = (many ? keys.slice(30, 60) : [A, B, C]).map((k) => k.publicKey)
  const table = lut(89, P, addresses)
  const metas = addresses.map((pubkey, i) => nonsignerMeta(pubkey, writable && i % 2 === 0))
  const tx = v0(P, [customInstruction(CUSTOM, [signerMeta(P), ...metas], Buffer.from([4, 4, 4]))], [table])
  return { tx, signer: P }
}

function staticAccountCase(count) {
  const extras = keys.slice(20, 20 + count).map((k, i) => nonsignerMeta(k.publicKey, i % 3 === 0))
  const tx = v0(P, [customInstruction(CUSTOM, [signerMeta(P), ...extras], Buffer.from([1]))])
  return { tx, signer: P }
}

function durableNonceCase(computeBefore = false, computeAfter = false) {
  const noncePubkey = keys[70].publicKey
  const nonceIx = SystemProgram.nonceAdvance({ noncePubkey, authorizedPubkey: P.publicKey })
  const compute = ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 })
  const instructions = []
  if (computeBefore) instructions.push(compute)
  instructions.push(nonceIx)
  if (computeAfter) instructions.push(compute)
  instructions.push(transferInstruction(P, A, 5))
  const tx = v0(P, instructions)
  return { tx, signer: P }
}

function createAccountCase(kind = 'v0', local = B) {
  const ix = SystemProgram.createAccount({ fromPubkey: P.publicKey, newAccountPubkey: local.publicKey, lamports: 1, space: 0, programId: SystemProgram.programId })
  const tx = (kind === 'legacy' ? legacy : v0)(P, [ix])
  tx.sign([P])
  return { tx, signer: local }
}

const cases = [
  makeAccept('v0-system-transfer-1', 'official+wallet-adapter', () => baseTransferTx('v0', 1), { verification: 'verified-transfer' }),
  makeAccept('v0-system-transfer-zero', 'official', () => baseTransferTx('v0', 0), { verification: 'verified-transfer' }),
  makeAccept('v0-system-transfer-max-safe-int', 'official', () => baseTransferTx('v0', Number.MAX_SAFE_INTEGER), { verification: 'verified-transfer' }),
  makeAccept('legacy-system-transfer', 'official+wallet-adapter', () => baseTransferTx('legacy', 7), { verification: 'verified-transfer' }),
  makeAccept('v0-compute-limit-transfer', 'forum-priority-fee', () => ({ tx: v0(P, [ComputeBudgetProgram.setComputeUnitLimit({ units: 180000 }), transferInstruction(P, A, 8)]), signer: P })),
  makeAccept('v0-compute-price-transfer', 'forum-priority-fee', () => ({ tx: v0(P, [ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }), transferInstruction(P, A, 9)]), signer: P })),
  makeAccept('v0-compute-both-transfer', 'forum-priority-fee', () => ({ tx: v0(P, [ComputeBudgetProgram.setComputeUnitLimit({ units: 180000 }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 2 }), transferInstruction(P, A, 10)]), signer: P })),
  makeAccept('v0-memo-empty', 'forum-phantom-rpc', () => ({ tx: v0(P, [memoInstruction('')]), signer: P })),
  makeAccept('v0-memo-text', 'forum-phantom-rpc', () => ({ tx: v0(P, [memoInstruction('hello deterministic wallet')]), signer: P })),
  makeAccept('legacy-memo-text', 'forum-phantom-rpc', () => ({ tx: legacy(P, [memoInstruction('legacy')]), signer: P })),
  makeAccept('v0-stake-deactivate', 'project+official', () => ({ tx: v0(P, [ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }), StakeProgram.deactivate({ stakePubkey: A.publicKey, authorizedPubkey: P.publicKey }).instructions[0]]), signer: P }), { verification: 'verified-stake' }),
  makeAccept('v0-stake-withdraw', 'project+official', () => ({ tx: v0(P, [StakeProgram.withdraw({ stakePubkey: A.publicKey, authorizedPubkey: P.publicKey, toPubkey: B.publicKey, lamports: 1234 }).instructions[0]]), signer: P }), { verification: 'verified-stake' }),
  makeAccept('v0-token-swap-v3-deposit', 'project+pancake-raydium-source-to-wire', () => ({ tx: v0(P, [tokenSwapDepositInstruction(P)]), signer: P }), { verification: 'keystone-classified' }),
  makeAccept('v0-custom-program-small', 'official-unknown-program-policy', () => ({ tx: v0(P, [customInstruction(CUSTOM, [signerMeta(P)], Buffer.from([1,2,3,4]))]), signer: P }), { verification: 'generic-solana' }),
  makeAccept('v0-custom-program-256-bytes', 'adversarial-size', () => ({ tx: v0(P, [customInstruction(CUSTOM, [signerMeta(P)], Buffer.alloc(256, 0x5a))]), signer: P }), { verification: 'generic-solana' }),
  makeAccept('v0-multisig-local-first-other-empty', 'forum-partial-sign', () => ({ tx: v0(P, [multisigInstruction(CUSTOM, [P, B])]), signer: P })),
  makeAccept('v0-multisig-local-second-other-empty', 'forum-partial-sign', () => twoSignerTx({ local: B, payer: P })),
  makeAccept('v0-multisig-local-second-other-presigned', 'forum-partial-sign', () => twoSignerTx({ local: B, payer: P, preSign: [P] }), { verifyExisting: true }),
  makeAccept('v0-multisig-local-first-other-presigned', 'forum-partial-sign', () => { const tx=v0(P,[multisigInstruction(CUSTOM,[P,B])]); tx.sign([B]); return {tx,signer:P} }, { verifyExisting: true }),
  makeAccept('legacy-multisig-local-second-other-presigned', 'forum-partial-sign', () => twoSignerTx({ kind: 'legacy', local: B, payer: P, preSign: [P] }), { verifyExisting: true }),
  makeAccept('v0-alt-readonly', 'forum-alt-resolution', () => altCase(false, false), { verification: 'keystone-classified' }),
  makeAccept('v0-alt-writable', 'forum-alt-resolution', () => altCase(true, false), { verification: 'keystone-classified' }),
  makeAccept('v0-alt-30-loaded-addresses', 'forum-alt-resolution', () => altCase(false, true), { verification: 'keystone-classified' }),
  makeAccept('v0-alt-signer-remains-static', 'official-alt-signer-rule', () => { const table=lut(88,P,[B.publicKey,C.publicKey]); const tx=v0(P,[customInstruction(CUSTOM,[signerMeta(P),signerMeta(B),nonsignerMeta(C.publicKey)],Buffer.from([8]))],[table]); tx.sign([P]); return {tx,signer:B} }, { verifyExisting: true, assertSignerStatic: true }),
  makeAccept('v0-durable-nonce-first', 'forum-blockhash-nonce', () => durableNonceCase(false, false)),
  makeAccept('v0-durable-nonce-compute-after', 'forum-blockhash-nonce', () => durableNonceCase(false, true)),
  makeAccept('v0-compute-before-durable-nonce-structurally-signable', 'forum-blockhash-nonce', () => durableNonceCase(true, false), { note: 'signable bytes; network nonce semantics may reject ordering' }),
  makeAccept('v0-duplicate-account-meta-dedup', 'adversarial-account-order', () => ({ tx: v0(P, [customInstruction(CUSTOM,[signerMeta(P),nonsignerMeta(A.publicKey),nonsignerMeta(A.publicKey),nonsignerMeta(B.publicKey)],Buffer.from([1]))]), signer:P })),
  makeAccept('v0-32-static-extra-accounts', 'official-account-index-limit', () => staticAccountCase(32)),
  makeAccept('v0-10-required-signers-local-last', 'forum-multisigner', () => manySignerTx(10), { verifyExisting: true }),
  makeAccept('v0-already-local-signed-idempotent', 'adversarial-idempotence', () => { const {tx,signer}=baseTransferTx('v0',11); tx.sign([signer]); return {tx,signer} }),
  makeAccept('v0-stale-cosig-after-blockhash-mutation', 'forum-blockhash-mutation', () => { const {tx,signer}=twoSignerTx({local:B,payer:P,preSign:[P]}); tx.message.recentBlockhash=BLOCKHASH_B; return {tx,signer} }, { expectedInvalidExisting: 1, note: 'signer preserves stale co-signature; external verifier detects it' }),
  makeAccept('v0-stale-cosig-after-instruction-mutation', 'forum-signature-verification', () => { const {tx,signer}=twoSignerTx({local:B,payer:P,preSign:[P]}); const d=tx.message.compiledInstructions[0].data; d[0]^=0x01; return {tx,signer} }, { expectedInvalidExisting: 1, note: 'message mutation invalidates prior signature by design' }),
  makeAccept('v0-compute-plus-token-swap-v3', 'pancake-raydium-source-to-wire', () => ({ tx: v0(P,[ComputeBudgetProgram.setComputeUnitLimit({units:220000}),ComputeBudgetProgram.setComputeUnitPrice({microLamports:3}),tokenSwapDepositInstruction(P)]), signer:P }), { verification:'keystone-classified' }),
  makeAccept('v0-create-account-local-second', 'forum-missing-signer', () => createAccountCase('v0',B), { verifyExisting:true }),
  makeAccept('legacy-create-account-local-second', 'forum-missing-signer', () => createAccountCase('legacy',B), { verifyExisting:true }),
  makeAccept('v0-nonce-authority-local-second', 'forum-blockhash-nonce', () => { const payer=P, authority=B; const ix=SystemProgram.nonceAdvance({noncePubkey:C.publicKey,authorizedPubkey:authority.publicKey}); const tx=v0(payer,[ix]); tx.sign([payer]); return {tx,signer:authority} }, { verifyExisting:true }),
  makeAccept('v0-readonly-account-pressure', 'official-account-index-limit', () => staticAccountCase(45)),
  makeReject('reject-wrong-signer-key', 'forum-missing-signer', () => { const {tx}=baseTransferTx('v0',1); return { raw:moduleRaw(tx), signer:C } }, /non signer|signer/i),
  makeReject('reject-truncated-transaction', 'adversarial-malformed', () => { const {tx,signer}=baseTransferTx('v0',1); const raw=moduleRaw(tx); return {raw:raw.subarray(0,Math.max(1,raw.length-17)),signer} }, /deserialize|signature|length|offset|unexpected|reach|buffer|byte|read/i),
  makeReject('reject-random-bytes', 'adversarial-malformed', () => ({raw:Buffer.from('00112233445566778899aabbccddeeff','hex'),signer:P}), /deserialize|signature|length|offset|unexpected|reach|buffer|byte|read/i),
  makeReject('reject-empty-bytes', 'adversarial-malformed', () => ({raw:Buffer.alloc(0),signer:P}), /deserialize|signature|length|offset|unexpected|reach|buffer|byte|read/i),
  makeReject('reject-message-only-v0', 'solflare-message-envelope-boundary', () => { const {tx,signer}=baseTransferTx('v0',1); return {raw:Buffer.from(tx.message.serialize()),signer} }, /deserialize|signature|length|offset|unexpected|reach|buffer|byte|read/i),
  makeReject('reject-31-byte-secret-seed', 'module-contract', () => { const {tx}=baseTransferTx('v0',1); return {raw:moduleRaw(tx),signer:P,secretOverride:Buffer.alloc(31,1)} }, /32-byte/i),
  makeReject('reject-33-byte-secret-seed', 'module-contract', () => { const {tx}=baseTransferTx('v0',1); return {raw:moduleRaw(tx),signer:P,secretOverride:Buffer.alloc(33,1)} }, /32-byte/i),
  makeReject('reject-unsupported-message-version', 'adversarial-malformed-version', () => { const {tx,signer}=baseTransferTx('v0',1); const raw=moduleRaw(tx); const sigCount=raw[0]; const messageOffset=1+sigCount*64; raw[messageOffset]=0x82; return {raw,signer} }, /version|deserialize|unsupported|message/i),
  makeReject('reject-corrupt-signature-count', 'adversarial-malformed-signatures', () => { const {tx,signer}=baseTransferTx('v0',1); const raw=moduleRaw(tx); raw[0]=0; return {raw,signer} }, /deserialize|signature|version|length|offset|unexpected|message/i)
]

function median(values) {
  const xs=[...values].sort((a,b)=>a-b); const n=xs.length
  return n%2 ? xs[(n-1)/2] : (xs[n/2-1]+xs[n/2])/2
}

function mad(values) {
  const m=median(values); return median(values.map((x)=>Math.abs(x-m)))
}

async function classify(protocol, raw, signer) {
  const pk={type:'pub',value:Buffer.from(signer.publicKey.toBytes()).toString('hex'),format:'hex'}
  const details=await protocol.getDetailsFromTransaction({transaction:raw.toString('base64'),encoding:'base64'},pk)
  return details?.[0]?.extra?.verification
}

async function executeAccept(mod, protocol, testCase) {
  const built=testCase.build()
  const tx=built.tx
  const signer=built.signer
  const raw=moduleRaw(tx)
  const before=VersionedTransaction.deserialize(raw)
  const msgBefore=Buffer.from(before.message.serialize())
  const idx=signerIndex(before,signer)
  if(idx<0) throw new Error('fixture signer is not a required signer')
  const pre=before.signatures.map((s)=>Buffer.from(s))
  const preKeys=signerKeys(before.message)
  let invalidExisting=0
  for(let i=0;i<pre.length;i++){
    if(i===idx||isZeroSignature(pre[i])) continue
    if(!verifySignature(pre[i],msgBefore,preKeys[i])) invalidExisting++
  }
  if((testCase.expectedInvalidExisting??0)!==invalidExisting) throw new Error(`expected ${testCase.expectedInvalidExisting??0} invalid existing signatures, saw ${invalidExisting}`)
  if(testCase.verifyExisting && invalidExisting!==0) throw new Error('pre-existing signature is invalid before module signing')
  if(testCase.assertSignerStatic){
    const staticKeys=before.message.staticAccountKeys
    if(!staticKeys||!staticKeys.some((k)=>k.equals(signer.publicKey))) throw new Error('required signer was loaded via ALT or missing from static keys')
  }
  const secret=built.secretOverride??Buffer.from(signer.secretKey.slice(0,32))
  const t0=performance.now()
  const out=Buffer.from(mod.signSerializedSolanaTransaction(raw,secret))
  const signed=VersionedTransaction.deserialize(out)
  const msgAfter=Buffer.from(signed.message.serialize())
  if(!msgAfter.equals(msgBefore)) throw new Error('message bytes mutated by signer')
  const afterIdx=signerIndex(signed,signer)
  if(afterIdx!==idx) throw new Error(`signer slot moved ${idx}->${afterIdx}`)
  const localSig=Buffer.from(signed.signatures[idx])
  if(isZeroSignature(localSig)) throw new Error('local signature slot remained empty')
  if(!verifySignature(localSig,msgAfter,signer.publicKey)) throw new Error('independent Ed25519 verification failed')
  for(let i=0;i<signed.signatures.length;i++){
    if(i===idx) continue
    if(!Buffer.from(signed.signatures[i]).equals(pre[i])) throw new Error(`non-local signature slot ${i} mutated`)
  }
  if(testCase.verification){
    const observed=await classify(protocol,raw,signer)
    if(observed!==testCase.verification) throw new Error(`classification ${observed} != ${testCase.verification}`)
  }
  const elapsed=performance.now()-t0
  return { elapsed, bytes:raw.length, signerSlot:idx, requiredSigners:pre.length, invalidExisting }
}

async function executeReject(mod,testCase){
  const built=testCase.build()
  const raw=built.raw??moduleRaw(built.tx)
  const signer=built.signer
  const secret=built.secretOverride??Buffer.from(signer.secretKey.slice(0,32))
  const t0=performance.now()
  let error
  try{ mod.signSerializedSolanaTransaction(raw,secret) }catch(e){ error=e }
  const elapsed=performance.now()-t0
  if(!error) throw new Error('unexpected acceptance')
  const text=String(error?.message??error)
  if(testCase.expectedError&&!testCase.expectedError.test(text)) throw new Error(`rejected with unexpected error: ${text}`)
  return {elapsed,bytes:raw.length,error:text}
}

async function main(){
  const args=parseArgs(process.argv.slice(2))
  if(cases.length<args.minCases) throw new Error(`case count ${cases.length}<${args.minCases}`)
  const {module:mod,digest}=loadModuleBundle()
  const protocol=new mod.SolanaOfflineProtocol()
  let walletAdapterCommit='missing'
  try{walletAdapterCommit=require('child_process').execFileSync('git',['-C',WALLET_ADAPTER_SOURCE,'rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}
  if(walletAdapterCommit!==WALLET_ADAPTER_COMMIT) throw new Error(`wallet-adapter source oracle commit ${walletAdapterCommit} != ${WALLET_ADAPTER_COMMIT}`)
  const web3Version=require('/home/anderson/airgap-solana-work/airgap-solana-module/node_modules/@solana/web3.js/package.json').version
  const header={
    simulation:'U18-solana-signing-matrix',startedAt:new Date().toISOString(),node:process.version,platform:`${os.platform()} ${os.release()} ${os.arch()}`,
    moduleBundle:MODULE_BUNDLE,moduleBundleSha256:digest,web3Version,walletAdapterCommit,
    repetitions:args.repetitions,warmupDiscarded:1,measuredRepetitions:args.repetitions-1,caseCount:cases.length,
    thresholds:{semanticPassRate:1,unexpectedMutationCount:0,unexpectedAcceptanceCount:0,unexpectedRejectionCount:0},
    sources:['solana-official-transaction-rules','anza-wallet-adapter-ca731858','solana-stackexchange-failure-shapes'],
    note:'No RPC submission; all keys/blockhashes/transactions are deterministic synthetic fixtures. Forum code and third-party account data are not copied.'
  }
  const results=[]
  let passed=0
  let failed=0
  for(const testCase of cases){
    const timings=[]
    const runDetails=[]
    let caseError
    for(let r=0;r<args.repetitions;r++){
      try{
        const detail=testCase.expected==='accept'?await executeAccept(mod,protocol,testCase):await executeReject(mod,testCase)
        runDetails.push(detail)
        if(r>0)timings.push(detail.elapsed)
      }catch(e){caseError=String(e?.stack??e);break}
    }
    const ok=!caseError
    if(ok)passed++;else failed++
    results.push({name:testCase.name,source:testCase.source,expected:testCase.expected,ok,note:testCase.note??null,medianLatencyMs:timings.length?Number(median(timings).toFixed(4)):null,madLatencyMs:timings.length?Number(mad(timings).toFixed(4)):null,bytes:runDetails[0]?.bytes??null,signerSlot:runDetails[0]?.signerSlot??null,requiredSigners:runDetails[0]?.requiredSigners??null,invalidExisting:runDetails[0]?.invalidExisting??null,error:caseError??null})
    process.stdout.write(`${ok?'PASS':'FAIL'} ${testCase.name}${caseError?` :: ${caseError.split('\n')[0]}`:''}\n`)
  }
  const semanticPassRate=passed/cases.length
  const measuredMedians=results.filter((r)=>r.ok&&r.medianLatencyMs!==null).map((r)=>r.medianLatencyMs)
  const summary={finishedAt:new Date().toISOString(),caseCount:cases.length,passCount:passed,failCount:failed,expectedRejectionCount:cases.filter((c)=>c.expected==='reject').length,semanticPassRate,medianCaseLatencyMs:measuredMedians.length?Number(median(measuredMedians).toFixed(4)):null,madCaseLatencyMs:measuredMedians.length?Number(mad(measuredMedians).toFixed(4)):null,status:failed===0&&semanticPassRate===1?'SIMULATION_PASS':'SIMULATION_FAIL'}
  const log=[JSON.stringify({type:'environment',...header}),...results.map((r)=>JSON.stringify({type:'case',...r})),JSON.stringify({type:'summary',...summary}),summary.status].join('\n')+'\n'
  fs.mkdirSync(path.dirname(args.log),{recursive:true});fs.writeFileSync(args.log,log)
  console.log(JSON.stringify(summary,null,2))
  console.log(`LOG ${args.log}`)
  if(summary.status!=='SIMULATION_PASS')process.exitCode=1
}

main().catch((error)=>{console.error(error);process.exit(2)})
