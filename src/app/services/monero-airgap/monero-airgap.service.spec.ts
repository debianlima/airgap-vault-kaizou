import { Buffer } from 'buffer'

import { TestBed } from '@angular/core/testing'
import { UR, UREncoder } from '@ngraveio/bc-ur'

import { MoneroAirgapService, MoneroPayloadKind, MoneroUrType } from './monero-airgap.service'

function bytes(prefix: string, version: number, tailLength: number): Uint8Array {
  return Uint8Array.from(Buffer.concat([Buffer.from(prefix, 'utf8'), Buffer.from([version]), Buffer.alloc(tailLength, 0xa5)]))
}

function expectBytesEqual(actual: Uint8Array, expected: Uint8Array): void {
  expect(Buffer.from(actual).toString('hex')).toBe(Buffer.from(expected).toString('hex'))
}

describe('MoneroAirgapService', () => {
  let service: MoneroAirgapService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MoneroAirgapService)
  })

  const cases: Array<{ kind: MoneroPayloadKind; urType: MoneroUrType; payload: Uint8Array }> = [
    { kind: 'outputs', urType: 'xmr-output', payload: bytes('Monero output export', 4, 400) },
    { kind: 'keyImages', urType: 'xmr-keyimage', payload: bytes('Monero key image export', 3, 450) },
    { kind: 'unsignedTransaction', urType: 'xmr-txunsigned', payload: bytes('Monero unsigned tx set', 5, 700) },
    { kind: 'signedTransaction', urType: 'xmr-txsigned', payload: bytes('Monero signed tx set', 5, 900) }
  ]

  for (const testCase of cases) {
    it(`round-trips ${testCase.kind} byte-for-byte through ${testCase.urType}`, () => {
      const frames = service.encode(testCase.kind, testCase.payload, 80)
      expect(frames.length).toBeGreaterThan(1)
      const noisyOrder = [...frames].reverse().concat(frames[0], frames[frames.length - 1])
      const decoded = service.decode(noisyOrder)
      expect(decoded.kind).toBe(testCase.kind)
      expect(decoded.urType).toBe(testCase.urType)
      expectBytesEqual(decoded.bytes, testCase.payload)
    })
  }

  it('recognizes only the four contracted Monero UR prefixes', () => {
    expect(service.isMoneroUrFrame('UR:XMR-OUTPUT/AAAA')).toBeTrue()
    expect(service.isMoneroUrFrame('ur:xmr-keyimage/aaaa')).toBeTrue()
    expect(service.isMoneroUrFrame('ur:xmr-txunsigned/aaaa')).toBeTrue()
    expect(service.isMoneroUrFrame('ur:xmr-txsigned/aaaa')).toBeTrue()
    expect(service.isMoneroUrFrame('ur:sol-sign-request/aaaa')).toBeFalse()
    expect(service.isMoneroUrFrame('ur:xmr-unknown/aaaa')).toBeFalse()
  })

  it('reports partial fountain progress without exposing a payload before completion', () => {
    const payload = bytes('Monero unsigned tx set', 5, 1800)
    const frames = service.encode('unsignedTransaction', payload, 60)
    expect(frames.length).toBeGreaterThan(2)
    const partial = service.collect([frames[0]])
    expect(partial.urType).toBe('xmr-txunsigned')
    expect(partial.progress).toBeGreaterThan(0)
    expect(partial.progress).toBeLessThan(1)
    expect(partial.payload).toBeUndefined()
  })

  it('rejects the official legacy Monero outputs v3 fixture header', () => {
    const stale = bytes('Monero output export', 3, 32)
    expect(() => service.encode('outputs', stale)).toThrowError(/format version 3; contract requires 4/)
  })

  it('rejects the official legacy Monero unsigned transaction v3 fixture header', () => {
    const stale = bytes('Monero unsigned tx set', 3, 32)
    expect(() => service.encode('unsignedTransaction', stale)).toThrowError(/format version 3; contract requires 5/)
  })

  it('rejects the official legacy Monero signed transaction v3 fixture header', () => {
    const stale = bytes('Monero signed tx set', 3, 32)
    expect(() => service.encode('signedTransaction', stale)).toThrowError(/format version 3; contract requires 5/)
  })

  it('rejects a UR type that disagrees with the canonical wallet2 magic', () => {
    const signed = bytes('Monero signed tx set', 5, 64)
    const legitimateFrames = service.encode('signedTransaction', signed, 250)
    const wrongType = legitimateFrames.map((frame) => frame.replace(/^ur:xmr-txsigned\//, 'ur:xmr-txunsigned/'))
    expect(() => service.decode(wrongType)).toThrow()
  })

  it('rejects unsupported UR types before interpreting payload bytes', () => {
    const cbor = Buffer.from([0x41, 0x00])
    const frame = UREncoder.encodeSinglePart(new UR(cbor, 'bytes'))
    expect(() => service.decode([frame])).toThrowError(/Unsupported Monero UR type/)
  })

  it('rejects incomplete fountain streams', () => {
    const payload = bytes('Monero signed tx set', 5, 1200)
    const frames = service.encode('signedTransaction', payload, 60)
    expect(frames.length).toBeGreaterThan(2)
    expect(() => service.decode([frames[0]])).toThrowError(/Incomplete Monero UR fountain stream/)
  })

  it('rejects an unrecognized current payload magic even if CBOR and UR are valid', () => {
    const payload = Uint8Array.from(Buffer.from('not-a-monero-wallet2-payload', 'utf8'))
    const cbor = Buffer.concat([Buffer.from([0x58, payload.length]), Buffer.from(payload)])
    const frame = UREncoder.encodeSinglePart(new UR(cbor, 'xmr-output'))
    expect(() => service.decode([frame])).toThrowError(/Unrecognized Monero wallet2 payload magic/)
  })
})
