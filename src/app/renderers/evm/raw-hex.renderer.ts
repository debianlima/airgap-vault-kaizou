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
      functionName: 'Unknown call',
      rows: [
        { label: 'Function', value: 'Unknown', type: 'warning' },
        { label: 'Contract', value: tx.to, type: 'address' },
        { label: 'Raw calldata', value: tx.data, type: 'hex' }
      ],
      warningMessage:
        'This transaction could not be decoded. This does not mean it is invalid. Review the raw calldata carefully before signing.',
      rawCalldata: tx.data
    }
  }
}
