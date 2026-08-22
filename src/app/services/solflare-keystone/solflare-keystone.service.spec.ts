import { Buffer } from 'buffer'

import { IACHandlerStatus } from '@airgap/angular-core'
import { CryptoMultiAccounts, SignType, SolSignRequest, SolSignature } from '@keystonehq/bc-ur-registry-sol'
import { URDecoder } from '@ngraveio/bc-ur'

import {
  SolflareKeystoneService,
  SolflareSignRequestHandler,
  extractSignatureForPublicKey,
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

    const serialized = Buffer.from(unsignedTransactionFromMessage(decoded.signData), 'base64')
    expect(serialized[0]).toBe(1)
    expect(serialized.subarray(1, 65).every((byte) => byte === 0)).toBeTrue()
    expect(serialized.subarray(65).equals(message)).toBeTrue()
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
