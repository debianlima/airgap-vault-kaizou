import { AbiDecoderService, bytesToHex } from '../../services/evm/abi-decoder.service'
import { ConfidenceLevel, EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'
import { RendererContext, selectorOf, TransactionRenderer } from './base.renderer'

const MULTICALL = 'ac9650d8'
const MULTICALL_DEADLINE = '5ae401dc'
const MULTICALL_PREVIOUS_BLOCK = '1f931c1c'

const CONFIDENCE_ORDER: ConfidenceLevel[] = ['high', 'medium', 'low', 'unknown']

export class MulticallRenderer implements TransactionRenderer {
  constructor(private readonly decoder: AbiDecoderService) {}

  public matches(tx: EvmTransactionInput): boolean {
    const sel = selectorOf(tx.data)
    return sel === MULTICALL || sel === MULTICALL_DEADLINE || sel === MULTICALL_PREVIOUS_BLOCK
  }

  public render(tx: EvmTransactionInput, ctx: RendererContext): RenderResult | null {
    if (ctx.depth >= ctx.maxDepth) {
      return {
        type: 'multicall',
        confidence: 'unknown',
        functionName: 'Multicall (depth limit reached)',
        rows: [
          {
            label: 'Function',
            value: `Multicall — nested too deep (max ${ctx.maxDepth})`,
            type: 'warning'
          }
        ],
        warningMessage:
          'Refusing to decode multicall nested deeper than the safety limit. Review raw calldata.',
        rawCalldata: tx.data
      }
    }
    const sel = selectorOf(tx.data)
    const sig =
      sel === MULTICALL
        ? 'multicall(bytes[])'
        : sel === MULTICALL_DEADLINE
        ? 'multicall(uint256,bytes[])'
        : 'multicall(uint256,bytes[])'
    const decoded = this.decoder.decodeWithSignature(tx.data, sig)
    if (!decoded) return null
    const arrayParam = decoded.params.find(p => p.value.kind === 'array')
    if (!arrayParam || arrayParam.value.kind !== 'array') return null
    const inner: RenderResult[] = []
    const innerCtx: RendererContext = { ...ctx, depth: ctx.depth + 1 }
    for (const item of arrayParam.value.items) {
      if (item.kind !== 'bytes') continue
      const innerData = '0x' + bytesToHex(item.value)
      inner.push(
        ctx.renderInner(
          { to: tx.to, data: innerData, value: '0', chainId: tx.chainId },
          innerCtx
        )
      )
    }
    const confidence = inheritConfidence(inner)
    return {
      type: 'multicall',
      confidence,
      functionName: `Multicall (${inner.length} calls)`,
      rows: [
        { label: 'Function', value: `Multicall (${inner.length} calls)`, type: 'text' },
        { label: 'Contract', value: tx.to, type: 'address' }
      ],
      warningMessage:
        'This transaction contains multiple inner calls. Review each one carefully — a single multicall can hide a malicious operation.',
      nested: inner,
      rawCalldata: tx.data
    }
  }
}

function inheritConfidence(results: RenderResult[]): ConfidenceLevel {
  let worst: ConfidenceLevel = 'high'
  for (const r of results) {
    if (CONFIDENCE_ORDER.indexOf(r.confidence) > CONFIDENCE_ORDER.indexOf(worst)) worst = r.confidence
  }
  return worst
}
