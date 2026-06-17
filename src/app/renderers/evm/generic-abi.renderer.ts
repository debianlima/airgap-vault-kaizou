import { AbiDecoderService } from '../../services/evm/abi-decoder.service'
import { DecodedParam, DisplayRow, EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'
import { selectorOf, TransactionRenderer } from './base.renderer'

export class GenericAbiRenderer implements TransactionRenderer {
  constructor(
    private readonly decoder: AbiDecoderService,
    private readonly cache: Map<string, { sig: string; collisions: number } | null>
  ) {}

  public matches(_tx: EvmTransactionInput): boolean {
    return true
  }

  public render(tx: EvmTransactionInput): RenderResult | null {
    const sel = selectorOf(tx.data)
    if (!sel || sel.length < 8) return null
    const cached = this.cache.get(sel)
    if (cached === undefined) return null
    if (cached === null) return null
    const decoded = this.decoder.decodeWithSignature(tx.data, cached.sig, 'database')
    if (!decoded) return null
    const fn = decoded.functionName
    const rows: DisplayRow[] = []
    decoded.params.forEach((p, i) => {
      rows.push(...paramToRows(`arg${i}`, p))
    })
    const collisionWarn = cached.collisions > 1
    return {
      type: 'generic-decoded',
      confidence: collisionWarn ? 'low' : 'medium',
      functionName: `${fn}(…)`,
      rows: [
        { labelKey: 'evm-decoder.function-label', value: fn, type: 'text' },
        { labelKey: 'evm-decoder.contract-label', value: tx.to, type: 'address' },
        ...rows
      ],
      warningKey: collisionWarn ? 'evm-decoder.collision-warning' : 'evm-decoder.database-note',
      warningParams: collisionWarn ? { count: cached.collisions } : undefined,
      rawCalldata: tx.data
    }
  }
}

/** Max array elements rendered before truncating, to keep the signing UI bounded. */
const MAX_ARRAY_ITEMS = 50

/**
 * Strip exactly one trailing array dimension from an ABI type string.
 *   'address[]' -> 'address' ; 'uint256[][]' -> 'uint256[]' ;
 *   'uint256[3]' -> 'uint256' ; '(address,uint256)[]' -> '(address,uint256)'
 * The last '[' is always the outermost dimension (raw types are built left-to-right;
 * tuple brackets are balanced inside '(...)').
 */
export function elementType(arrayType: string): string {
  const i = arrayType.lastIndexOf('[')
  return i === -1 ? arrayType : arrayType.slice(0, i)
}

/**
 * Render a decoded parameter into one or more display rows. Arrays and tuples expand
 * into a header row (with element/field count) followed by one recursively-rendered row
 * per element/field, indented by `depth`, so the signer can verify every recipient and
 * amount in a batched call rather than seeing a collapsed "[N items]" placeholder.
 */
export function paramToRows(label: string, p: DecodedParam, depth = 0): DisplayRow[] {
  const v = p.value
  switch (v.kind) {
    case 'address':
      return [{ label: `${label} (address)`, value: v.value, type: 'address', depth }]
    case 'uint':
      return [{ label: `${label} (${p.type})`, value: v.display, type: 'amount', depth }]
    case 'int':
      return [{ label: `${label} (${p.type})`, value: v.display, type: 'amount', depth }]
    case 'bool':
      return [{ label: `${label} (bool)`, value: v.value ? 'true' : 'false', type: 'text', depth }]
    case 'bytes':
      return [{ label: `${label} (${p.type})`, value: v.hex, type: 'hex', depth }]
    case 'string':
      return [{ label: `${label} (string)`, value: v.value, type: 'text', depth }]
    case 'array': {
      const rows: DisplayRow[] = [
        {
          label: `${label} (${p.type})`,
          value: `${v.items.length} items`,
          valueKey: 'evm-decoder.array-items',
          valueParams: { count: v.items.length },
          type: 'text',
          depth
        }
      ]
      const elemType = elementType(p.type)
      const shown = Math.min(v.items.length, MAX_ARRAY_ITEMS)
      for (let i = 0; i < shown; i++) {
        rows.push(...paramToRows(`${label}[${i}]`, { name: null, type: elemType, value: v.items[i] }, depth + 1))
      }
      if (v.items.length > MAX_ARRAY_ITEMS) {
        rows.push({
          label: `${label} (…)`,
          value: `… and ${v.items.length - MAX_ARRAY_ITEMS} more`,
          valueKey: 'evm-decoder.array-truncated',
          valueParams: { count: v.items.length - MAX_ARRAY_ITEMS },
          type: 'text',
          depth: depth + 1
        })
      }
      return rows
    }
    case 'tuple': {
      const rows: DisplayRow[] = [
        {
          label: `${label} (${p.type})`,
          value: `${v.fields.length} fields`,
          valueKey: 'evm-decoder.tuple-fields',
          valueParams: { count: v.fields.length },
          type: 'text',
          depth
        }
      ]
      v.fields.forEach((f, i) => rows.push(...paramToRows(`${label}[${i}]`, f, depth + 1)))
      return rows
    }
  }
}
