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
  label: string
  value: string
  type: 'address' | 'amount' | 'text' | 'hex' | 'warning'
}

export interface RenderResult {
  type: RenderType
  confidence: ConfidenceLevel
  rows: DisplayRow[]
  warningMessage?: string
  nested?: RenderResult[]
  rawCalldata: string
  functionName?: string
}

export interface EvmTransactionInput {
  to: string
  data: string
  value?: string
  chainId?: number
}
