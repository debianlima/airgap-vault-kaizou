import { Buffer } from 'buffer'
import * as createHash from 'create-hash'

import { MoneroAirgapDetailPage } from './monero-airgap-detail.page'

describe('MoneroAirgapDetailPage', () => {
  it('shows only stable metadata for an in-memory payload', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4])
    const navigation = {
      getState: () => ({ moneroPayload: { kind: 'unsignedTransaction', urType: 'xmr-txunsigned', bytes } })
    }
    const page = new MoneroAirgapDetailPage(navigation as any)

    expect(page.kind).toBe('unsignedTransaction')
    expect(page.kindLabel).toBe('Unsigned transaction')
    expect(page.urType).toBe('xmr-txunsigned')
    expect(page.size).toBe(4)
    expect(page.sha256).toBe(createHash('sha256').update(Buffer.from(bytes)).digest('hex'))
    expect(page.signingEnabled).toBeFalse()
  })

  it('refuses direct navigation without a decoded Monero payload', () => {
    expect(() => new MoneroAirgapDetailPage({ getState: () => ({}) } as any)).toThrowError(
      /Monero review requires an in-memory decoded payload/
    )
  })

  it('does not expose a signing or approval action', () => {
    const page = new MoneroAirgapDetailPage({
      getState: () => ({ moneroPayload: { kind: 'outputs', urType: 'xmr-output', bytes: new Uint8Array([1]) } })
    } as any)
    expect((page as any).sign).toBeUndefined()
    expect((page as any).continue).toBeUndefined()
    expect((page as any).approved).toBeUndefined()
  })
})
