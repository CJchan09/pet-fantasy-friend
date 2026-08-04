/**
 * 星尘余额规则：不可为负；赚取直接累加；消费前必须校验余额是否足够（PRD 3.3.1 异常处理）。
 */

export function earnStardust(balance: number, amount: number): number {
  return balance + Math.max(0, amount)
}

export function canAffordStardust(balance: number, cost: number): boolean {
  return balance >= cost
}

/**
 * 扣减前校验；余额不足时返回 null 而不是让余额变负。
 */
export function spendStardust(balance: number, cost: number): number | null {
  if (!canAffordStardust(balance, cost)) {
    return null
  }
  return balance - cost
}
