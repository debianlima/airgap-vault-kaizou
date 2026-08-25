/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { IACMessageType } from '@airgap/serializer'

import { DeserializedDetailEffects } from './deserialized-detail.effects'

describe('DeserializedDetailEffects Solana transaction detail routing', () => {
  function createEffects(transactionService: any): any {
    const effects: any = Object.create(DeserializedDetailEffects.prototype)
    effects.transactionService = transactionService
    return effects
  }

  function transactionInfo(protocolIdentifier: string, details: any[]) {
    const protocol = {
      getIdentifier: jasmine.createSpy('getIdentifier').and.resolveTo(protocolIdentifier),
      getSymbol: jasmine.createSpy('getSymbol').and.resolveTo(protocolIdentifier),
      getTransactionDetails: jasmine.createSpy('getTransactionDetails').and.resolveTo(details)
    }
    const wallet: any = { publicKey: '00'.repeat(32), protocol }
    const request: any = {
      id: 'stake-request',
      protocol: protocolIdentifier,
      type: IACMessageType.TransactionSignRequest,
      payload: { transaction: 'AQID', encoding: 'base64', publicKey: '', callbackURL: '' }
    }
    return { info: [{ wallet, signTransactionRequest: request }], protocol }
  }

  it('uses Solana protocol details directly and does not enter ERC20 recipient-token enrichment', async () => {
    const stakeDetails: any[] = [{ from: ['stake-account'], to: [], amount: { value: '0' }, fee: { value: '0' } }]
    const transactionService = jasmine.createSpyObj('TransactionService', ['getDetailsFromIACMessages'])
    transactionService.getDetailsFromIACMessages.and.rejectWith(new Error("tx.to[0].toLowerCase crash"))
    const effects = createEffects(transactionService)
    const { info, protocol } = transactionInfo('solana', stakeDetails)

    const result = await effects.signTransactionInfoToUnsignedTransactions(info)

    expect(result[0].details).toBe(stakeDetails)
    expect(protocol.getTransactionDetails).toHaveBeenCalledTimes(1)
    expect(transactionService.getDetailsFromIACMessages).not.toHaveBeenCalled()
  })

  it('keeps non-Solana transactions on the upstream TransactionService path', async () => {
    const upstreamDetails: any[] = [{ from: ['a'], to: ['b'], amount: { value: '1' }, fee: { value: '1' } }]
    const transactionService = jasmine.createSpyObj('TransactionService', ['getDetailsFromIACMessages'])
    transactionService.getDetailsFromIACMessages.and.resolveTo(upstreamDetails)
    const effects = createEffects(transactionService)
    const { info, protocol } = transactionInfo('eth', [{ unexpected: true }])

    const result = await effects.signTransactionInfoToUnsignedTransactions(info)

    expect(result[0].details).toBe(upstreamDetails)
    expect(transactionService.getDetailsFromIACMessages).toHaveBeenCalledTimes(1)
    expect(protocol.getTransactionDetails).not.toHaveBeenCalled()
  })
})
