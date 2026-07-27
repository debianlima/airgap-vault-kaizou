import { DisplayRow } from '../../services/evm/abi-types'
import { EvmTransactionDisplayComponent } from './evm-transaction-display.component'

describe('EvmTransactionDisplayComponent — manual decimals selector', () => {
  let c: EvmTransactionDisplayComponent

  beforeEach(() => {
    // TranslateService is only used by the render* helpers; the decimals logic
    // does not touch it, so a minimal stub is enough.
    c = new EvmTransactionDisplayComponent({ instant: (k: string) => k } as any)
  })

  const rawAmount = (): DisplayRow => ({ value: '1230000000000000000', type: 'amount', rawValue: '1230000000000000000' })

  it('offers the selector only on raw amount rows', () => {
    expect(c.isScalable(rawAmount())).toBe(true)
    expect(c.isScalable({ value: '1.23 USDC', type: 'amount' })).toBe(false) // already formatted via known-tokens
    expect(c.isScalable({ value: '0xabc', type: 'address' })).toBe(false)
  })

  it('defaults to raw with no scaled preview', () => {
    const r = rawAmount()
    expect(c.currentDecimals(r)).toBeNull()
    expect(c.scaledValue(r)).toBeNull()
  })

  it('cycles raw → 6 → 8 → 18 → raw and scales correctly', () => {
    const r = rawAmount()
    c.cycleDecimals(r)
    expect(c.currentDecimals(r)).toBe(6)
    expect(c.scaledValue(r)).toBe('1230000000000')
    c.cycleDecimals(r)
    expect(c.currentDecimals(r)).toBe(8)
    expect(c.scaledValue(r)).toBe('12300000000')
    c.cycleDecimals(r)
    expect(c.currentDecimals(r)).toBe(18)
    expect(c.scaledValue(r)).toBe('1.23')
    c.cycleDecimals(r)
    expect(c.currentDecimals(r)).toBeNull()
    expect(c.scaledValue(r)).toBeNull()
  })

  it('tracks the chosen scale independently per row', () => {
    const a = rawAmount()
    const b = rawAmount()
    c.cycleDecimals(a)
    expect(c.currentDecimals(a)).toBe(6)
    expect(c.currentDecimals(b)).toBeNull()
  })
})
