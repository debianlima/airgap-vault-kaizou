import { Component, Input } from '@angular/core'

import { RenderResult } from '../../services/evm/abi-types'

@Component({
  selector: 'airgap-evm-transaction-display',
  templateUrl: './evm-transaction-display.component.html',
  styleUrls: ['./evm-transaction-display.component.scss']
})
export class EvmTransactionDisplayComponent {
  @Input() public result!: RenderResult
  @Input() public dbDate?: string

  public confidenceLabel(): string {
    switch (this.result?.confidence) {
      case 'high':
        return 'Verified standard'
      case 'medium':
        return 'Database match'
      case 'low':
        return 'Ambiguous match'
      case 'unknown':
      default:
        return 'Could not decode'
    }
  }
}
