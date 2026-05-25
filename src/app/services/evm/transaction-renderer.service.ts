import { Injectable } from '@angular/core'

import { Erc20Renderer } from '../../renderers/evm/erc20.renderer'
import { Erc721Renderer } from '../../renderers/evm/erc721.renderer'
import { GenericAbiRenderer } from '../../renderers/evm/generic-abi.renderer'
import { MulticallRenderer } from '../../renderers/evm/multicall.renderer'
import { RawHexRenderer } from '../../renderers/evm/raw-hex.renderer'
import { RendererContext, TransactionRenderer, selectorOf } from '../../renderers/evm/base.renderer'

import { AbiDecoderService, bytesToHex } from './abi-decoder.service'
import { EvmTransactionInput, RenderResult } from './abi-types'
import { SignatureDatabaseService } from './signature-database.service'

const MAX_DEPTH = 3

const MULTICALL_SIGS: Record<string, string> = {
  ac9650d8: 'multicall(bytes[])',
  '5ae401dc': 'multicall(uint256,bytes[])',
  '1f931c1c': 'multicall(uint256,bytes[])'
}

@Injectable({ providedIn: 'root' })
export class EvmTransactionRendererService {
  private readonly dedicated: TransactionRenderer[]
  private readonly genericCache = new Map<string, { sig: string; collisions: number } | null>()
  private readonly generic: GenericAbiRenderer
  private readonly rawHex = new RawHexRenderer()
  private readonly decoder: AbiDecoderService

  constructor(decoder: AbiDecoderService, private readonly db: SignatureDatabaseService) {
    this.decoder = decoder
    this.dedicated = [new Erc20Renderer(decoder), new Erc721Renderer(decoder), new MulticallRenderer(decoder)]
    this.generic = new GenericAbiRenderer(decoder, this.genericCache)
  }

  public async getDbMetadata() {
    return this.db.getMetadata()
  }

  /**
   * Walk the tx (and inner multicall payloads, depth-capped) to collect every
   * selector we'll need, then prefetch them all in one DB pass.
   */
  public async prepare(tx: EvmTransactionInput): Promise<void> {
    await this.db.initialize()
    const selectors = new Set<string>()
    this.collectSelectors(tx.data, 0, selectors)
    const missing = [...selectors].filter(s => !this.genericCache.has(s))
    if (missing.length === 0) return
    const results = await Promise.all(missing.map(s => this.db.lookup(s)))
    missing.forEach((sel, i) => {
      const r = results[i]
      this.genericCache.set(sel, r ? { sig: r.signature, collisions: r.collisions } : null)
    })
  }

  public render(tx: EvmTransactionInput): RenderResult {
    const ctx: RendererContext = {
      depth: 0,
      maxDepth: MAX_DEPTH,
      renderInner: (innerTx, innerCtx) => this.renderWith(innerTx, innerCtx)
    }
    return this.renderWith(tx, ctx)
  }

  private renderWith(tx: EvmTransactionInput, ctx: RendererContext): RenderResult {
    if (!tx.data || tx.data === '0x' || tx.data.length <= 2) {
      return {
        type: 'raw-hex',
        confidence: 'high',
        functionNameKey: 'evm-decoder.fn-plain-transfer',
        rows: [
          {
            labelKey: 'evm-decoder.function-label',
            valueKey: 'evm-decoder.fn-plain-transfer',
            value: 'Plain value transfer (no calldata)',
            type: 'text'
          },
          { labelKey: 'evm-decoder.to-label', value: tx.to, type: 'address' }
        ],
        rawCalldata: tx.data || '0x'
      }
    }
    for (const r of this.dedicated) {
      if (r.matches(tx)) {
        const result = r.render(tx, ctx)
        if (result) return result
      }
    }
    const fromDb = this.generic.render(tx)
    if (fromDb) return fromDb
    return this.rawHex.render(tx)
  }

  /**
   * Recursively collect selectors. For multicall payloads we use the hardcoded
   * multicall signature to decode the bytes[] without needing the DB, then
   * recurse into each inner call up to the depth cap.
   */
  private collectSelectors(data: string | undefined, depth: number, out: Set<string>): void {
    if (depth >= MAX_DEPTH) return
    if (!data || data.length < 10) return
    const sel = selectorOf(data)
    if (sel.length !== 8) return
    out.add(sel)
    const multicallSig = MULTICALL_SIGS[sel]
    if (!multicallSig) return
    const decoded = this.decoder.decodeWithSignature(data, multicallSig)
    if (!decoded) return
    const arrayParam = decoded.params.find(p => p.value.kind === 'array')
    if (!arrayParam || arrayParam.value.kind !== 'array') return
    for (const item of arrayParam.value.items) {
      if (item.kind !== 'bytes') continue
      this.collectSelectors('0x' + bytesToHex(item.value), depth + 1, out)
    }
  }
}
