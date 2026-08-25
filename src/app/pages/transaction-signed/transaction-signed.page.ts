/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { Component } from '@angular/core'
import { AirGapWallet } from '@airgap/coinlib-core'
import { MessageSignResponse } from '@airgap/serializer'
import { TranslateService } from '@ngx-translate/core'

import { ErrorCategory, handleErrorLocal } from '../../services/error-handler/error-handler.service'
import { NavigationService } from '../../services/navigation/navigation.service'

enum TransactionQRType {
  SignedAirGap = 0,
  SignedRaw = 1
}

@Component({
  selector: 'airgap-transaction-signed',
  templateUrl: './transaction-signed.page.html',
  styleUrls: ['./transaction-signed.page.scss']
})
export class TransactionSignedPage {
  public signedTxs: string[]
  public interactionUrl: string
  public solflareSignatureQr?: string

  public splits: string[]

  public pageTitle: string
  public heading: string
  public translationKey: string

  public messageSignResponse: MessageSignResponse
  public wallets: AirGapWallet[]
  public qrType: TransactionQRType = 0

  public signedTransactionSync: any // TODO: Types

  public addressesNotOnContactBook: string[] = []

  constructor(public navigationService: NavigationService, private readonly translateService: TranslateService) {
    this.interactionUrl = this.navigationService.getState().interactionUrl
    this.solflareSignatureQr = this.navigationService.getState().solflareSignatureQr
    this.wallets = this.navigationService.getState().wallets
    this.signedTxs = this.navigationService.getState().signedTxs
    this.translationKey = this.navigationService.getState().translationKey
    this.pageTitle = this.translateService.instant(`${this.translationKey}.title`)
    this.heading = this.translateService.instant(`${this.translationKey}.heading`)
    this.messageSignResponse = this.navigationService.getState().messageSignResponse
  }

  ionViewWillEnter() {
    const temp = this.interactionUrl
    this.interactionUrl = null
    this.interactionUrl = temp
  }

  public done(): void {
    this.navigationService.routeToSecretsTab().catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }
}
