/*
 * SPDX-License-Identifier: MIT
 * AirGap Vault Kaizou modification/addition, 2026, based on AirGap Vault v3.34.4.
 * See LICENSE.md, MODIFICATIONS.md and THIRD_PARTY_NOTICES.md.
 */

import { Injectable } from '@angular/core'

export interface MoneroPublicPairing {
  version: 0
  primaryAddress: string
  privateViewKey: string
  restoreHeight: number
  encrypted: false
  source?: string
  walletName?: string
}

export interface MoneroPublicPairingSummary {
  version: 0
  primaryAddress: string
  restoreHeight: number
  source: string
  walletName?: string
  privateViewKeyValid: true
}

const MONERO_BASE58 = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{95}$/
const HEX_32_BYTES = /^[0-9a-fA-F]{64}$/

@Injectable({ providedIn: 'root' })
export class MoneroKeystonePairingService {
  public isCandidate(data: string): boolean {
    const trimmed = data.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false
    try {
      const parsed: unknown = JSON.parse(trimmed)
      return this.isObject(parsed) && parsed['version'] === 0 && typeof parsed['primaryAddress'] === 'string'
    } catch {
      return false
    }
  }

  public parsePublicPairing(data: string): MoneroPublicPairing {
    let parsed: unknown
    try {
      parsed = JSON.parse(data.trim())
    } catch {
      throw new Error('Monero pairing QR must contain valid JSON')
    }

    if (!this.isObject(parsed)) throw new Error('Monero pairing QR must contain a JSON object')
    if (parsed['version'] !== 0) throw new Error(`Unsupported Monero pairing version: ${String(parsed['version'])}`)
    if (parsed['encrypted'] === true) {
      throw new Error('Encrypted Keystone Private QR is not supported yet; use the public pairing QR')
    }

    const primaryAddress = parsed['primaryAddress']
    const privateViewKey = parsed['privateViewKey']
    const restoreHeight = parsed['restoreHeight']
    const source = parsed['source']
    const walletName = parsed['walletName']

    if (typeof primaryAddress !== 'string' || !MONERO_BASE58.test(primaryAddress)) {
      throw new Error('Invalid Monero primary address in pairing QR')
    }
    if (typeof privateViewKey !== 'string' || !HEX_32_BYTES.test(privateViewKey)) {
      throw new Error('Invalid Monero private view key in pairing QR')
    }
    if (!Number.isSafeInteger(restoreHeight) || (restoreHeight as number) < 0) {
      throw new Error('Invalid Monero restore height in pairing QR')
    }
    if (source !== undefined && (typeof source !== 'string' || source.length > 80)) {
      throw new Error('Invalid Monero pairing source')
    }
    if (walletName !== undefined && (typeof walletName !== 'string' || walletName.length === 0 || walletName.length > 128)) {
      throw new Error('Invalid Monero wallet name in pairing QR')
    }

    const normalizedSource: string | undefined = source === undefined ? undefined : (source as string)
    const normalizedWalletName: string | undefined = walletName === undefined ? undefined : (walletName as string)

    return {
      version: 0,
      primaryAddress,
      privateViewKey,
      restoreHeight: restoreHeight as number,
      encrypted: false,
      ...(normalizedSource === undefined ? {} : { source: normalizedSource }),
      ...(normalizedWalletName === undefined ? {} : { walletName: normalizedWalletName })
    }
  }

  public toSafeSummary(pairing: MoneroPublicPairing): MoneroPublicPairingSummary {
    return {
      version: 0,
      primaryAddress: pairing.primaryAddress,
      restoreHeight: pairing.restoreHeight,
      source: pairing.source ?? 'Monero view-only QR',
      ...(pairing.walletName === undefined ? {} : { walletName: pairing.walletName }),
      privateViewKeyValid: true
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }
}
