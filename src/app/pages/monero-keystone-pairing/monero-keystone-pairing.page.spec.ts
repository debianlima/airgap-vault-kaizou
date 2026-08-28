import { MoneroKeystonePairingPage } from './monero-keystone-pairing.page'

const SUMMARY = {
  version: 0 as const,
  primaryAddress: '4' + 'A'.repeat(94),
  restoreHeight: 0,
  source: 'Keystone',
  privateViewKeyValid: true as const
}

describe('MoneroKeystonePairingPage', () => {
  function setup() {
    const pairingService = {
      parsePublicPairing: jasmine.createSpy('parsePublicPairing').and.returnValue({ privateViewKey: '11'.repeat(32) }),
      toSafeSummary: jasmine.createSpy('toSafeSummary').and.returnValue(SUMMARY)
    }
    const page = new MoneroKeystonePairingPage(
      { is: () => false } as any,
      { scan: jasmine.createSpy('scan'), destroy: jasmine.createSpy('destroy') } as any,
      {} as any,
      {} as any,
      pairingService as any
    )
    const stopScan = spyOn<any>(page as any, 'stopScan').and.stub()
    const startScan = spyOn(page, 'startScan').and.stub()
    return { page, pairingService, stopScan, startScan }
  }

  it('shows only the safe summary after a valid public QR', () => {
    const { page, pairingService, stopScan } = setup()
    page.checkScan('{"version":0}')
    expect(pairingService.parsePublicPairing).toHaveBeenCalled()
    expect(page.summary).toEqual(SUMMARY)
    expect((page.summary as any).privateViewKey).toBeUndefined()
    expect(stopScan).toHaveBeenCalled()
  })

  it('does not call IAC, navigation, signing or wallet services', () => {
    const { page } = setup()
    expect((page as any).iacService).toBeUndefined()
    expect((page as any).navigationService).toBeUndefined()
    expect((page as any).transactionService).toBeUndefined()
    expect((page as any).walletService).toBeUndefined()
  })

  it('keeps scanning after a rejected QR', () => {
    const { page, pairingService, startScan } = setup()
    pairingService.parsePublicPairing.and.throwError('Encrypted Keystone Private QR is not supported yet')
    page.checkScan('encrypted')
    expect(page.summary).toBeUndefined()
    expect(page.error).toContain('Private QR')
    expect(startScan).toHaveBeenCalled()
  })

  it('clears only Monero pairing UI state when scanning again', () => {
    const { page, startScan } = setup()
    page.summary = SUMMARY
    page.error = 'old'
    page.scanAgain()
    expect(page.summary).toBeUndefined()
    expect(page.error).toBeUndefined()
    expect(startScan).toHaveBeenCalled()
  })
})
