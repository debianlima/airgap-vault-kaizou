import { Buffer } from 'buffer'
import * as bs58 from 'bs58'

import { IACHandlerStatus, IACMessageHandler, IACMessageWrapper } from '@airgap/angular-core'
import { ProtocolSymbols } from '@airgap/coinlib-core'
import { IACMessageDefinitionObjectV3, IACMessageType, generateId } from '@airgap/serializer'
import {
  CryptoHDKey,
  CryptoKeypath,
  CryptoMultiAccounts,
  PathComponent,
  SignType,
  SolSignature,
  SolSignRequest,
  extend as RegistryExtend
} from '@keystonehq/bc-ur-registry-sol'
import { URDecoder } from '@ngraveio/bc-ur'
import { Injectable } from '@angular/core'

export const SOLFLARE_KEYSTONE_PROTOCOL: ProtocolSymbols = 'solana' as ProtocolSymbols
export const SOLFLARE_KEYSTONE_REQUEST_CONTEXTS = 'airgap-vault-kaizou-solflare-request-contexts'

export interface SolflareRequestContext {
  requestIdHex: string
  derivationPath: string
  sourceFingerprint: string
}

export interface SolflareDecodedSignRequest extends SolflareRequestContext {
  signData: Uint8Array
  signType: SignType
}

function assertHex(value: string, bytes: number, label: string): void {
  if (!new RegExp(`^[0-9a-fA-F]{${bytes * 2}}$`).test(value)) {
    throw new Error(`${label} must be exactly ${bytes} bytes encoded as hex`)
  }
}

function normalizePath(path: string): string {
  return path.startsWith('m/') ? path : `m/${path}`
}

function parsePath(path: string): PathComponent[] {
  const normalized = normalizePath(path).slice(2)
  if (!normalized) {
    throw new Error('Solana derivation path is empty')
  }
  return normalized.split('/').map((part) => {
    const hardened = part.endsWith("'") || part.endsWith('h')
    const numeric = hardened ? part.slice(0, -1) : part
    if (!/^\d+$/.test(numeric)) {
      throw new Error(`Invalid Solana derivation path component: ${part}`)
    }
    return new PathComponent({ index: Number(numeric), hardened })
  })
}

function encodeShortVec(value: number): Buffer {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Invalid Solana shortvec value')
  }
  const bytes: number[] = []
  let remaining = value
  do {
    let current = remaining & 0x7f
    remaining = Math.floor(remaining / 128)
    if (remaining > 0) current |= 0x80
    bytes.push(current)
  } while (remaining > 0)
  return Buffer.from(bytes)
}

function decodeShortVec(data: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0
  let shift = 0
  let cursor = offset
  while (cursor < data.length) {
    const current = data[cursor++]
    value |= (current & 0x7f) << shift
    if ((current & 0x80) === 0) return { value, next: cursor }
    shift += 7
    if (shift > 28) throw new Error('Solana shortvec is too large')
  }
  throw new Error('Truncated Solana shortvec')
}

function messageHeaderOffset(message: Uint8Array): number {
  if (message.length < 3) throw new Error('Solana message is too short')
  return (message[0] & 0x80) !== 0 ? 1 : 0
}

export function unsignedTransactionFromMessage(signData: Uint8Array): string {
  const message = Buffer.from(signData)
  const headerOffset = messageHeaderOffset(message)
  if (message.length < headerOffset + 3) throw new Error('Solana message header is truncated')
  const requiredSignatures = message[headerOffset]
  if (requiredSignatures < 1) throw new Error('Solana message has no required signer')
  const signatureCount = encodeShortVec(requiredSignatures)
  const transaction = new Uint8Array(signatureCount.length + requiredSignatures * 64 + message.length)
  transaction.set(signatureCount, 0)
  transaction.set(message, signatureCount.length + requiredSignatures * 64)
  return Buffer.from(transaction).toString('base64')
}

function isCompleteSolanaMessage(data: Uint8Array): boolean {
  try {
    const message = Buffer.from(data)
    const headerOffset = messageHeaderOffset(message)
    if (message.length < headerOffset + 3) return false

    let cursor = headerOffset + 3
    const keyCount = decodeShortVec(message, cursor)
    cursor = keyCount.next + keyCount.value * 32
    if (cursor + 32 > message.length) return false
    cursor += 32

    const instructionCount = decodeShortVec(message, cursor)
    cursor = instructionCount.next
    for (let i = 0; i < instructionCount.value; i++) {
      if (cursor >= message.length) return false
      cursor += 1

      const accountCount = decodeShortVec(message, cursor)
      cursor = accountCount.next + accountCount.value
      if (cursor > message.length) return false

      const dataLength = decodeShortVec(message, cursor)
      cursor = dataLength.next + dataLength.value
      if (cursor > message.length) return false
    }

    if (headerOffset === 1) {
      const lookupCount = decodeShortVec(message, cursor)
      cursor = lookupCount.next
      for (let i = 0; i < lookupCount.value; i++) {
        if (cursor + 32 > message.length) return false
        cursor += 32

        const writableCount = decodeShortVec(message, cursor)
        cursor = writableCount.next + writableCount.value
        if (cursor > message.length) return false

        const readonlyCount = decodeShortVec(message, cursor)
        cursor = readonlyCount.next + readonlyCount.value
        if (cursor > message.length) return false
      }
    }

    return cursor === message.length
  } catch {
    return false
  }
}

function isCompleteSerializedTransaction(signData: Uint8Array): boolean {
  try {
    const transaction = Buffer.from(signData)
    const signatures = decodeShortVec(transaction, 0)
    if (signatures.value < 1) return false
    const messageStart = signatures.next + signatures.value * 64
    if (messageStart >= transaction.length) return false

    const message = transaction.subarray(messageStart)
    if (!isCompleteSolanaMessage(message)) return false
    const headerOffset = messageHeaderOffset(message)
    return message[headerOffset] === signatures.value
  } catch {
    return false
  }
}

export function unsignedTransactionFromSignData(signData: Uint8Array): string {
  const bytes = Buffer.from(signData)
  if (isCompleteSerializedTransaction(bytes)) {
    return bytes.toString('base64')
  }
  return unsignedTransactionFromMessage(bytes)
}

export function unsignedTransactionFromSignRequest(signData: Uint8Array, signType: SignType): string {
  if (signType === SignType.Message) {
    return unsignedTransactionFromMessage(signData)
  }
  if (signType === SignType.Transaction) {
    return unsignedTransactionFromSignData(signData)
  }
  throw new Error(`Unsupported Solflare Solana sign type: ${signType}`)
}

export function solanaPublicKeyHexFromAddress(address: string): string {
  const decoded = bs58.decode(address)
  if (decoded.length !== 32) {
    throw new Error(`Solana receiving address must decode to 32 bytes, got ${decoded.length}`)
  }
  return Buffer.from(decoded).toString('hex')
}

export function extractSignatureForPublicKey(signedTransactionBase64: string, publicKeyHex: string): Uint8Array {
  assertHex(publicKeyHex, 32, 'Solana public key')
  const serialized = Buffer.from(signedTransactionBase64, 'base64')
  const signatures = decodeShortVec(serialized, 0)
  if (signatures.value < 1) throw new Error('Signed Solana transaction contains no signatures')
  const signaturesEnd = signatures.next + signatures.value * 64
  if (signaturesEnd > serialized.length) throw new Error('Signed Solana transaction signature section is truncated')

  const message = serialized.subarray(signaturesEnd)
  const headerOffset = messageHeaderOffset(message)
  if (message.length < headerOffset + 3) throw new Error('Signed Solana message header is truncated')
  const requiredSignatures = message[headerOffset]
  if (requiredSignatures !== signatures.value) throw new Error('Solana signature count does not match message header')

  const keyCount = decodeShortVec(message, headerOffset + 3)
  const keysStart = keyCount.next
  if (keysStart + keyCount.value * 32 > message.length) throw new Error('Solana account key section is truncated')

  const expected = Buffer.from(publicKeyHex, 'hex')
  let signerIndex = -1
  for (let i = 0; i < requiredSignatures; i++) {
    const key = message.subarray(keysStart + i * 32, keysStart + (i + 1) * 32)
    if (key.equals(expected)) {
      signerIndex = i
      break
    }
  }
  if (signerIndex < 0) throw new Error('AirGap Solana public key is not a required signer')

  const signature = serialized.subarray(signatures.next + signerIndex * 64, signatures.next + (signerIndex + 1) * 64)
  if (signature.every((byte) => byte === 0)) throw new Error('AirGap Solana signature is empty')
  return Uint8Array.from(signature)
}

function decodeSignRequestFromCbor(cbor: Uint8Array): SolflareDecodedSignRequest {
  const dataItem = RegistryExtend.decodeToDataItem(Buffer.from(cbor))
  const request = SolSignRequest.fromDataItem(dataItem)
  const signType = request.getSignType()
  if (signType !== SignType.Transaction && signType !== SignType.Message) {
    throw new Error(`Unsupported Solflare Solana sign type: ${signType}`)
  }
  const requestId = request.getRequestId()
  if (!requestId || requestId.length !== 16) throw new Error('Solflare sign request must contain a 16-byte requestId')

  const data = dataItem.getData() as Record<number, any>
  const keypathItem = data[3]
  if (!keypathItem) throw new Error('Solflare sign request is missing derivation keypath')
  const keypath = CryptoKeypath.fromDataItem(keypathItem)
  const sourceFingerprint = keypath.getSourceFingerprint()
  if (!sourceFingerprint || sourceFingerprint.length !== 4) {
    throw new Error('Solflare sign request is missing a 4-byte source fingerprint')
  }

  return {
    signData: Uint8Array.from(request.getSignData()),
    signType,
    requestIdHex: requestId.toString('hex'),
    derivationPath: normalizePath(request.getDerivationPath()),
    sourceFingerprint: sourceFingerprint.toString('hex')
  }
}

@Injectable({ providedIn: 'root' })
export class SolflareKeystoneService {
  public encodeAccountSync(publicKeyHex: string, derivationPath: string, masterFingerprint: string): string {
    assertHex(publicKeyHex, 32, 'Solana public key')
    assertHex(masterFingerprint, 4, 'Solana master fingerprint')
    const fingerprint = Buffer.from(masterFingerprint, 'hex')
    const components = parsePath(derivationPath)
    const origin = new CryptoKeypath(components, fingerprint, components.length)
    const key = new CryptoHDKey({
      isMaster: false,
      isPrivateKey: false,
      key: Buffer.from(publicKeyHex, 'hex'),
      origin,
      name: 'SOL-0'
    })
    const accounts = new CryptoMultiAccounts(fingerprint, [key], 'AirGap Vault Kaizou', 'airgap-vault-kaizou')
    const parts = accounts.toUREncoder(1000).encodeWhole()
    if (parts.length !== 1) throw new Error(`Expected single-part Solflare sync QR, got ${parts.length}`)
    return parts[0]
  }

  public decodeSignRequestCbor(cbor: Uint8Array): SolflareDecodedSignRequest {
    return decodeSignRequestFromCbor(cbor)
  }

  public encodeSignature(signature: Uint8Array, requestIdHex: string): string {
    if (signature.length !== 64) throw new Error('Solana signature must be exactly 64 bytes')
    assertHex(requestIdHex, 16, 'Solflare requestId')
    const response = new SolSignature(Buffer.from(signature), Buffer.from(requestIdHex, 'hex'))
    const parts = response.toUREncoder(1000).encodeWhole()
    if (parts.length !== 1) throw new Error(`Expected single-part Solflare signature QR, got ${parts.length}`)
    return parts[0]
  }

  public rememberRequest(internalId: number, context: SolflareRequestContext): void {
    const current = JSON.parse(localStorage.getItem(SOLFLARE_KEYSTONE_REQUEST_CONTEXTS) ?? '{}')
    current[String(internalId)] = context
    localStorage.setItem(SOLFLARE_KEYSTONE_REQUEST_CONTEXTS, JSON.stringify(current))
  }

  public getRequest(internalId: number): SolflareRequestContext | undefined {
    const current = JSON.parse(localStorage.getItem(SOLFLARE_KEYSTONE_REQUEST_CONTEXTS) ?? '{}')
    return current[String(internalId)]
  }

  public forgetRequest(internalId: number): void {
    const current = JSON.parse(localStorage.getItem(SOLFLARE_KEYSTONE_REQUEST_CONTEXTS) ?? '{}')
    delete current[String(internalId)]
    localStorage.setItem(SOLFLARE_KEYSTONE_REQUEST_CONTEXTS, JSON.stringify(current))
  }
}

export class SolflareSignRequestHandler implements IACMessageHandler<IACMessageDefinitionObjectV3[]> {
  public readonly name = 'SolflareSignRequestHandler'
  private decoder = new URDecoder()
  private readonly parts = new Set<string>()
  private resultCache?: IACMessageWrapper<IACMessageDefinitionObjectV3[]>

  constructor(
    private readonly service: SolflareKeystoneService,
    private readonly onComplete: (wrapper: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => Promise<void>
  ) {}

  public async canHandle(data: string): Promise<boolean> {
    return /^ur:sol-sign-request\//i.test(data)
  }

  public async receive(data: string): Promise<IACHandlerStatus> {
    if (!(await this.canHandle(data))) return IACHandlerStatus.UNSUPPORTED
    if (this.parts.has(data)) return IACHandlerStatus.PARTIAL
    this.parts.add(data)
    try {
      const accepted = this.decoder.receivePart(data)
      if (!accepted) return IACHandlerStatus.PARTIAL
    } catch {
      return IACHandlerStatus.UNSUPPORTED
    }
    return this.decoder.isComplete() && this.decoder.isSuccess() ? IACHandlerStatus.SUCCESS : IACHandlerStatus.PARTIAL
  }

  public async handleComplete(): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]>> {
    const result = await this.getResult()
    if (!result) throw new Error('Solflare sign request is incomplete')
    await this.onComplete(result)
    return result
  }

  public async getProgress(): Promise<number> {
    return Number(this.decoder.estimatedPercentComplete().toFixed(2))
  }

  public async getResult(): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]> | undefined> {
    if (this.resultCache) return this.resultCache
    if (!this.decoder.isComplete() || !this.decoder.isSuccess()) return undefined
    const ur = this.decoder.resultUR()
    if (ur.type !== 'sol-sign-request') throw new Error(`Unexpected UR type: ${ur.type}`)
    const request = this.service.decodeSignRequestCbor(Uint8Array.from(ur.cbor))
    const internalId = generateId(8)
    this.service.rememberRequest(internalId, {
      requestIdHex: request.requestIdHex,
      derivationPath: request.derivationPath,
      sourceFingerprint: request.sourceFingerprint
    })
    this.resultCache = {
      result: [
        {
          id: internalId,
          protocol: SOLFLARE_KEYSTONE_PROTOCOL,
          type: IACMessageType.TransactionSignRequest,
          payload: {
            transaction: {
              transaction: unsignedTransactionFromSignRequest(request.signData, request.signType),
              encoding: 'base64'
            },
            publicKey: '',
            callbackURL: ''
          } as any
        }
      ],
      data: await this.getDataSingle(),
      context: {
        requestId: request.requestIdHex,
        derivationPath: request.derivationPath,
        sourceFingerprint: request.sourceFingerprint
      }
    }
    return this.resultCache
  }

  public async getDataSingle(): Promise<string | undefined> {
    if (!this.decoder.isComplete() || !this.decoder.isSuccess() || this.parts.size !== 1) return undefined
    return this.parts.values().next().value
  }

  public async reset(): Promise<void> {
    this.decoder = new URDecoder()
    this.parts.clear()
    this.resultCache = undefined
  }
}
