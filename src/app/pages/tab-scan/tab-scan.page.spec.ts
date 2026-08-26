/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4.
 * See LICENSE.md, MODIFICATIONS.md and THIRD_PARTY_NOTICES.md.
 */

import { IACHandlerStatus } from '@airgap/angular-core'

import { TabScanPage } from './tab-scan.page'

function setup() {
  const scanner = { scan: jasmine.createSpy('scan'), destroy: jasmine.createSpy('destroy') }
  const platform = { is: () => true, ready: async () => undefined }
  const permissionsProvider = {}
  const securityUtils = {}
  const iacService = {
    resetHandlers: jasmine.createSpy('resetHandlers'),
    handleRequest: jasmine.createSpy('handleRequest').and.returnValue(Promise.resolve(IACHandlerStatus.PARTIAL))
  }
  const moneroAirgapService = {
    isMoneroUrFrame: jasmine.createSpy('isMoneroUrFrame').and.callFake((data: string) => /^ur:xmr-/i.test(data)),
    collect: jasmine.createSpy('collect')
  }
  const navigationService = {
    routeWithState: jasmine.createSpy('routeWithState').and.returnValue(Promise.resolve(true))
  }
  const ngZone = { run: (fn: () => void) => fn() }
  const component = new TabScanPage(
    platform as any,
    scanner as any,
    permissionsProvider as any,
    securityUtils as any,
    iacService as any,
    moneroAirgapService as any,
    navigationService as any,
    ngZone as any
  )
  const startScan = spyOn(component, 'startScan').and.stub()
  const stopScan = spyOn<any>(component as any, 'stopScan').and.stub()
  return { component, iacService, moneroAirgapService, navigationService, startScan, stopScan }
}

describe('TabScanPage QR protocol routing', () => {
  it('forwards a duplicate non-XMR QR reading to IACService while keeping the visual part cache deduplicated', () => {
    const { component, iacService } = setup()
    const frame = 'ur:sol-sign-request/1-2/lpadsynthetic'

    component.checkScan(frame)
    component.checkScan(frame)

    expect(iacService.handleRequest).toHaveBeenCalledTimes(2)
    expect((component as any).parts.size).toBe(1)
  })

  it('keeps a partial XMR fountain stream out of IAC and exposes progress', () => {
    const { component, iacService, moneroAirgapService, navigationService, startScan } = setup()
    moneroAirgapService.collect.and.returnValue({ urType: 'xmr-txunsigned', progress: 0.4 })

    component.checkScan('ur:xmr-txunsigned/1-3/lpadsynthetic')

    expect(iacService.handleRequest).not.toHaveBeenCalled()
    expect(moneroAirgapService.collect).toHaveBeenCalled()
    expect(component.isMultiQr).toBeTrue()
    expect(component.percentageScanned).toBe(0.4)
    expect(startScan).toHaveBeenCalled()
    expect(navigationService.routeWithState).not.toHaveBeenCalled()
  })

  it('routes a complete XMR payload only to the review-only Monero page', () => {
    const { component, iacService, moneroAirgapService, navigationService, stopScan } = setup()
    const payload = { kind: 'unsignedTransaction', urType: 'xmr-txunsigned', bytes: Uint8Array.from([1, 2, 3]) }
    moneroAirgapService.collect.and.returnValue({ urType: 'xmr-txunsigned', progress: 1, payload })

    component.checkScan('ur:xmr-txunsigned/lpadsynthetic')

    expect(iacService.handleRequest).not.toHaveBeenCalled()
    expect(stopScan).toHaveBeenCalled()
    expect(navigationService.routeWithState).toHaveBeenCalledOnceWith('/monero-airgap-detail', { moneroPayload: payload })
  })

  it('does not fall back to IAC when an XMR payload is rejected', () => {
    const { component, iacService, moneroAirgapService, navigationService, startScan } = setup()
    moneroAirgapService.collect.and.throwError('Unsupported Monero unsigned transaction wallet2 format version 3; contract requires 5')

    expect(() => component.checkScan('ur:xmr-txunsigned/lpadlegacy')).not.toThrow()
    expect(iacService.handleRequest).not.toHaveBeenCalled()
    expect(navigationService.routeWithState).not.toHaveBeenCalled()
    expect(startScan).toHaveBeenCalled()
  })
})
