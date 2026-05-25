import { EvmTransactionInput, RenderResult } from '../../services/evm/abi-types'

export interface TransactionRenderer {
  matches(tx: EvmTransactionInput): boolean
  render(tx: EvmTransactionInput, ctx: RendererContext): RenderResult | null
}

export interface RendererContext {
  depth: number
  maxDepth: number
  renderInner(tx: EvmTransactionInput, ctx: RendererContext): RenderResult
}

export function selectorOf(data: string): string {
  const hex = data.startsWith('0x') || data.startsWith('0X') ? data.slice(2) : data
  return hex.slice(0, 8).toLowerCase()
}
