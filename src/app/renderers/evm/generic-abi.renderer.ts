import { AbiDecoderService } from '../../services/evm/abi-decoder.service'
import { DecodedParam, EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'
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
    const rows = decoded.params.map((p, i) => paramToRow(`arg${i}`, p))
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

export function paramToRow(label: string, p: DecodedParam): {
  label: string
  value: string
  type: 'address' | 'amount' | 'text' | 'hex' | 'warning'
  rawValue?: string
} {
  const v = p.value
  switch (v.kind) {
    case 'address':
      return { label: `${label} (address)`, value: v.value, type: 'address' }
    case 'uint':
      return { label: `${label} (${p.type})`, value: v.display, type: 'amount', rawValue: v.display }
    case 'int':
      return { label: `${label} (${p.type})`, value: v.display, type: 'amount' }
    case 'bool':
      return { label: `${label} (bool)`, value: v.value ? 'true' : 'false', type: 'text' }
    case 'bytes':
      return { label: `${label} (${p.type})`, value: v.hex, type: 'hex' }
    case 'string':
      return { label: `${label} (string)`, value: v.value, type: 'text' }
    case 'array':
      return { label: `${label} (${p.type})`, value: `[${v.items.length} items]`, type: 'text' }
    case 'tuple':
      return { label: `${label} (${p.type})`, value: `{${v.fields.length} fields}`, type: 'text' }
  }
}
