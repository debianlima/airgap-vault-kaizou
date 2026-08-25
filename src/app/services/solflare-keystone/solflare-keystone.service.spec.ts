/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4
 * (aa50b7f0371ed2e681f358d22b546c7c000e05b7). See LICENSE.md,
 * MODIFICATIONS.md and THIRD_PARTY_NOTICES.md for origin and change scope.
 */

import { Buffer } from 'buffer'

import { IACHandlerStatus } from '@airgap/angular-core'
import { CryptoMultiAccounts, SignType, SolSignRequest, SolSignature } from '@keystonehq/bc-ur-registry-sol'
import { URDecoder } from '@ngraveio/bc-ur'

import {
  SolflareKeystoneService,
  SolflareSignRequestHandler,
  extractSignatureForPublicKey,
  solanaPublicKeyHexFromAddress,
  unsignedTransactionFromMessage
} from './solflare-keystone.service'

function decodeUr(value: string) {
  const decoder = new URDecoder()
  decoder.receivePart(value)
  expect(decoder.isComplete()).toBeTrue()
  expect(decoder.isSuccess()).toBeTrue()
  return decoder.resultUR()
}

describe('SolflareKeystoneService', () => {
  const service = new SolflareKeystoneService()
  const publicKeyHex = 'd39e71bc4c201ce8c4edadeda09d763c26393bbb218b5826b7521ede5e8893c9'
  const path = "m/44'/501'/0'/0'"
  const fingerprint = '12345678'
  const requestId = '550e8400-e29b-41d4-a716-446655440000'
  const requestIdHex = '550e8400e29b41d4a716446655440000'

  it('encodes the Keystone crypto-multi-accounts contract used by Solflare', () => {
    expect(solanaPublicKeyHexFromAddress('HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk')).toBe(
      'f036276246a75b9de3349ed42b15e232f6518fc20f5fcd4f1d64e81f9bd258f7'
    )
    const qr = service.encodeAccountSync(publicKeyHex, path, fingerprint)
    expect(qr.startsWith('ur:crypto-multi-accounts/')).toBeTrue()
    const ur = decodeUr(qr)
    const accounts = CryptoMultiAccounts.fromCBOR(Buffer.from(ur.cbor))
    expect(accounts.getMasterFingerprint().toString('hex')).toBe(fingerprint)
    expect(accounts.getKeys().length).toBe(1)
    expect(accounts.getKeys()[0].getKey().toString('hex')).toBe(publicKeyHex)
    expect(accounts.getKeys()[0].getOrigin().getPath()).toBe("44'/501'/0'/0'")
    expect(accounts.getKeys()[0].getOrigin().getSourceFingerprint().toString('hex')).toBe(fingerprint)
  })

  it('decodes Solflare sol-sign-request and creates a valid unsigned serialized transaction', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const recipient = Buffer.alloc(32, 7)
    const blockhash = Buffer.alloc(32, 9)
    const message = Buffer.concat([
      Buffer.from([1, 0, 1]),
      Buffer.from([2]), signer, recipient,
      blockhash,
      Buffer.from([0])
    ])
    const request = SolSignRequest.constructSOLRequest(message, path, fingerprint, SignType.Transaction, requestId)
    const qr = request.toUREncoder(1000).encodeWhole()[0]
    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    expect(await handler.receive(qr)).toBe(IACHandlerStatus.SUCCESS)
    expect(await handler.getDataSingle()).toBe(qr)
    const handled = await handler.getResult()
    expect(handled?.data).toBe(qr)
    const handledPayload = handled?.result[0].payload as any
    expect(handledPayload.transaction.encoding).toBe('base64')
    expect(Buffer.from(handledPayload.transaction.transaction, 'base64').subarray(65).equals(message)).toBeTrue()
    expect(handledPayload.publicKey).toBe('')
    expect(handledPayload.callbackURL).toBe('')

    const ur = decodeUr(qr)
    const decoded = service.decodeSignRequestCbor(Uint8Array.from(ur.cbor))
    expect(Buffer.from(decoded.signData).equals(message)).toBeTrue()
    expect(decoded.derivationPath).toBe(path)
    expect(decoded.sourceFingerprint).toBe(fingerprint)
    expect(decoded.requestIdHex).toBe(requestIdHex)
    expect(decoded.signType).toBe(SignType.Transaction)

    const serialized = Buffer.from(unsignedTransactionFromMessage(decoded.signData), 'base64')
    expect(serialized[0]).toBe(1)
    expect(serialized.subarray(1, 65).every((byte) => byte === 0)).toBeTrue()
    expect(serialized.subarray(65).equals(message)).toBeTrue()
  })

  it('accumulates multipart Solflare UR and preserves a complete serialized versioned transaction', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const recipient = Buffer.alloc(32, 7)
    const blockhash = Buffer.alloc(32, 9)
    const versionedMessage = Buffer.concat([
      Buffer.from([0x80, 1, 0, 1]),
      Buffer.from([2]),
      signer,
      recipient,
      blockhash,
      Buffer.from([0, 0])
    ])
    const serializedTransaction = Buffer.concat([Buffer.from([1]), Buffer.alloc(64), versionedMessage])
    const request = SolSignRequest.constructSOLRequest(serializedTransaction, path, fingerprint, SignType.Transaction, requestId)
    const frames = request.toUREncoder(120).encodeWhole().map((frame) => frame.toUpperCase())
    expect(frames.length).toBeGreaterThan(1)

    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    let status: IACHandlerStatus = IACHandlerStatus.PARTIAL
    for (const frame of frames) {
      status = await handler.receive(frame)
    }
    expect(status).toBe(IACHandlerStatus.SUCCESS)

    const handled = await handler.getResult()
    const handledPayload = handled?.result[0].payload as any
    expect(handledPayload.transaction.encoding).toBe('base64')
    expect(Buffer.from(handledPayload.transaction.transaction, 'base64').equals(serializedTransaction)).toBeTrue()
  })

  it('accepts multipart SignType.Message used by real Solflare dynamic QR', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const secondSigner = Buffer.alloc(32, 0x22)
    const blockhash = Buffer.alloc(32, 9)
    const versionedMessage = Buffer.concat([
      Buffer.from([0x80, 2, 0, 0]),
      Buffer.from([2]),
      signer,
      secondSigner,
      blockhash,
      Buffer.from([0, 0])
    ])
    const request = SolSignRequest.constructSOLRequest(versionedMessage, path, fingerprint, SignType.Message, requestId)
    const frames = request.toUREncoder(120).encodeWhole().map((frame) => frame.toUpperCase())
    expect(frames.length).toBeGreaterThan(1)

    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    let status: IACHandlerStatus = IACHandlerStatus.PARTIAL
    for (const frame of frames) {
      status = await handler.receive(frame)
    }
    expect(status).toBe(IACHandlerStatus.SUCCESS)

    const decodedRequest = service.decodeSignRequestCbor(
      Uint8Array.from(decodeUr(request.toUREncoder(1000).encodeWhole()[0]).cbor)
    )
    expect(decodedRequest.signType).toBe(SignType.Message)

    const handled = await handler.getResult()
    const serialized = Buffer.from((handled?.result[0].payload as any).transaction.transaction, 'base64')
    expect(serialized[0]).toBe(2)
    expect(serialized.subarray(1, 129).every((byte) => byte === 0)).toBeTrue()
    expect(serialized.subarray(129).equals(versionedMessage)).toBeTrue()
  })

  it('ignores a corrupted multipart fountain frame and completes from later valid Solflare frames', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const secondSigner = Buffer.alloc(32, 0x22)
    const blockhash = Buffer.alloc(32, 9)
    const versionedMessage = Buffer.concat([
      Buffer.from([0x80, 2, 0, 0]),
      Buffer.from([2]),
      signer,
      secondSigner,
      blockhash,
      Buffer.from([0, 0])
    ])
    const request = SolSignRequest.constructSOLRequest(versionedMessage, path, fingerprint, SignType.Message, requestId)
    const frames = request.toUREncoder(80).encodeWhole().map((frame) => frame.toUpperCase())
    expect(frames.length).toBeGreaterThan(1)

    const corrupt = frames[1].slice(0, -1) + (frames[1].endsWith('A') ? 'B' : 'A')
    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    expect(await handler.receive(frames[0])).toBe(IACHandlerStatus.PARTIAL)
    expect(await handler.receive(corrupt)).toBe(IACHandlerStatus.PARTIAL)

    let status: IACHandlerStatus = IACHandlerStatus.PARTIAL
    for (const frame of frames.slice(1)) {
      status = await handler.receive(frame)
      if (status === IACHandlerStatus.SUCCESS) break
    }
    expect(status).toBe(IACHandlerStatus.SUCCESS)
    const handled = await handler.getResult()
    const serialized = Buffer.from((handled?.result[0].payload as any).transaction.transaction, 'base64')
    expect(serialized.subarray(129).equals(versionedMessage)).toBeTrue()
  })

  it('normalizes harmless whitespace and case before decoding Solflare fountain frames', async () => {
    const message = Buffer.concat([
      Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), Buffer.from(publicKeyHex, 'hex'), Buffer.alloc(32, 9), Buffer.from([0, 0])
    ])
    const request = SolSignRequest.constructSOLRequest(message, path, fingerprint, SignType.Message, requestId)
    const frames = request.toUREncoder(80).encodeWhole()
    expect(frames.length).toBeGreaterThan(1)

    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    let status = IACHandlerStatus.PARTIAL
    for (const frame of frames) {
      status = await handler.receive(` \n${frame.toUpperCase()}\t `)
    }
    expect(status).toBe(IACHandlerStatus.SUCCESS)
    const handled = await handler.getResult()
    expect(Buffer.from((handled?.result[0].payload as any).transaction.transaction, 'base64').subarray(65).equals(message)).toBeTrue()
  })

  it('isolates a stale partial request so a later valid request can complete', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const targetMessage = Buffer.concat([Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), signer, Buffer.alloc(32, 9), Buffer.from([0, 0])])
    const staleMessage = Buffer.concat([Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), signer, Buffer.alloc(32, 8), Buffer.from([0, 0])])
    const target = SolSignRequest.constructSOLRequest(targetMessage, path, fingerprint, SignType.Message, requestId)
    const stale = SolSignRequest.constructSOLRequest(staleMessage, path, fingerprint, SignType.Message, '650e8400-e29b-41d4-a716-446655440000')
    const targetFrames = target.toUREncoder(80).encodeWhole()
    const staleFrames = stale.toUREncoder(80).encodeWhole()
    expect(targetFrames.length).toBeGreaterThan(1)
    expect(staleFrames.length).toBeGreaterThan(1)

    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    expect(await handler.receive(staleFrames[0])).toBe(IACHandlerStatus.PARTIAL)
    let status = IACHandlerStatus.PARTIAL
    for (const frame of targetFrames) status = await handler.receive(frame)
    for (let i = 0; i < 5 && status !== IACHandlerStatus.SUCCESS; i++) status = await handler.receive(targetFrames[i % targetFrames.length])
    expect(status).toBe(IACHandlerStatus.SUCCESS)
    const handled = await handler.getResult()
    expect(Buffer.from((handled?.result[0].payload as any).transaction.transaction, 'base64').subarray(65).equals(targetMessage)).toBeTrue()
  })

  it('keeps two independently complete interleaved requests ambiguous instead of auto-selecting one', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const messageA = Buffer.concat([Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), signer, Buffer.alloc(32, 9), Buffer.from([0, 0])])
    const messageB = Buffer.concat([Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), signer, Buffer.alloc(32, 8), Buffer.from([0, 0])])
    const requestA = SolSignRequest.constructSOLRequest(messageA, path, fingerprint, SignType.Message, requestId)
    const requestB = SolSignRequest.constructSOLRequest(messageB, path, fingerprint, SignType.Message, '750e8400-e29b-41d4-a716-446655440000')
    const a = requestA.toUREncoder(80).encodeWhole()
    const b = requestB.toUREncoder(80).encodeWhole()
    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    let status = IACHandlerStatus.PARTIAL
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i < a.length) status = await handler.receive(a[i])
      if (i < b.length) status = await handler.receive(b[i])
    }
    expect(status).toBe(IACHandlerStatus.PARTIAL)
    expect(await handler.getResult()).toBeUndefined()
  })

  it('bounds stale concurrent Solflare streams and still completes the newest valid request', async () => {
    const signer = Buffer.from(publicKeyHex, 'hex')
    const makeRequest = (fill: number, idPrefix: string) => SolSignRequest.constructSOLRequest(
      Buffer.concat([Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), signer, Buffer.alloc(32, fill), Buffer.from([0, 0])]),
      path,
      fingerprint,
      SignType.Message,
      `${idPrefix.repeat(8)}-e29b-41d4-a716-446655440000`
    )
    const stale = [1, 2, 3, 4, 5].map((fill, index) => makeRequest(fill, String(index + 1)).toUREncoder(80).encodeWhole())
    const targetMessage = Buffer.concat([Buffer.from([0x80, 1, 0, 0]), Buffer.from([1]), signer, Buffer.alloc(32, 9), Buffer.from([0, 0])])
    const targetFrames = SolSignRequest.constructSOLRequest(targetMessage, path, fingerprint, SignType.Message, requestId).toUREncoder(80).encodeWhole()
    const handler = new SolflareSignRequestHandler(service, async () => undefined)
    for (const frames of stale) expect(await handler.receive(frames[0])).toBe(IACHandlerStatus.PARTIAL)
    let status = IACHandlerStatus.PARTIAL
    for (const frame of targetFrames) status = await handler.receive(frame)
    for (let i = 0; i < 8 && status !== IACHandlerStatus.SUCCESS; i++) status = await handler.receive(targetFrames[i % targetFrames.length])
    expect(status).toBe(IACHandlerStatus.SUCCESS)
    const handled = await handler.getResult()
    expect(Buffer.from((handled?.result[0].payload as any).transaction.transaction, 'base64').subarray(65).equals(targetMessage)).toBeTrue()
  })

  it('extracts the signature matching the required signer and encodes sol-signature with the same requestId', () => {
    const secondSignerHex = 'ad8f57924dce62f9040f93b4f6ce3c3d39afde7e29bcb4013dad59db7913c4c7'
    const keys = Buffer.concat([Buffer.from(publicKeyHex, 'hex'), Buffer.from(secondSignerHex, 'hex')])
    const message = Buffer.concat([
      Buffer.from([2, 0, 0]),
      Buffer.from([2]), keys,
      Buffer.alloc(32, 3),
      Buffer.from([0])
    ])
    const sig1 = Buffer.alloc(64, 0x11)
    const sig2 = Buffer.alloc(64, 0x22)
    const signed = Buffer.concat([Buffer.from([2]), sig1, sig2, message]).toString('base64')
    const extracted = extractSignatureForPublicKey(signed, secondSignerHex)
    expect(Buffer.from(extracted).equals(sig2)).toBeTrue()

    const qr = service.encodeSignature(extracted, requestIdHex)
    expect(qr.startsWith('ur:sol-signature/')).toBeTrue()
    const ur = decodeUr(qr)
    const response = SolSignature.fromCBOR(Buffer.from(ur.cbor))
    expect(response.getSignature().equals(sig2)).toBeTrue()
    expect(response.getRequestId().toString('hex')).toBe(requestIdHex)
  })
})
