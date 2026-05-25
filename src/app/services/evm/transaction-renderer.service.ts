import { Injectable } from '@angular/core'

import { Erc20Renderer } from '../../renderers/evm/erc20.renderer'
import { Erc721Renderer } from '../../renderers/evm/erc721.renderer'
import { GenericAbiRenderer } from '../../renderers/evm/generic-abi.renderer'
import { MulticallRenderer } from '../../renderers/evm/multicall.renderer'
import { RawHexRenderer } from '../../renderers/evm/raw-hex.renderer'
import { RendererContext, TransactionRenderer, selectorOf } from '../../renderers/evm/base.renderer'

import { AbiDecoderService } from './abi-decoder.service'
import { EvmTransactionInput, RenderResult } from './abi-types'
import { SignatureDatabaseService } from './signature-database.service'

const MAX_DEPTH = 3

@Injectable({ providedIn: 'root' })
export class EvmTransactionRendererService {
  private readonly dedicated: TransactionRenderer[]
  private readonly genericCache = new Map<string, { sig: string; collisions: number } | null>()
  private readonly generic: GenericAbiRenderer
  private readonly rawHex = new RawHexRenderer()

  constructor(
    decoder: AbiDecoderService,
    private readonly db: SignatureDatabaseService
  ) {
    this.dedicated = [
      new Erc20Renderer(decoder),
      new Erc721Renderer(decoder),
      new MulticallRenderer(decoder)
    ]
    this.generic = new GenericAbiRenderer(db, decoder, this.genericCache)
  }

  /**
   * Prefetch all signatures referenced by the transaction (including inner
   * multicall payloads) so the synchronous render() can use them.
   * Honors the recursion depth cap.
   */
  public async getDbMetadata() {
    return this.db.getMetadata()
  }

  public async prepare(tx: EvmTransactionInput): Promise<void> {
    await this.db.initialize()
    const selectors = new Set<string>()
    this.collectSelectors(tx, 0, selectors)
    await Promise.all(
      [...selectors].map(async sel => {
        if (this.genericCache.has(sel)) return
        const r = await this.db.lookup(sel)
        this.genericCache.set(sel, r ? { sig: r.signature, collisions: r.collisions } : null)
      })
    )
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
        functionName: 'Plain transfer',
        rows: [
          { label: 'Function', value: 'Plain value transfer (no calldata)', type: 'text' },
          { label: 'To', value: tx.to, type: 'address' }
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

  private collectSelectors(tx: EvmTransactionInput, depth: number, out: Set<string>): void {
    if (depth >= MAX_DEPTH) return
    const sel = selectorOf(tx.data || '')
    if (sel.length === 8) out.add(sel)
  }
}
