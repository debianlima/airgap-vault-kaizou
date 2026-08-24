#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const { performance } = require('perf_hooks')
const { UR, URDecoder, UREncoder } = require('@ngraveio/bc-ur')
const bytewords = require('@ngraveio/bc-ur/dist/bytewords').default
const { FountainEncoderPart } = require('@ngraveio/bc-ur/dist/fountainEncoder')
const { SolSignRequest, SignType } = require('@keystonehq/bc-ur-registry-sol')

const UR_PREFIX = 'ur:sol-sign-request/'
const FP = Buffer.from('73c5da0a', 'hex')
const DERIVATION = "44'/501'/0'/0'"

// Snapshot of the deterministic synthetic transaction bank already exercised in U21/U22.
// No real user's Solflare capture or account payload is embedded here.
const BANK_SPECS = [
  {
    name: 'controlled-message',
    requestId: '550e8400-e29b-41d4-a716-446655440000',
    messageBase64: 'gAIAAALwNidiRqdbneM0ntQrFeIy9lGPwg9fzU8dZOgfm9JY9yIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkAAA=='
  },
  {
    name: 'stake-deactivate',
    requestId: '11111111-2222-4333-8444-555555555555',
    messageBase64: 'gAEAAwXwNidiRqdbneM0ntQrFeIy9lGPwg9fzU8dZOgfm9JY9yxgRsaemtl9gsCsyA72dVVVv4hBzcDrUJNZOGV5GMBRAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAGodgXkTdUKpg0N73+KnqyVX9TXIp4citopJ3AAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAACQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkCAgAFAkANAwADAwEEAAQFAAAAAA=='
  },
  {
    name: 'tokenswap-v3',
    requestId: '22222222-3333-4444-8555-666666666666',
    messageBase64: 'gAEAAwXwNidiRqdbneM0ntQrFeIy9lGPwg9fzU8dZOgfm9JY9xo4A0Pr9BrsSRogmEt3sM9EV5fejW2mV0+lBKRyTkAJAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAGpTzWLYyWiFVMo4T68pU7hQT/X3dWFcS5xreBv7SAtMs/LnWnD2Jn8xrS+ZxNtPll/cjuwpHgqKAwXqMkcrFyCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkCAgAFAmBbAwADAwABBBkCAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAA=='
  },
  {
    name: 'pancake-clmm-swap',
    requestId: '11111111-2222-4333-8444-555555555555',
    messageBase64: 'gAEACBPwNidiRqdbneM0ntQrFeIy9lGPwg9fzU8dZOgfm9JY9++6A9IoX48y5t6hf4nxGLKXO3VSS/Dn9P9eXE8x6jh7Nbf39O0Yw9pgIFtht84qJml/9m0I9tletpJkeZOVZ0u/oMjtoAri8+4r7yY155VTlFsJtfGaxLYRzrxx7KIXDW/t+Kjx2L1lUiAXTG6Cif2UJWNNtLqagcPNPhNmNdzr9IlBbqYS4Ar/nn3Bec8ySxRp7urc9PTh7hWtboVINJWP9PHjysSoGbkSFNL5xiYWhkMQ7zHHAHAGpyA6rkCh1XXxVJe46nKMCQTTwFgZKNa5XJ8XMit72LJFXBu23FZZqFsOMoVyD6lzoFBd9VdE73cmS0IW1EXaHryYq8H8+iMyI0C1X6M6FsPK8W19eXkGF5j5GEMPxH3glDL7gedOudSGkR+saItpeW8eQCJ8z6ACdb9rpqp62KDd2C21HK36AwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACl1cqeBM9dtZC3FLov4yyxWRM/wcGStyJX/QfTnLBAHr+geUURrF4qwWqLtZ2KALL6eXOgQi+IKDMqYfhkA2ndBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/AVKU1qZKSEGTSTocWDaOHx8NbXdvJK7geQfqEBBBUSNrGVfrXTJcO4fzQGInJP7l5DVmD00qAQRV7YTItxyjACGI/Xy0IUZOHjkA7+XSN8fzVcaDTZzPr98dbDGkT9vSAkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJAwsABQKg9wMACwAJAwMAAAAAAAAADBEADQECAwQFBg4PEBESBwgJCikrBO0LGskeYofWEgAAAAAAgE8SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQA='
  },
  {
    name: 'pancake-clmm-open-position',
    requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    messageBase64: 'gAIAChjwNidiRqdbneM0ntQrFeIy9lGPwg9fzU8dZOgfm9JY92dG8uDmzOIKervNnOURmLF6SRnJSAKgJw6BHmjORDvlC61v/wBgURsSiqN8hu/PLpAFJfC4JEDzTMXyG9zXI8yYygfsIBuCkodh0NDMAoXgtd2sdi54EC6is0Bc72G7Dnyt21f59+HrrqdwM3qI516k1cfNE7nirJ8/iFfcPAO1vurtPScnKwATWZd0ckiDvDoOS1jVJKw/2FzA1IAbLXcjiB/mIEM8uT+tdBd3EKpWFUSIhIsJ3Ik2ACNe9uWvYYMelS0IlAlBhFUrn0dNY/NJy6Y9CmCHcqHwwqLRf6xSOS3e2Fsbd5i27m9DLfC+lXqDWGWaf1z96+GvDMx0SxFRYP3ikOIGdRWinBMFmJD+16clQVfnTU9m1mDhHFnSSAmkdrZYbkLLXPW6pGL4Say0WOaZAdt0R2KcDVsdL/rZImzGMWoLI7JQy0ykNsbvM6Kp/xL/QnR8RlLaJ3g8W5cG1taGRnuKM5nV3FNXZfT5sRcL+Y/qqMVxFU2g09obIV+xw/Ly3OmZhdynbrumSp50T3+KgxXlRZQHj22QTXStAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACl1cqeBM9dtZC3FLov4yyxWRM/wcGStyJX/QfTnLBAHgan1RcZLFxRIYzJTD1K8X9Y2u4Im6H9ROPb2YoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZC3BlsePRfEU4nVJ/awTDzVi4bHMaoP21SbbRvAP4KUYG3fbh7nWP3hhCXbzkbM3athr8TYO5DSf+vfko2KGL/GadycTu5hEFllXeedEZwXMed8X8wJkj1iPeziA7u/NdI68WPu7Gv81A5cxhg8gLHW8l7EpPrt1I/g3a940XL80JCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQMOAAUCoGgGAA4ACQMFAAAAAAAAAA8XAAABAgMEBQYHCAkKCwwQERITFBUWFw07TbhK1nBW8ceI////eAAAAKj9//8AAAAAAAAAAAAAAAAAAAAAAAAAAKAlJgAAAAAAwMYtAAAAAAAAAQEA'
  }
]

function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex') }
function median(xs) { const a=[...xs].sort((x,y)=>x-y); const n=a.length; return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2 }
function mad(xs) { const m=median(xs); return median(xs.map(x=>Math.abs(x-m))) }
function parseArgs(argv) {
  const out={repetitions:6,minBanks:4,minScenarios:24,log:'logs/U23-2026-08-24-solflare-capture-resilience.log'}
  for(let i=0;i<argv.length;i++){
    const a=argv[i]
    if(a==='--repetitions')out.repetitions=Number(argv[++i])
    else if(a==='--min-banks')out.minBanks=Number(argv[++i])
    else if(a==='--min-scenarios')out.minScenarios=Number(argv[++i])
    else if(a==='--log')out.log=argv[++i]
    else throw new Error(`Unknown argument ${a}`)
  }
  if(out.repetitions<6)throw new Error('repetitions must be >=6')
  return out
}
function corrupt(frame, offset=1){ const i=Math.max(0,frame.length-offset); const c=frame[i]; const n=c==='A'?'B':'A'; return frame.slice(0,i)+n+frame.slice(i+1) }
function truncate(frame,n=9){ return frame.slice(0,Math.max(1,frame.length-n)) }
function tamperSequence(frame){ return frame.replace(/\/([0-9]+)-([0-9]+)\//,(_,a,b)=>`/${Number(a)+1}-${b}/`) }
function shuffleDeterministic(xs,seed){ const a=[...xs]; let s=seed>>>0; for(let i=a.length-1;i>0;i--){s=(s*1664525+1013904223)>>>0;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]]} return a }
function repeatEach(xs,n){ return xs.flatMap(x=>Array(n).fill(x)) }
function noise(n){ return Array.from({length:n},(_,i)=>i%2?`noise-${i}`:`ur:bytes/not-a-sol-request-${i}`) }

function makeBank(spec){
  const req=SolSignRequest.constructSOLRequest(Buffer.from(spec.messageBase64,'base64'),DERIVATION,FP,SignType.Message,spec.requestId)
  const ur=req.toUR()
  const targetHash=sha256(ur.cbor)
  function frames(multiplier=6){const e=req.toUREncoder(120);const count=e.fragmentsLength;const out=[];for(let i=0;i<count*multiplier;i++)out.push(e.nextPart().toUpperCase());return {frames:out,count}}
  const first=frames(1)
  return {...spec,request:req,targetHash,fragmentCount:first.count,firstCycle:first.frames,frames}
}
const banks=BANK_SPECS.map(makeBank)

function baselineDecode(sequence){
  const d=new URDecoder();let hash=null,exceptions=0,framesAccepted=0
  const t0=performance.now()
  for(const raw of sequence){
    if(typeof raw!=='string'||!raw.toLowerCase().startsWith(UR_PREFIX))continue
    try{const accepted=d.receivePart(raw);if(accepted)framesAccepted++;if(d.isComplete()&&d.isSuccess()){hash=sha256(d.resultUR().cbor);break}}catch{exceptions++}
  }
  return {hash,exceptions,framesAccepted,elapsed:performance.now()-t0}
}

class ResilientCollector{
  constructor({maxStreams=4,ttlFrames=64,settleFrames=4}={}){this.maxStreams=maxStreams;this.ttlFrames=ttlFrames;this.settleFrames=settleFrames;this.tick=0;this.streams=new Map();this.maxActive=0;this.invalid=0;this.noise=0;this.duplicates=0;this.evictions=0;this.exceptions=0}
  prune(){for(const [k,s] of this.streams){if(this.tick-s.lastSeen>this.ttlFrames)this.streams.delete(k)}}
  makeRoom(){if(this.streams.size<this.maxStreams)return;let oldest=null;for(const [k,s] of this.streams){if(!oldest||s.lastSeen<oldest[1].lastSeen)oldest=[k,s]}if(oldest){this.streams.delete(oldest[0]);this.evictions++}}
  parse(raw){
    if(typeof raw!=='string')throw new Error('non-string')
    const s=raw.trim().toLowerCase()
    if(!s.startsWith(UR_PREFIX))return {kind:'noise'}
    const [type,components]=URDecoder.parse(s)
    if(type!=='sol-sign-request')return {kind:'noise'}
    if(components.length===1)return {kind:'single',normalized:s,key:`single:${sha256(s)}`}
    if(components.length!==2)throw new Error('path length')
    const [seq,fragment]=components
    const [seqNum,seqLength]=URDecoder.parseSequenceComponent(seq)
    const cborHex=bytewords.decode(fragment,bytewords.STYLES.MINIMAL)
    const part=FountainEncoderPart.fromCBOR(Buffer.from(cborHex,'hex'))
    if(seqNum!==part.seqNum||seqLength!==part.seqLength)throw new Error('sequence mismatch')
    const key=`${type}:${part.seqLength}:${part.messageLength}:${part.checksum}`
    return {kind:'multipart',normalized:s,key}
  }
  accept(raw){
    this.tick++;this.prune()
    let p
    try{p=this.parse(raw)}catch{this.invalid++;return 'retryable-invalid'}
    if(p.kind==='noise'){this.noise++;return 'noise'}
    let st=this.streams.get(p.key)
    if(!st){this.makeRoom();st={decoder:new URDecoder(),seen:new Set(),lastSeen:this.tick,completeHash:null};this.streams.set(p.key,st)}
    st.lastSeen=this.tick
    if(st.seen.has(p.normalized)){this.duplicates++;return 'duplicate'}
    st.seen.add(p.normalized);if(st.seen.size>256)st.seen.delete(st.seen.values().next().value)
    try{
      const accepted=st.decoder.receivePart(p.normalized)
      if(accepted&&st.decoder.isComplete()&&st.decoder.isSuccess())st.completeHash=sha256(st.decoder.resultUR().cbor)
    }catch{this.exceptions++;return 'retryable-invalid'}
    this.maxActive=Math.max(this.maxActive,this.streams.size)
    return st.completeHash?'complete':'partial'
  }
  settle(){for(let i=0;i<this.settleFrames;i++){this.tick++;this.prune()}}
  finalize(){
    const complete=[...this.streams.entries()].filter(([,s])=>s.completeHash)
    if(complete.length===0)return {status:'none',hash:null}
    if(complete.length===1)return {status:'success',hash:complete[0][1].completeHash}
    // Two independently complete requests are not a capture error. Without an external
    // session identifier, choosing the most recent one would be an invented decision.
    return {status:'ambiguous',hash:null}
  }
}
function candidateDecode(sequence){const c=new ResilientCollector();const t0=performance.now();for(const f of sequence)c.accept(f);c.settle();const out=c.finalize();return {...out,elapsed:performance.now()-t0,maxActive:c.maxActive,invalid:c.invalid,noise:c.noise,duplicates:c.duplicates,evictions:c.evictions,exceptions:c.exceptions}}

function scenariosFor(target,others){
  const ext=target.frames(7), first=ext.frames.slice(0,ext.count), foreign=others[0].frames(4), foreignFirst=foreign.frames.slice(0,foreign.count)
  const goodAfterBad=[corrupt(first[0]),...first]
  const redundancy=ext.frames
  const dropEvery=(arr,mod)=>arr.filter((_,i)=>i%mod!==0)
  const partial=first.slice(0,Math.max(1,Math.floor(first.length/2)))
  const foreignPartial=foreignFirst.slice(0,Math.max(1,Math.floor(foreignFirst.length/2)))
  const interleave=(a,b)=>{const o=[];for(let i=0;i<Math.max(a.length,b.length);i++){if(i<a.length)o.push(a[i]);if(i<b.length)o.push(b[i])}return o}
  const multiStale=others.slice(0,4).flatMap(b=>{const f=b.frames(1).frames;return f.slice(0,Math.max(1,Math.floor(f.length/2)))})
  const unsupported=UREncoder.encodeSinglePart(new UR(Buffer.from('synthetic-noise'),'bytes'))
  return [
    ['ordered-first-cycle','target',first],
    ['three-clean-cycles','target',target.frames(3).frames],
    ['lowercase','target',first.map(x=>x.toLowerCase())],
    ['uppercase','target',first.map(x=>x.toUpperCase())],
    ['trim-whitespace','target',first.map(x=>` \n${x}\t `)],
    ['reverse-order','target',[...first].reverse()],
    ['deterministic-shuffle','target',shuffleDeterministic(first,0x5eed)],
    ['duplicate-each-twice','target',repeatEach(first,2)],
    ['burst-first-frame-20x','target',[...Array(20).fill(first[0]),...first.slice(1)]],
    ['repeat-cycle-5x','target',Array.from({length:5},()=>first).flat()],
    ['one-corrupt-then-good','target',goodAfterBad],
    ['three-corrupt-then-good','target',[corrupt(first[0],1),corrupt(first[0],3),corrupt(first[0],5),...first]],
    ['one-truncated-then-good','target',[truncate(first[0]),...first]],
    ['sequence-header-tamper-then-good','target',[tamperSequence(first[0]),...first]],
    ['plain-noise-before-each','target',first.flatMap((f,i)=>[`camera-noise-${i}`,f])],
    ['unsupported-ur-before-each','target',first.flatMap(f=>[unsupported,f])],
    ['partial-cycle-then-full','target',[...partial,...first]],
    ['drop-one-with-fountain-redundancy','target',redundancy.filter((_,i)=>i!==0)],
    ['drop-25pct-with-redundancy','target',dropEvery(redundancy,4)],
    ['drop-40pct-with-redundancy','target',redundancy.filter((_,i)=>i%5!==0&&i%5!==1)],
    ['odd-samples-then-redundancy','target',[...first.filter((_,i)=>i%2===1),...redundancy.slice(first.length)]],
    ['stale-foreign-one-before-target','target',[foreignFirst[0],...first]],
    ['stale-foreign-half-before-target','target',[...foreignPartial,...first]],
    ['stale-four-streams-before-target','target',[...multiStale,...first]],
    ['partial-target-long-gap-full-retry','target',[...partial,...noise(80),...first]],
    ['duplicate-and-corrupt-burst','target',[...repeatEach([corrupt(first[0])],12),...repeatEach(first,3)]],
    ['capture-case-whitespace-mix','target',first.flatMap((f,i)=>[i%2?f.toLowerCase():`  ${f.toUpperCase()}  `])],
    ['foreign-partial-interleaved','target',interleave(first,foreignPartial)],
    ['two-full-streams-interleaved','ambiguous',interleave(first,foreignFirst)],
    ['all-target-dropped','none',noise(40)],
    ['only-corrupt-target','none',first.map((f,i)=>corrupt(f,(i%5)+1))],
    ['unsupported-only','none',Array(20).fill(unsupported)]
  ].map(([name,expected,sequence])=>({name,expected,sequence}))
}

async function main(){
  const args=parseArgs(process.argv.slice(2));if(banks.length<args.minBanks)throw new Error(`banks ${banks.length}<${args.minBanks}`)
  const scenarioCount=scenariosFor(banks[0],banks.slice(1)).length;if(scenarioCount<args.minScenarios)throw new Error(`scenarios ${scenarioCount}<${args.minScenarios}`)
  const rows=[];let recoverable=0,candidateRecoverablePass=0,baselineRecoverablePass=0,falseSuccess=0,unhandled=0,maxActive=0
  for(let bi=0;bi<banks.length;bi++){
    const bank=banks[bi],others=banks.filter((_,i)=>i!==bi)
    for(const sc of scenariosFor(bank,others)){
      const bt=[],ct=[];let bFinal,cFinal,caseOk=true
      for(let r=0;r<args.repetitions;r++){
        const b=baselineDecode(sc.sequence),c=candidateDecode(sc.sequence);bFinal=b;cFinal=c
        if(r>0){bt.push(b.elapsed);ct.push(c.elapsed)}
        maxActive=Math.max(maxActive,c.maxActive);unhandled+=c.exceptions
      }
      const bTarget=bFinal.hash===bank.targetHash,cTarget=cFinal.hash===bank.targetHash
      if(sc.expected==='target'){recoverable++;if(bTarget)baselineRecoverablePass++;if(cTarget&&cFinal.status==='success')candidateRecoverablePass++;else caseOk=false}
      else if(sc.expected==='ambiguous'){if(cFinal.status!=='ambiguous'&&cFinal.status!=='none')caseOk=false}
      else if(sc.expected==='none'){if(cFinal.status!=='none')caseOk=false}
      if(cFinal.hash&&cFinal.hash!==bank.targetHash){falseSuccess++;caseOk=false}
      rows.push({type:'case',bank:bank.name,scenario:sc.name,expected:sc.expected,baselineTarget:bTarget,baselineStatus:bFinal.hash?'success':'none',candidateTarget:cTarget,candidateStatus:cFinal.status,candidateInvalid:cFinal.invalid,candidateNoise:cFinal.noise,candidateDuplicates:cFinal.duplicates,candidateEvictions:cFinal.evictions,candidateMaxActive:cFinal.maxActive,baselineMedianMs:Number(median(bt).toFixed(5)),baselineMadMs:Number(mad(bt).toFixed(5)),candidateMedianMs:Number(median(ct).toFixed(5)),candidateMadMs:Number(mad(ct).toFixed(5)),ok:caseOk})
      process.stdout.write(`${caseOk?'PASS':'FAIL'} ${bank.name} :: ${sc.name} baseline=${bTarget?'target':bFinal.hash?'other':'none'} candidate=${cFinal.status}${cTarget?'/target':''}\n`)
    }
  }
  const candidateRate=candidateRecoverablePass/recoverable,baselineRate=baselineRecoverablePass/recoverable
  const allCandidateLat=rows.filter(r=>r.ok).map(r=>r.candidateMedianMs),allBaselineLat=rows.filter(r=>r.ok).map(r=>r.baselineMedianMs)
  const failed=rows.filter(r=>!r.ok)
  const summary={type:'summary',banks:banks.length,scenariosPerBank:scenarioCount,totalCases:rows.length,repetitions:args.repetitions,measuredRepetitions:args.repetitions-1,recoverableCases:recoverable,baselineRecoverablePass:baselineRecoverablePass,baselineSuccessRate:baselineRate,candidateRecoverablePass:candidateRecoverablePass,candidateSuccessRate:candidateRate,falseSuccessCount:falseSuccess,unhandledExceptionCount:unhandled,maxActiveStreams:maxActive,baselineMedianCaseMs:Number(median(allBaselineLat).toFixed(5)),baselineMadCaseMs:Number(mad(allBaselineLat).toFixed(5)),candidateMedianCaseMs:Number(median(allCandidateLat).toFixed(5)),candidateMadCaseMs:Number(mad(allCandidateLat).toFixed(5)),failedCases:failed.length,status:candidateRate===1&&falseSuccess===0&&unhandled===0&&maxActive<=4&&failed.length===0?'CAPTURE_RESILIENCE_PASS':'CAPTURE_RESILIENCE_FAIL'}
  const env={type:'environment',startedAt:new Date().toISOString(),node:process.version,platform:`${os.platform()} ${os.release()} ${os.arch()}`,banks:banks.map(b=>({name:b.name,fragmentCount:b.fragmentCount,messageLength:Buffer.from(b.messageBase64,'base64').length,targetCborSha256:b.targetHash})),privacy:'synthetic-only; real Solflare user capture excluded from versioned evidence',candidate:['trim+lowercase normalization','recognized type gate','fountain metadata validation','invalid frame discard','per-stream dedupe','stream key type+seqLen+messageLen+checksum','max 4 LRU streams','64-frame incomplete TTL','4-frame settle','ambiguous multi-complete does not auto-emit']}
  const log=[JSON.stringify(env),...rows.map(r=>JSON.stringify(r)),JSON.stringify(summary),summary.status].join('\n')+'\n'
  fs.mkdirSync(path.dirname(args.log),{recursive:true});fs.writeFileSync(args.log,log)
  console.log(JSON.stringify(summary,null,2));console.log(`LOG ${args.log}`)
  if(summary.status!=='CAPTURE_RESILIENCE_PASS')process.exitCode=1
}
main().catch(e=>{console.error(e);process.exit(2)})
