import { TestBed } from '@angular/core/testing'

import { MoneroKeystonePairingService } from './monero-keystone-pairing.service'

const ADDRESS = '4' + 'A'.repeat(94)
const VIEW_KEY = '11'.repeat(32)

function publicQr(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 0,
    primaryAddress: ADDRESS,
    privateViewKey: VIEW_KEY,
    restoreHeight: 0,
    encrypted: false,
    source: 'Keystone',
    ...extra
  })
}

describe('MoneroKeystonePairingService', () => {
  let service: MoneroKeystonePairingService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MoneroKeystonePairingService)
  })

  it('recognizes the public Keystone/Cake version-0 pairing shape', () => {
    expect(service.isCandidate(publicQr())).toBeTrue()
  })

  it('parses the public Keystone pairing fields without transforming them', () => {
    const pairing = service.parsePublicPairing(publicQr())
    expect(pairing.version).toBe(0)
    expect(pairing.primaryAddress).toBe(ADDRESS)
    expect(pairing.privateViewKey).toBe(VIEW_KEY)
    expect(pairing.restoreHeight).toBe(0)
    expect(pairing.source).toBe('Keystone')
    expect(pairing.encrypted).toBeFalse()
  })

  it('accepts the Feather-compatible walletName extension', () => {
    const pairing = service.parsePublicPairing(publicQr({ source: undefined, walletName: 'Cold Monero' }))
    expect(pairing.walletName).toBe('Cold Monero')
    expect(pairing.source).toBeUndefined()
  })

  it('produces a safe summary that does not contain the private view key', () => {
    const summary: any = service.toSafeSummary(service.parsePublicPairing(publicQr()))
    expect(summary.primaryAddress).toBe(ADDRESS)
    expect(summary.privateViewKeyValid).toBeTrue()
    expect(summary.privateViewKey).toBeUndefined()
    expect(JSON.stringify(summary)).not.toContain(VIEW_KEY)
  })

  it('rejects Keystone Private QR mode until an audited decrypt path exists', () => {
    expect(() => service.parsePublicPairing(publicQr({ encrypted: true }))).toThrowError(/Private QR is not supported yet/)
  })

  it('rejects a malformed Monero primary address', () => {
    expect(() => service.parsePublicPairing(publicQr({ primaryAddress: 'not-monero' }))).toThrowError(/Invalid Monero primary address/)
  })

  it('rejects a malformed private view key', () => {
    expect(() => service.parsePublicPairing(publicQr({ privateViewKey: 'abcd' }))).toThrowError(/Invalid Monero private view key/)
  })

  it('rejects a negative or non-integer restore height', () => {
    expect(() => service.parsePublicPairing(publicQr({ restoreHeight: -1 }))).toThrowError(/Invalid Monero restore height/)
    expect(() => service.parsePublicPairing(publicQr({ restoreHeight: 1.5 }))).toThrowError(/Invalid Monero restore height/)
  })

  it('does not classify ordinary IAC/Solana UR data as Monero pairing', () => {
    expect(service.isCandidate('ur:sol-sign-request/lpadsynthetic')).toBeFalse()
  })
})
