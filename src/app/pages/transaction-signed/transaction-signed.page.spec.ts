import { TransactionSignedPage } from './transaction-signed.page'

describe('TransactionSignedPage AirGap Solflare', () => {
  it('loads a Solflare signature QR without removing the existing interaction response', () => {
    const interactionUrl: any = [{ id: 1 }]
    const navigation: any = {
      getState: () => ({
        interactionUrl,
        solflareSignatureQr: 'ur:sol-signature/example',
        signedTxs: ['signed'],
        wallets: []
      }),
      routeToSecretsTab: async () => true
    }
    const translate: any = { instant: (key: string) => key }
    const page = new TransactionSignedPage(navigation, translate)
    expect(page.solflareSignatureQr).toBe('ur:sol-signature/example')
    expect(page.interactionUrl).toBe(interactionUrl)
    expect(page.signedTxs).toEqual(['signed'])
  })
})
