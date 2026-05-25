import { IAirGapTransaction, ProtocolSymbols } from '@airgap/coinlib-core'
import { Component, Input, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { ContactsService } from 'src/app/services/contacts/contacts.service'

import { RenderResult } from '../../services/evm/abi-types'
import { chainIdForProtocol, isEvmProtocol } from '../../services/evm/protocol-mapping'
import { EvmTransactionRendererService } from '../../services/evm/transaction-renderer.service'

import { AggregatedDetails, TransactionStore } from './transaction.store'

@Component({
  selector: 'airgap-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss'],
  providers: [TransactionStore]
})
export class TransactionComponent implements OnInit {
  @Input()
  public airGapTxs: IAirGapTransaction[] | undefined

  @Input()
  public rawdata: string | undefined

  public protocolIdentifier$: Observable<ProtocolSymbols | undefined>
  public airGapTxs$: Observable<IAirGapTransaction[]>
  public aggregatedDetails$: Observable<AggregatedDetails | undefined>

  public evmResults: (RenderResult | null)[] = []
  public dbDate?: string

  constructor(
    private readonly store: TransactionStore,
    private readonly contactsService: ContactsService,
    private readonly evmRenderer: EvmTransactionRendererService
  ) {
    this.protocolIdentifier$ = this.store.selectProtocolIdentifier()
    this.airGapTxs$ = this.store.selectAirGapTxs()
    this.aggregatedDetails$ = this.store.selectAggregatedDetails()
  }

  public async ngOnInit(): Promise<void> {
    if (this.airGapTxs !== undefined) {
      await this.setAddressNames()
      this.store.setAirGapTxs(this.airGapTxs)
      await this.decodeEvm()
    }
  }

  public async ngOnChanges() {
    await this.setAddressNames()
    this.store.setAirGapTxs(this.airGapTxs)
    await this.decodeEvm()
  }

  private async decodeEvm(): Promise<void> {
    if (!this.airGapTxs) {
      this.evmResults = []
      return
    }
    this.evmResults = await Promise.all(
      this.airGapTxs.map(async tx => {
        if (!isEvmProtocol(tx.protocolIdentifier)) return null
        const data = tx.data
        if (!data || data === '0x' || data.length <= 2) return null
        const to = tx.to?.[0]
        if (!to) return null
        const input = {
          to,
          data,
          chainId: chainIdForProtocol(tx.protocolIdentifier)
        }
        try {
          await this.evmRenderer.prepare(input)
          return this.evmRenderer.render(input)
        } catch (e) {
          console.warn('EVM decode failed', e)
          return null
        }
      })
    )
    const meta = this.evmResults.some(r => r) ? await this.evmRenderer.getDbMetadata() : null
    this.dbDate = meta?.sourcifyExportDate
  }

  private async setAddressNames() {
    const isBookenabled = await this.contactsService.isBookEnabled()
    if (isBookenabled) {
      for (let i = 0; i < this.airGapTxs.length; i++) {
        this.airGapTxs[i].extra = { names: {} }
        for (let j = 0; j < this.airGapTxs[i].from.length; j++) {
          const address = this.airGapTxs[i].from[j]
          const name = await this.contactsService.getContactName(address)
          if (name) this.airGapTxs[i].extra.names[address] = name
        }

        for (let j = 0; j < this.airGapTxs[i].to.length; j++) {
          const address = this.airGapTxs[i].to[j]
          const name = await this.contactsService.getContactName(address)
          if (name) this.airGapTxs[i].extra.names[address] = name
        }
      }
    }
  }
}
