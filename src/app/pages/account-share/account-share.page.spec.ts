import { SolflareKeystoneService } from '../../services/solflare-keystone/solflare-keystone.service'
import { airgapsolflare, airgapwallet } from '../account-address/account-address.page'
import { AccountSharePage } from './account-share.page'

describe('AccountSharePage AirGap Solflare', () => {
  const publicKey = 'd39e71bc4c201ce8c4edadeda09d763c26393bbb218b5826b7521ede5e8893c9'

  it('renders a crypto-multi-accounts payload from the selected Solana wallet fields', () => {
    const navigation: any = {
      getState: () => ({
        interactionUrl: [],
        companionApp: airgapsolflare,
        wallet: { publicKey, derivationPath: "m/44'/501'/0'/0'", masterFingerprint: '12345678' }
      })
    }
    const page = new AccountSharePage(navigation, {} as any, new SolflareKeystoneService())
    expect(page.solflareSyncQr?.startsWith('ur:crypto-multi-accounts/')).toBeTrue()
  })

  it('preserves the existing IAC QR path for AirGap Wallet', () => {
    const interactionUrl: any[] = [{ id: 1 }]
    const navigation: any = { getState: () => ({ interactionUrl, companionApp: airgapwallet }) }
    const page = new AccountSharePage(navigation, {} as any, new SolflareKeystoneService())
    expect(page.solflareSyncQr).toBeUndefined()
    expect(page.interactionUrl).toBe(interactionUrl)
  })
})
