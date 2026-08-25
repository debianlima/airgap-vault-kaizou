/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { DeeplinkService, QRType } from '@airgap/angular-core'
import { Injectable } from '@angular/core'
import { AirGapWallet, UnsignedTransaction } from '@airgap/coinlib-core'
import { IACMessageDefinitionObjectV3, MessageSignResponse } from '@airgap/serializer'

import { CompanionApp } from '../../pages/account-address/account-address.page'
import { assertNever } from '../../utils/utils'

import { ErrorCategory, handleErrorLocal } from '../error-handler/error-handler.service'
import { NavigationService } from '../navigation/navigation.service'
import { InteractionType, VaultStorageKey, VaultStorageService } from '../storage/storage.service'
import {
  SOLFLARE_KEYSTONE_PROTOCOL,
  SolflareKeystoneService,
  extractSignatureForPublicKey,
  solanaPublicKeyHexFromAddress
} from '../solflare-keystone/solflare-keystone.service'

export enum InteractionCommunicationType {
  QR = 'qr',
  DEEPLINK = 'deeplink'
}

export enum InteractionOperationType {
  WALLET_SYNC = 'walletSync',
  TRANSACTION_BROADCAST = 'transactionBroadcast',
  MESSAGE_SIGN_REQUEST = 'messageSignRequest'
}

export interface IInteractionOptions {
  operationType: InteractionOperationType
  iacMessage: IACMessageDefinitionObjectV3[] // remove string
  communicationType?: InteractionCommunicationType
  signedTxs?: string[]
  wallets?: AirGapWallet[]
  transactions?: UnsignedTransaction[]
  messageSignResponse?: MessageSignResponse
  companionApp?: CompanionApp
}

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  interactionType: InteractionType

  constructor(
    private readonly navigationService: NavigationService,
    private readonly deepLinkService: DeeplinkService,
    private readonly storageService: VaultStorageService,
    private readonly solflareKeystoneService: SolflareKeystoneService
  ) {
    this.storageService.get(VaultStorageKey.INTERACTION_TYPE).then((type) => (this.interactionType = type))
  }

  resetInteractionType() {
    this.changeInteractionType(InteractionType.ALWAYS_ASK)
  }

  changeInteractionType(newType: InteractionType) {
    this.interactionType = newType
    this.storageService.set(VaultStorageKey.INTERACTION_TYPE, this.interactionType).catch(handleErrorLocal(ErrorCategory.SECURE_STORAGE))
  }

  async getInteractionType() {
    this.interactionType = await this.storageService.get(VaultStorageKey.INTERACTION_TYPE)
    return this.interactionType
  }

  public async startInteraction(interactionOptions: IInteractionOptions): Promise<void> {
    await this.getInteractionType()

    if (interactionOptions.communicationType) {
      if (this.interactionType === InteractionType.UNDETERMINED) {
        this.goToInteractionSelectionSettingsPage(interactionOptions)
      }
      if (interactionOptions.communicationType === InteractionCommunicationType.DEEPLINK) {
        this.startDeeplink(interactionOptions.iacMessage)
      } else if (interactionOptions.communicationType === InteractionCommunicationType.QR) {
        this.navigateToPageByOperationType(interactionOptions)
      }
    } else if (
      interactionOptions.operationType === InteractionOperationType.WALLET_SYNC &&
      interactionOptions.companionApp &&
      ![QRType.V2, QRType.V3].includes(interactionOptions.companionApp?.qrType)
    ) {
      this.navigateToPageByOperationType(interactionOptions)
    } else {
      switch (this.interactionType) {
        case InteractionType.UNDETERMINED:
          this.goToInteractionSelectionPage(interactionOptions)
          break
        case InteractionType.ALWAYS_ASK:
          this.goToInteractionSelectionPage(interactionOptions)
          break
        case InteractionType.DEEPLINK:
          this.startDeeplink(interactionOptions.iacMessage)
          break
        case InteractionType.QR_CODE:
          this.navigateToPageByOperationType(interactionOptions)
          break
        default:
      }
    }
  }

  private goToInteractionSelectionPage(interactionOptions: IInteractionOptions): void {
    this.navigationService
      .routeWithState('/interaction-selection', { interactionOptions })
      .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }

  private goToInteractionSelectionSettingsPage(interactionOptions: IInteractionOptions): void {
    this.navigationService
      .routeWithState('/interaction-selection-settings', { interactionOptions })
      .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }

  private navigateToPageByOperationType(interactionOptions: IInteractionOptions): void {
    if (interactionOptions.operationType === InteractionOperationType.WALLET_SYNC) {
      this.navigationService
        .routeWithState('/account-share', {
          interactionUrl: interactionOptions.iacMessage,
          companionApp: interactionOptions.companionApp,
          wallet: interactionOptions.wallets?.[0]
        })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    } else if (interactionOptions.operationType === InteractionOperationType.TRANSACTION_BROADCAST) {
      let solflareSignatureQr: string | undefined
      const response = interactionOptions.iacMessage?.length === 1 ? interactionOptions.iacMessage[0] : undefined
      const context = response ? this.solflareKeystoneService.getRequest(response.id) : undefined
      const wallet = interactionOptions.wallets?.length === 1 ? interactionOptions.wallets[0] : undefined
      const signedTransaction = interactionOptions.signedTxs?.length === 1 ? interactionOptions.signedTxs[0] : undefined

      if (
        response?.protocol === SOLFLARE_KEYSTONE_PROTOCOL &&
        context &&
        wallet &&
        signedTransaction
      ) {
        const signature = extractSignatureForPublicKey(signedTransaction, solanaPublicKeyHexFromAddress(wallet.receivingPublicAddress))
        solflareSignatureQr = this.solflareKeystoneService.encodeSignature(signature, context.requestIdHex)
        this.solflareKeystoneService.forgetRequest(response.id)
      }

      this.navigationService
        .routeWithState('/transaction-signed', {
          interactionUrl: interactionOptions.iacMessage,
          wallets: interactionOptions.wallets,
          signedTxs: interactionOptions.signedTxs,
          transactions: interactionOptions.transactions,
          solflareSignatureQr,
          translationKey: 'transaction-signed'
        })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    } else if (interactionOptions.operationType === InteractionOperationType.MESSAGE_SIGN_REQUEST) {
      this.navigationService
        .routeWithState('/transaction-signed', {
          interactionUrl: interactionOptions.iacMessage,
          translationKey: 'message-signing-request',
          messageSignResponse: interactionOptions.messageSignResponse
        })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    } else {
      return assertNever('INVALID_OPERATION_TYPE', interactionOptions.operationType)
    }
  }

  private async startDeeplink(iacMessage: IACMessageDefinitionObjectV3[]): Promise<void> {
    this.deepLinkService
      .sameDeviceDeeplink(iacMessage)
      .then(() => {
        this.navigationService.routeToSecretsTab().catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
      })
      .catch(handleErrorLocal(ErrorCategory.DEEPLINK_SERVICE))
  }
}
