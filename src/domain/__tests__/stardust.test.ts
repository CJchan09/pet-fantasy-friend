import { describe, expect, it } from 'vitest'
import { canAffordStardust, earnStardust, spendStardust } from '../stardust'

describe('stardust 余额规则', () => {
  it('赚取直接累加', () => {
    expect(earnStardust(10, 40)).toBe(50)
  })

  it('余额足够时正常扣减', () => {
    expect(spendStardust(50, 10)).toBe(40)
  })

  it('余额不足时返回 null，不产生负数', () => {
    expect(spendStardust(5, 10)).toBeNull()
  })

  it('canAffordStardust 正确判断', () => {
    expect(canAffordStardust(10, 10)).toBe(true)
    expect(canAffordStardust(9, 10)).toBe(false)
  })
})
