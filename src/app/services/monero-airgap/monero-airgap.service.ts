/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { Buffer } from 'buffer'

import { Injectable } from '@angular/core'
import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur'

export type MoneroUrType = 'xmr-output' | 'xmr-keyimage' | 'xmr-txunsigned' | 'xmr-txsigned'
export type MoneroPayloadKind = 'outputs' | 'keyImages' | 'unsignedTransaction' | 'signedTransaction'

export interface MoneroDecodedPayload {
  urType: MoneroUrType
  kind: MoneroPayloadKind
  bytes: Uint8Array
}

interface MoneroPayloadDefinition {
  kind: MoneroPayloadKind
  urType: MoneroUrType
  label: string
  currentMagic: Buffer
  magicBase: Buffer
  version: number
}

const DEFINITIONS: MoneroPayloadDefinition[] = [
  {
    kind: 'outputs',
    urType: 'xmr-output',
    label: 'outputs',
    currentMagic: Buffer.from('Monero output export\x04', 'binary'),
    magicBase: Buffer.from('Monero output export', 'utf8'),
    version: 4
  },
  {
    kind: 'keyImages',
    urType: 'xmr-keyimage',
    label: 'key images',
    currentMagic: Buffer.from('Monero key image export\x03', 'binary'),
    magicBase: Buffer.from('Monero key image export', 'utf8'),
    version: 3
  },
  {
    kind: 'unsignedTransaction',
    urType: 'xmr-txunsigned',
    label: 'unsigned transaction',
    currentMagic: Buffer.from('Monero unsigned tx set\x05', 'binary'),
    magicBase: Buffer.from('Monero unsigned tx set', 'utf8'),
    version: 5
  },
  {
    kind: 'signedTransaction',
    urType: 'xmr-txsigned',
    label: 'signed transaction',
    currentMagic: Buffer.from('Monero signed tx set\x05', 'binary'),
    magicBase: Buffer.from('Monero signed tx set', 'utf8'),
    version: 5
  }
]

const DEFINITION_BY_KIND = new Map<MoneroPayloadKind, MoneroPayloadDefinition>(DEFINITIONS.map((definition) => [definition.kind, definition]))
const DEFINITION_BY_UR = new Map<MoneroUrType, MoneroPayloadDefinition>(DEFINITIONS.map((definition) => [definition.urType, definition]))

function startsWith(data: Uint8Array, prefix: Uint8Array): boolean {
  if (data.length < prefix.length) return false
  for (let index = 0; index < prefix.length; index++) {
    if (data[index] !== prefix[index]) return false
  }
  return true
}

function encodeCborByteString(payload: Uint8Array): Buffer {
  const length = payload.length
  let header: Buffer
  if (length < 24) {
    header = Buffer.from([0x40 | length])
  } else if (length <= 0xff) {
    header = Buffer.from([0x58, length])
  } else if (length <= 0xffff) {
    header = Buffer.alloc(3)
    header[0] = 0x59
    header.writeUInt16BE(length, 1)
  } else if (length <= 0xffffffff) {
    header = Buffer.alloc(5)
    header[0] = 0x5a
    header.writeUInt32BE(length, 1)
  } else {
    throw new Error('Monero UR payload exceeds the supported 4 GiB CBOR byte-string limit')
  }
  return Buffer.concat([header, Buffer.from(payload)])
}

function decodeCborByteString(cbor: Uint8Array): Uint8Array {
  const data = Buffer.from(cbor)
  if (data.length < 1) throw new Error('Monero UR CBOR payload is empty')
  const initial = data[0]
  if ((initial & 0xe0) !== 0x40) throw new Error('Monero UR CBOR payload must be a byte string')

  const additional = initial & 0x1f
  let headerLength = 1
  let length: number
  if (additional < 24) {
    length = additional
  } else if (additional === 24) {
    if (data.length < 2) throw new Error('Truncated Monero UR CBOR byte-string header')
    headerLength = 2
    length = data[1]
  } else if (additional === 25) {
    if (data.length < 3) throw new Error('Truncated Monero UR CBOR byte-string header')
    headerLength = 3
    length = data.readUInt16BE(1)
  } else if (additional === 26) {
    if (data.length < 5) throw new Error('Truncated Monero UR CBOR byte-string header')
    headerLength = 5
    length = data.readUInt32BE(1)
  } else {
    throw new Error('Unsupported Monero UR CBOR byte-string length encoding')
  }

  if (data.length !== headerLength + length) {
    throw new Error(`Monero UR CBOR byte-string length mismatch: declared ${length}, actual ${data.length - headerLength}`)
  }
  return Uint8Array.from(data.subarray(headerLength))
}

function definitionForPayload(payload: Uint8Array): MoneroPayloadDefinition {
  for (const definition of DEFINITIONS) {
    if (startsWith(payload, definition.currentMagic)) return definition
  }

  for (const definition of DEFINITIONS) {
    if (startsWith(payload, definition.magicBase)) {
      if (payload.length <= definition.magicBase.length) {
        throw new Error(`Monero ${definition.label} payload is missing its wallet2 format version`)
      }
      const actualVersion = payload[definition.magicBase.length]
      throw new Error(
        `Unsupported Monero ${definition.label} wallet2 format version ${actualVersion}; contract requires ${definition.version}`
      )
    }
  }

  throw new Error('Unrecognized Monero wallet2 payload magic')
}

function parseUrType(frame: string): MoneroUrType {
  const normalized = frame.trim().toLowerCase()
  if (!normalized.startsWith('ur:')) throw new Error('Monero transport frame is not a UR')
  const [type] = URDecoder.parse(normalized)
  if (!DEFINITION_BY_UR.has(type as MoneroUrType)) throw new Error(`Unsupported Monero UR type: ${type}`)
  return type as MoneroUrType
}

@Injectable({ providedIn: 'root' })
export class MoneroAirgapService {
  public encode(kind: MoneroPayloadKind, payload: Uint8Array, maxFragmentLength: number = 250): string[] {
    const definition = DEFINITION_BY_KIND.get(kind)
    if (!definition) throw new Error(`Unsupported Monero payload kind: ${kind}`)
    const detected = definitionForPayload(payload)
    if (detected.kind !== definition.kind) {
      throw new Error(`Monero payload kind mismatch: requested ${definition.kind}, detected ${detected.kind}`)
    }
    if (!Number.isSafeInteger(maxFragmentLength) || maxFragmentLength < 10) {
      throw new Error('Monero UR max fragment length must be an integer >= 10')
    }

    const ur = new UR(encodeCborByteString(payload), definition.urType)
    return new UREncoder(ur, maxFragmentLength).encodeWhole()
  }

  public decode(frames: string[]): MoneroDecodedPayload {
    if (frames.length === 0) throw new Error('Monero transport requires at least one UR frame')
    const normalized = frames.map((frame) => frame.trim().toLowerCase())
    const expectedType = parseUrType(normalized[0])
    for (const frame of normalized) {
      if (parseUrType(frame) !== expectedType) throw new Error('Interleaved Monero UR types are not allowed in one payload')
    }

    const decoder = new URDecoder()
    for (const frame of normalized) decoder.receivePart(frame)
    if (!decoder.isComplete()) throw new Error('Incomplete Monero UR fountain stream')
    if (!decoder.isSuccess()) throw new Error(`Invalid Monero UR fountain stream: ${decoder.resultError()}`)

    const result = decoder.resultUR()
    const urType = result.type as MoneroUrType
    if (urType !== expectedType) throw new Error(`Monero UR result type mismatch: expected ${expectedType}, got ${urType}`)
    const bytes = decodeCborByteString(result.cbor)
    const definition = definitionForPayload(bytes)
    if (definition.urType !== urType) {
      throw new Error(`Monero UR/payload mismatch: ${urType} cannot carry ${definition.kind}`)
    }

    return { urType, kind: definition.kind, bytes }
  }
}
