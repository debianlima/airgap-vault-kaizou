/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { SolflareKeystoneService } from '../../services/solflare-keystone/solflare-keystone.service'
import { airgapsolflare, airgapwallet } from '../account-address/account-address.page'
import { AccountSharePage } from './account-share.page'

describe('AccountSharePage AirGap Solflare', () => {
  const publicKey = 'f036276246a75b9de3349ed42b15e232f6518fc20f5fcd4f1d64e81f9bd258f7'
  const receivingPublicAddress = 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk'

  it('renders a crypto-multi-accounts payload from the selected Solana wallet fields', () => {
    const navigation: any = {
      getState: () => ({
        interactionUrl: [],
        companionApp: airgapsolflare,
        wallet: { publicKey, receivingPublicAddress, derivationPath: "m/44'/501'/0'/0'", masterFingerprint: '12345678' }
      })
    }
    const page = new AccountSharePage(navigation, {} as any, new SolflareKeystoneService())
    expect(page.solflareSyncQr?.startsWith('ur:crypto-multi-accounts/')).toBeTrue()
  })

  it('uses the Ed25519 signer encoded by the Solana receiving address when wallet.publicKey diverges', () => {
    const staleWalletPublicKey = '11'.repeat(32)
    const expectedSignerPublicKey = 'f036276246a75b9de3349ed42b15e232f6518fc20f5fcd4f1d64e81f9bd258f7'
    const service: any = {
      encodeAccountSync: jasmine.createSpy('encodeAccountSync').and.returnValue('ur:crypto-multi-accounts/test')
    }
    const navigation: any = {
      getState: () => ({
        interactionUrl: [],
        companionApp: airgapsolflare,
        wallet: {
          publicKey: staleWalletPublicKey,
          receivingPublicAddress,
          derivationPath: "m/44'/501'/0'/0'",
          masterFingerprint: '73c5da0a'
        }
      })
    }

    new AccountSharePage(navigation, {} as any, service)

    expect(service.encodeAccountSync).toHaveBeenCalledWith(expectedSignerPublicKey, "m/44'/501'/0'/0'", '73c5da0a')
  })

  it('preserves the existing IAC QR path for AirGap Wallet', () => {
    const interactionUrl: any[] = [{ id: 1 }]
    const navigation: any = { getState: () => ({ interactionUrl, companionApp: airgapwallet }) }
    const page = new AccountSharePage(navigation, {} as any, new SolflareKeystoneService())
    expect(page.solflareSyncQr).toBeUndefined()
    expect(page.interactionUrl).toBe(interactionUrl)
  })
})
