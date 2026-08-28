/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4.
 * See LICENSE.md, MODIFICATIONS.md and THIRD_PARTY_NOTICES.md.
 */

import { PermissionsService, QrScannerService } from '@airgap/angular-core'
import { Component, Inject, ViewChild } from '@angular/core'
import { Platform } from '@ionic/angular'
import { ZXingScannerComponent } from '@zxing/ngx-scanner'

import { SecurityUtilsPlugin } from '../../capacitor-plugins/definitions'
import { SECURITY_UTILS_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import {
  MoneroKeystonePairingService,
  MoneroPublicPairingSummary
} from '../../services/monero-keystone-pairing/monero-keystone-pairing.service'
import { ScanBasePage } from '../scan-base/scan-base'

@Component({
  selector: 'airgap-monero-keystone-pairing',
  templateUrl: './monero-keystone-pairing.page.html'
})
export class MoneroKeystonePairingPage extends ScanBasePage {
  @ViewChild('scanner')
  public zxingScanner?: ZXingScannerComponent

  public summary?: MoneroPublicPairingSummary
  public error?: string

  constructor(
    platform: Platform,
    scanner: QrScannerService,
    permissionsProvider: PermissionsService,
    @Inject(SECURITY_UTILS_PLUGIN) securityUtils: SecurityUtilsPlugin,
    private readonly pairingService: MoneroKeystonePairingService
  ) {
    super(platform, scanner, permissionsProvider, securityUtils)
  }

  public checkScan(data: string): void {
    try {
      const pairing = this.pairingService.parsePublicPairing(data)
      this.summary = this.pairingService.toSafeSummary(pairing)
      this.error = undefined
      this.stopScan()
    } catch (error) {
      this.summary = undefined
      this.error = error instanceof Error ? error.message : 'Invalid Monero pairing QR'
      this.startScan()
    }
  }

  public scanAgain(): void {
    this.summary = undefined
    this.error = undefined
    this.startScan()
  }
}
