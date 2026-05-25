import { AbiDecoderService } from '../../services/evm/abi-decoder.service'
import { DecodedCall, EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'
import { formatAmount, isUnlimitedApproval, lookupKnownToken } from '../../services/evm/known-tokens'
import { selectorOf, TransactionRenderer } from './base.renderer'

const TRANSFER = 'a9059cbb'
const APPROVE = '095ea7b3'

export class Erc20Renderer implements TransactionRenderer {
  constructor(private readonly decoder: AbiDecoderService) {}

  public matches(tx: EvmTransactionInput): boolean {
    const sel = selectorOf(tx.data)
    return sel === TRANSFER || sel === APPROVE
  }

  public render(tx: EvmTransactionInput): RenderResult | null {
    const sel = selectorOf(tx.data)
    if (sel === TRANSFER) return this.renderTransfer(tx)
    if (sel === APPROVE) return this.renderApprove(tx)
    return null
  }

  private renderTransfer(tx: EvmTransactionInput): RenderResult | null {
    const decoded = this.decoder.decodeWithSignature(tx.data, 'transfer(address,uint256)')
    if (!decoded) return null
    const to = paramAddress(decoded, 0)
    const amountRaw = paramUint(decoded, 1)
    if (to === null || amountRaw === null) return null
    const token = lookupKnownToken(tx.chainId, tx.to)
    const amount = token
      ? formatAmount(amountRaw, token.decimals, token.symbol)
      : `${amountRaw.toString()} (raw — token decimals unknown)`
    return {
      type: 'erc20-transfer',
      confidence: 'high',
      functionName: 'Token Transfer',
      rows: [
        { label: 'Function', value: 'Token Transfer', type: 'text' },
        { label: 'Contract', value: tx.to, type: 'address' },
        { label: 'To', value: to, type: 'address' },
        { label: 'Amount', value: amount, type: 'amount' }
      ],
      rawCalldata: tx.data
    }
  }

  private renderApprove(tx: EvmTransactionInput): RenderResult | null {
    const decoded = this.decoder.decodeWithSignature(tx.data, 'approve(address,uint256)')
    if (!decoded) return null
    const spender = paramAddress(decoded, 0)
    const amountRaw = paramUint(decoded, 1)
    if (spender === null || amountRaw === null) return null
    const token = lookupKnownToken(tx.chainId, tx.to)
    const unlimited = isUnlimitedApproval(amountRaw)
    const amount = unlimited
      ? 'Unlimited'
      : token
      ? formatAmount(amountRaw, token.decimals, token.symbol)
      : `${amountRaw.toString()} (raw — token decimals unknown)`
    return {
      type: 'erc20-approve',
      confidence: 'high',
      functionName: 'Token Approval',
      rows: [
        { label: 'Function', value: 'Token Approval', type: 'text' },
        { label: 'Contract', value: tx.to, type: 'address' },
        { label: 'Spender', value: spender, type: 'address' },
        { label: 'Amount', value: amount, type: unlimited ? 'warning' : 'amount' }
      ],
      warningMessage:
        'This grants the spender permission to transfer tokens on your behalf. Verify the spender address carefully.',
      rawCalldata: tx.data
    }
  }
}

export function paramAddress(d: DecodedCall, i: number): string | null {
  const v = d.params[i]?.value
  return v && v.kind === 'address' ? v.value : null
}

export function paramUint(d: DecodedCall, i: number): bigint | null {
  const v = d.params[i]?.value
  return v && v.kind === 'uint' ? v.value : null
}

export function paramBytes(d: DecodedCall, i: number): Uint8Array | null {
  const v = d.params[i]?.value
  return v && v.kind === 'bytes' ? v.value : null
}
