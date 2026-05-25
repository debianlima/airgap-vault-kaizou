import { formatAmount, isUnlimitedApproval, lookupKnownToken } from './known-tokens'

describe('known-tokens', () => {
  it('looks up USDC on Ethereum', () => {
    const t = lookupKnownToken(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(t).not.toBeNull()
    expect(t!.symbol).toBe('USDC')
    expect(t!.decimals).toBe(6)
  })

  it('returns null for unknown token', () => {
    expect(lookupKnownToken(1, '0x0000000000000000000000000000000000000000')).toBeNull()
  })

  it('returns null when address is missing', () => {
    expect(lookupKnownToken(1, undefined)).toBeNull()
  })

  it('formats amount with decimals', () => {
    expect(formatAmount(1500000n, 6, 'USDC')).toBe('1.5 USDC')
    expect(formatAmount(1000000000000000000n, 18, 'ETH')).toBe('1 ETH')
    expect(formatAmount(0n, 18, 'ETH')).toBe('0 ETH')
  })

  it('detects unlimited approval', () => {
    expect(isUnlimitedApproval((1n << 256n) - 1n)).toBe(true)
    expect(isUnlimitedApproval(0n)).toBe(false)
  })
})
