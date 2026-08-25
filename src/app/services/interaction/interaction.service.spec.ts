/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { Buffer } from 'buffer'

import { SOLFLARE_KEYSTONE_PROTOCOL } from '../solflare-keystone/solflare-keystone.service'
import { InteractionOperationType, InteractionService } from './interaction.service'

describe('InteractionService Solflare response', () => {
  it('extracts the signature for the Ed25519 signer encoded by the receiving address when wallet.publicKey diverges', () => {
    const stalePublicKey = Buffer.alloc(32, 0x11)
    const receivingSignerPublicKey = Buffer.from(
      'f036276246a75b9de3349ed42b15e232f6518fc20f5fcd4f1d64e81f9bd258f7',
      'hex'
    )
    const staleSignature = Buffer.alloc(64, 0x21)
    const receivingSignerSignature = Buffer.alloc(64, 0x42)
    const message = Buffer.concat([
      Buffer.from([0x80, 0x02, 0x00, 0x00, 0x02]),
      stalePublicKey,
      receivingSignerPublicKey,
      Buffer.alloc(32, 0x09),
      Buffer.from([0x00, 0x00])
    ])
    const signedTransaction = Buffer.concat([
      Buffer.from([0x02]),
      staleSignature,
      receivingSignerSignature,
      message
    ]).toString('base64')

    const navigationService: any = {
      routeWithState: jasmine.createSpy('routeWithState').and.returnValue(Promise.resolve())
    }
    const storageService: any = {
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve(undefined)),
      set: jasmine.createSpy('set').and.returnValue(Promise.resolve())
    }
    const solflareKeystoneService: any = {
      getRequest: jasmine.createSpy('getRequest').and.returnValue({ requestIdHex: '00112233445566778899aabbccddeeff' }),
      encodeSignature: jasmine.createSpy('encodeSignature').and.returnValue('ur:sol-signature/test'),
      forgetRequest: jasmine.createSpy('forgetRequest')
    }
    const service = new InteractionService(navigationService, {} as any, storageService, solflareKeystoneService)

    ;(service as any).navigateToPageByOperationType({
      operationType: InteractionOperationType.TRANSACTION_BROADCAST,
      iacMessage: [{ id: 7, protocol: SOLFLARE_KEYSTONE_PROTOCOL } as any],
      wallets: [
        {
          publicKey: stalePublicKey.toString('hex'),
          receivingPublicAddress: 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk'
        } as any
      ],
      signedTxs: [signedTransaction]
    })

    expect(Array.from(solflareKeystoneService.encodeSignature.calls.argsFor(0)[0])).toEqual(
      Array.from(receivingSignerSignature)
    )
    expect(solflareKeystoneService.encodeSignature.calls.argsFor(0)[1]).toBe('00112233445566778899aabbccddeeff')
    expect(solflareKeystoneService.forgetRequest).toHaveBeenCalledWith(7)
  })
})
