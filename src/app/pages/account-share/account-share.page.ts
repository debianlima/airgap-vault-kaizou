import { ClipboardService } from '@airgap/angular-core'
import { IACMessageDefinitionObjectV3 } from '@airgap/serializer'
import { Component } from '@angular/core'
import { AirGapWallet } from '@airgap/coinlib-core'
import { NavigationService } from '../../services/navigation/navigation.service'
import { airgapwallet, CompanionApp } from '../account-address/account-address.page'
import { ErrorCategory, handleErrorLocal } from './../../services/error-handler/error-handler.service'
import { SolflareKeystoneService } from '../../services/solflare-keystone/solflare-keystone.service'

@Component({
  selector: 'airgap-account-share',
  templateUrl: './account-share.page.html',
  styleUrls: ['./account-share.page.scss']
})
export class AccountSharePage {
  public interactionUrl: IACMessageDefinitionObjectV3[] = []
  public companionApp: CompanionApp
  public walletName: string
  public splits: string[] = []
  public solflareSyncQr?: string

  displayRawData: boolean = false

  constructor(
    private readonly navigationService: NavigationService,
    private readonly clipboardService: ClipboardService,
    private readonly solflareKeystoneService: SolflareKeystoneService
  ) {
    const state = this.navigationService.getState()
    this.interactionUrl = state.interactionUrl
    this.companionApp = state.companionApp ?? airgapwallet
    this.walletName = this.companionApp.name

    if (this.companionApp.integration === 'solflare-keystone') {
      const wallet: AirGapWallet | undefined = state.wallet
      if (!wallet || !wallet.masterFingerprint) {
        throw new Error('AirGap Solflare sync requires a wallet with master fingerprint')
      }
      this.solflareSyncQr = this.solflareKeystoneService.encodeAccountSync(
        wallet.publicKey,
        wallet.derivationPath,
        wallet.masterFingerprint
      )
    }
  }

  public done(): void {
    this.navigationService.routeToSecretsTab().catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }

  public copyToClipboard(): void {
    this.clipboardService.copyAndShowToast(this.solflareSyncQr ?? JSON.stringify(this.interactionUrl))
  }
}
