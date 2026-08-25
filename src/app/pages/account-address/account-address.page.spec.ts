/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { of } from 'rxjs'

import { AccountAddressPage } from './account-address.page'

function createPage(protocolIdentifier: string, isExtendedPublicKey: boolean = false): AccountAddressPage {
  const wallet: any = {
    protocol: {
      getSymbol: async () => protocolIdentifier.toUpperCase(),
      getIdentifier: async () => protocolIdentifier,
      getName: async () => protocolIdentifier
    },
    isExtendedPublicKey
  }
  const navigation: any = { getState: () => ({ wallet, secret: {} }), routeWithState: async () => true }
  const storage: any = { subscribe: () => of(undefined) }
  const router: any = { navigate: async () => true }
  return new AccountAddressPage(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    navigation,
    {} as any,
    {} as any,
    {} as any,
    storage,
    router
  )
}

describe('AccountAddressPage AirGap Solflare isolation', () => {
  it('offers AirGap Solflare only for the isolated Solana protocol', async () => {
    const page = createPage('solana')
    await page.ngOnInit()
    expect(page.syncOptions.map((option) => option.name)).toEqual(['AirGap Wallet', 'AirGap Solflare'])
  })

  it('preserves the existing Bitcoin companion list without AirGap Solflare', async () => {
    const page = createPage(MainProtocolSymbols.BTC)
    await page.ngOnInit()
    const names = page.syncOptions.map((option) => option.name)
    expect(names).toContain('AirGap Wallet')
    expect(names).toContain('BlueWallet')
    expect(names).not.toContain('AirGap Solflare')
  })
})
