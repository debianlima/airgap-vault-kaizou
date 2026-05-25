export type DecodeSource = 'hardcoded' | 'database'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown'

export type RenderType =
  | 'erc20-transfer'
  | 'erc20-approve'
  | 'erc721-transfer'
  | 'multicall'
  | 'generic-decoded'
  | 'raw-hex'

export type DecodedValue =
  | { kind: 'address'; value: string }
  | { kind: 'uint'; value: bigint; display: string }
  | { kind: 'int'; value: bigint; display: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'bytes'; value: Uint8Array; hex: string }
  | { kind: 'string'; value: string }
  | { kind: 'array'; items: DecodedValue[] }
  | { kind: 'tuple'; fields: DecodedParam[] }

export interface DecodedParam {
  name: string | null
  type: string
  value: DecodedValue
}

export interface DecodedCall {
  selector: string
  signature: string
  functionName: string
  params: DecodedParam[]
  source: DecodeSource
}

export interface SignatureLookupResult {
  signature: string
  selector: string
  collisions: number
}

export interface SignatureDatabaseMetadata {
  generatedAt: string
  sourcifyExportDate: string
  totalSignatures: number
  schemaVersion: number
}

export interface DisplayRow {
  /** i18n key for the label; if absent, `label` is used verbatim */
  labelKey?: string
  /** Plain label fallback (or for synthesised text like "arg0 (uint256)") */
  label?: string
  /** Already-formatted display value (addresses, amounts, etc.) */
  value: string
  /** Optional i18n key whose translation replaces value */
  valueKey?: string
  /** Optional params passed to the translation pipe */
  valueParams?: Record<string, string | number>
  type: 'address' | 'amount' | 'text' | 'hex' | 'warning'
}

export interface RenderResult {
  type: RenderType
  confidence: ConfidenceLevel
  rows: DisplayRow[]
  warningKey?: string
  warningParams?: Record<string, string | number>
  nested?: RenderResult[]
  rawCalldata: string
  functionNameKey?: string
  functionNameParams?: Record<string, string | number>
  /** Plain text fallback if no key is available */
  functionName?: string
}

export interface EvmTransactionInput {
  to: string
  data: string
  value?: string
  chainId?: number
}
