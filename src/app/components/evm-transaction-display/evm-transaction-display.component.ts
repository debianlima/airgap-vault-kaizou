import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { DisplayRow, RenderResult } from '../../services/evm/abi-types'

@Component({
  selector: 'airgap-evm-transaction-display',
  templateUrl: './evm-transaction-display.component.html',
  styleUrls: ['./evm-transaction-display.component.scss']
})
export class EvmTransactionDisplayComponent {
  @Input() public result!: RenderResult
  @Input() public dbDate?: string

  constructor(private readonly translate: TranslateService) {}

  public confidenceLabelKey(): string {
    switch (this.result?.confidence) {
      case 'high':
        return 'evm-decoder.confidence-high'
      case 'medium':
        return 'evm-decoder.confidence-medium'
      case 'low':
        return 'evm-decoder.confidence-low'
      case 'unknown':
      default:
        return 'evm-decoder.confidence-unknown'
    }
  }

  public functionName(): string {
    if (!this.result) return ''
    if (this.result.functionNameKey) {
      return this.translate.instant(this.result.functionNameKey, this.result.functionNameParams)
    }
    return this.result.functionName || ''
  }

  public renderValue(row: DisplayRow): string {
    if (row.valueKey) return this.translate.instant(row.valueKey, row.valueParams)
    return row.value
  }

  public renderLabel(row: DisplayRow): string {
    if (row.labelKey) return this.translate.instant(row.labelKey)
    return row.label || ''
  }
}
