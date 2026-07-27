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

/**
 * Selectors that must never be treated as embedded calldata. 0x00000000 and
 * 0xffffffff are ABI zero-padding / sentinels that collide with thousands of
 * junk signatures in the database (e.g. a Gnosis Safe `signatures` blob often
 * starts with 0x00000000), so recursively decoding them produces dangerous noise.
 */
export const BLOCKED_SELECTORS: ReadonlySet<string> = new Set(['00000000', 'ffffffff'])

export function isBlockedSelector(selector: string): boolean {
  return BLOCKED_SELECTORS.has(selector.toLowerCase())
}

/**
 * Cheap structural test for "this byte string is ABI-encoded calldata": it must
 * be a 4-byte selector followed by zero or more whole 32-byte words (length =
 * 4 + 32·k). This also conveniently rejects fixed-size `bytesN` values such as
 * bytes32 (length 32), which are data, not calldata.
 */
export function looksLikeCalldata(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && (bytes.length - 4) % 32 === 0
}
