import { EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'
import { TransactionRenderer } from './base.renderer'

export class RawHexRenderer implements TransactionRenderer {
  public matches(_tx: EvmTransactionInput): boolean {
    return true
  }

  public render(tx: EvmTransactionInput): RenderResult {
    return {
      type: 'raw-hex',
      confidence: 'unknown',
      functionNameKey: 'evm-decoder.fn-unknown',
      rows: [
        { labelKey: 'evm-decoder.function-label', valueKey: 'evm-decoder.fn-unknown', value: 'Unknown', type: 'warning' },
        { labelKey: 'evm-decoder.contract-label', value: tx.to, type: 'address' },
        { labelKey: 'evm-decoder.raw-calldata-label', value: tx.data, type: 'hex' }
      ],
      warningKey: 'evm-decoder.unknown-warning',
      rawCalldata: tx.data
    }
  }
}
