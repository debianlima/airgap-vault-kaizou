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
        functionNameKey: 'evm-decoder.fn-multicall-depth',
        functionNameParams: { max: ctx.maxDepth },
        rows: [
          {
            labelKey: 'evm-decoder.function-label',
            valueKey: 'evm-decoder.fn-multicall-depth',
            valueParams: { max: ctx.maxDepth },
            value: 'Multicall nested too deep',
            type: 'warning'
          }
        ],
        warningKey: 'evm-decoder.multicall-depth-warning',
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
      inner.push(ctx.renderInner({ to: tx.to, data: innerData, value: '0', chainId: tx.chainId }, innerCtx))
    }
    const confidence = inheritConfidence(inner)
    return {
      type: 'multicall',
      confidence,
      functionNameKey: 'evm-decoder.fn-multicall',
      functionNameParams: { count: inner.length },
      rows: [
        {
          labelKey: 'evm-decoder.function-label',
          valueKey: 'evm-decoder.fn-multicall',
          valueParams: { count: inner.length },
          value: `Multicall (${inner.length} calls)`,
          type: 'text'
        },
        { labelKey: 'evm-decoder.contract-label', value: tx.to, type: 'address' }
      ],
      warningKey: 'evm-decoder.multicall-warning',
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
