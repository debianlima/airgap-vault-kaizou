/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4.
 * See LICENSE.md, MODIFICATIONS.md and THIRD_PARTY_NOTICES.md.
 */

import { Buffer } from 'buffer'
import * as createHash from 'create-hash'

import { Component } from '@angular/core'

import { MoneroDecodedPayload, MoneroPayloadKind, MoneroUrType } from '../../services/monero-airgap/monero-airgap.service'
import { NavigationService } from '../../services/navigation/navigation.service'

const KIND_LABELS: Record<MoneroPayloadKind, string> = {
  outputs: 'Outputs synchronization',
  keyImages: 'Key-image synchronization',
  unsignedTransaction: 'Unsigned transaction',
  signedTransaction: 'Signed transaction'
}

@Component({
  selector: 'airgap-monero-airgap-detail',
  templateUrl: './monero-airgap-detail.page.html'
})
export class MoneroAirgapDetailPage {
  public readonly kind: MoneroPayloadKind
  public readonly kindLabel: string
  public readonly urType: MoneroUrType
  public readonly size: number
  public readonly sha256: string
  public readonly signingEnabled: boolean = false

  constructor(private readonly navigationService: NavigationService) {
    const payload: MoneroDecodedPayload | undefined = this.navigationService.getState().moneroPayload
    if (!payload || !(payload.bytes instanceof Uint8Array)) {
      throw new Error('Monero review requires an in-memory decoded payload')
    }

    this.kind = payload.kind
    this.kindLabel = KIND_LABELS[payload.kind]
    this.urType = payload.urType
    this.size = payload.bytes.length
    this.sha256 = createHash('sha256').update(Buffer.from(payload.bytes)).digest('hex')
  }
}
