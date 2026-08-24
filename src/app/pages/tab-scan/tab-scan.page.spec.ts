import { IACHandlerStatus } from '@airgap/angular-core'

import { TabScanPage } from './tab-scan.page'

describe('TabScanPage resilient QR forwarding', () => {
  it('forwards a duplicate QR reading to IACService while keeping the visual part cache deduplicated', () => {
    const scanner = { scan: jasmine.createSpy('scan'), destroy: jasmine.createSpy('destroy') }
    const platform = { is: () => true, ready: async () => undefined }
    const permissionsProvider = {}
    const securityUtils = {}
    const iacService = {
      resetHandlers: jasmine.createSpy('resetHandlers'),
      handleRequest: jasmine.createSpy('handleRequest').and.returnValue(Promise.resolve(IACHandlerStatus.PARTIAL))
    }
    const ngZone = { run: (fn: () => void) => fn() }
    const component = new TabScanPage(
      platform as any,
      scanner as any,
      permissionsProvider as any,
      securityUtils as any,
      iacService as any,
      ngZone as any
    )
    const frame = 'ur:sol-sign-request/1-2/lpadsynthetic'

    component.checkScan(frame)
    component.checkScan(frame)

    expect(iacService.handleRequest).toHaveBeenCalledTimes(2)
    expect((component as any).parts.size).toBe(1)
  })
})
