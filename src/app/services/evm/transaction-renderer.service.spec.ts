import { AbiDecoderService } from './abi-decoder.service'
import { SignatureDatabaseService } from './signature-database.service'
import { EvmTransactionRendererService } from './transaction-renderer.service'

class FakeDb {
  private map = new Map<string, string>()
  set(sel: string, sig: string) {
    this.map.set(sel.toLowerCase(), sig)
  }
  async initialize() {}
  async lookup(sel: string) {
    const s = this.map.get(sel.toLowerCase())
    return s ? { signature: s, selector: sel.toLowerCase(), collisions: 1 } : null
  }
  async getMetadata() {
    return null
  }
}

describe('EvmTransactionRendererService', () => {
  let svc: EvmTransactionRendererService
  let db: FakeDb

  beforeEach(() => {
    db = new FakeDb()
    svc = new EvmTransactionRendererService(new AbiDecoderService(), db as unknown as SignatureDatabaseService)
  })

  it('routes ERC-20 transfer to dedicated renderer', async () => {
    const tx = {
      to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      data:
        '0xa9059cbb' +
        '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' +
        '00000000000000000000000000000000000000000000000000000000000003e8',
      chainId: 1
    }
    await svc.prepare(tx)
    const r = svc.render(tx)
    expect(r.type).toBe('erc20-transfer')
    expect(r.confidence).toBe('high')
  })

  it('routes unknown calldata to raw-hex with unknown confidence', async () => {
    const tx = { to: '0xdead000000000000000000000000000000000000', data: '0xdeadbeef00' }
    await svc.prepare(tx)
    const r = svc.render(tx)
    expect(r.type).toBe('raw-hex')
    expect(r.confidence).toBe('unknown')
  })

  it('uses database for non-dedicated selector', async () => {
    db.set('11111111', 'foo(uint256)')
    const tx = {
      to: '0xabc0000000000000000000000000000000000000',
      data: '0x11111111' + '0000000000000000000000000000000000000000000000000000000000000007'
    }
    await svc.prepare(tx)
    const r = svc.render(tx)
    expect(r.type).toBe('generic-decoded')
    expect(r.confidence).toBe('medium')
  })

  it('flags transferFrom as ambiguous (low confidence)', async () => {
    const tx = {
      to: '0xabc0000000000000000000000000000000000000',
      data:
        '0x23b872dd' +
        '000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
        '000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' +
        '000000000000000000000000000000000000000000000000000000000000002a'
    }
    await svc.prepare(tx)
    const r = svc.render(tx)
    expect(r.type).toBe('erc721-transfer')
    expect(r.confidence).toBe('low')
    expect(r.warningMessage).toBeTruthy()
  })

  it('decodes multicall and renders inner calls', async () => {
    // multicall(bytes[]) with two ERC-20 transfers
    const inner =
      'a9059cbb' +
      '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' +
      '0000000000000000000000000000000000000000000000000000000000000001'
    // bytes[] with 2 entries each containing 68 (0x44) bytes
    const data =
      '0xac9650d8' +
      '0000000000000000000000000000000000000000000000000000000000000020' + // offset to array
      '0000000000000000000000000000000000000000000000000000000000000002' + // length
      '0000000000000000000000000000000000000000000000000000000000000040' + // offset to elem 0
      '00000000000000000000000000000000000000000000000000000000000000a0' + // offset to elem 1
      '0000000000000000000000000000000000000000000000000000000000000044' + // elem 0 length
      inner +
      '00000000000000000000000000000000' + // pad elem 0 to 32
      '0000000000000000000000000000000000000000000000000000000000000044' + // elem 1 length
      inner +
      '00000000000000000000000000000000'
    const tx = { to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', data, chainId: 1 }
    await svc.prepare(tx)
    const r = svc.render(tx)
    expect(r.type).toBe('multicall')
    expect(r.nested?.length).toBe(2)
    expect(r.nested?.[0].type).toBe('erc20-transfer')
  })
})
