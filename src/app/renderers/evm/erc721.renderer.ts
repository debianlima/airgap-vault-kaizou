import { AbiDecoderService } from '../../services/evm/abi-decoder.service'
import { EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'
import { selectorOf, TransactionRenderer } from './base.renderer'
import { paramAddress, paramUint } from './erc20.renderer'

const TRANSFER_FROM = '23b872dd'
const SAFE_TRANSFER_FROM = '42842e0e'
const SAFE_TRANSFER_FROM_DATA = 'b88d4fde'

/**
 * Selector 23b872dd is shared with ERC-20 transferFrom. The original spec
 * hardcodes it as NFT; reviewer pushback said this is wrong because ERC-20
 * transferFrom is more common in DeFi. We render with low confidence and an
 * explicit ambiguity warning instead of pretending we know.
 */
export class Erc721Renderer implements TransactionRenderer {
  constructor(private readonly decoder: AbiDecoderService) {}

  public matches(tx: EvmTransactionInput): boolean {
    const sel = selectorOf(tx.data)
    return sel === TRANSFER_FROM || sel === SAFE_TRANSFER_FROM || sel === SAFE_TRANSFER_FROM_DATA
  }

  public render(tx: EvmTransactionInput): RenderResult | null {
    const sel = selectorOf(tx.data)
    if (sel === TRANSFER_FROM) return this.renderAmbiguousTransferFrom(tx)
    if (sel === SAFE_TRANSFER_FROM) return this.renderSafeTransferFrom(tx, false)
    if (sel === SAFE_TRANSFER_FROM_DATA) return this.renderSafeTransferFrom(tx, true)
    return null
  }

  private renderAmbiguousTransferFrom(tx: EvmTransactionInput): RenderResult | null {
    const decoded = this.decoder.decodeWithSignature(tx.data, 'transferFrom(address,address,uint256)')
    if (!decoded) return null
    const from = paramAddress(decoded, 0)
    const to = paramAddress(decoded, 1)
    const third = paramUint(decoded, 2)
    if (from === null || to === null || third === null) return null
    return {
      type: 'erc721-transfer',
      confidence: 'low',
      functionName: 'transferFrom (ambiguous)',
      rows: [
        { label: 'Function', value: 'transferFrom (ERC-20 or ERC-721)', type: 'text' },
        { label: 'Contract', value: tx.to, type: 'address' },
        { label: 'From', value: from, type: 'address' },
        { label: 'To', value: to, type: 'address' },
        { label: 'Amount or Token ID', value: third.toString(), type: 'amount' }
      ],
      warningMessage:
        'Selector 0x23b872dd is used by both ERC-20 transferFrom and ERC-721 transferFrom. The third parameter is either a token amount (ERC-20) or a token ID (ERC-721). Verify the contract before signing.',
      rawCalldata: tx.data
    }
  }

  private renderSafeTransferFrom(tx: EvmTransactionInput, withData: boolean): RenderResult | null {
    const sig = withData
      ? 'safeTransferFrom(address,address,uint256,bytes)'
      : 'safeTransferFrom(address,address,uint256)'
    const decoded = this.decoder.decodeWithSignature(tx.data, sig)
    if (!decoded) return null
    const from = paramAddress(decoded, 0)
    const to = paramAddress(decoded, 1)
    const tokenId = paramUint(decoded, 2)
    if (from === null || to === null || tokenId === null) return null
    return {
      type: 'erc721-transfer',
      confidence: 'high',
      functionName: 'NFT Transfer',
      rows: [
        { label: 'Function', value: 'NFT Transfer (safe)', type: 'text' },
        { label: 'Contract', value: tx.to, type: 'address' },
        { label: 'From', value: from, type: 'address' },
        { label: 'To', value: to, type: 'address' },
        { label: 'Token ID', value: tokenId.toString(), type: 'text' }
      ],
      rawCalldata: tx.data
    }
  }
}
