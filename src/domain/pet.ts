import {
  FEED_INTIMACY_GAIN,
  FEED_STARDUST_COST,
  INTIMACY_PER_LEVEL,
  MAX_LEVEL_STAGE_ONE,
} from '@/config/gameBalance'
import { canAffordStardust, spendStardust } from './stardust'

export function calculateLevel(intimacy: number): number {
  const level = Math.floor(intimacy / INTIMACY_PER_LEVEL) + 1
  return Math.min(level, MAX_LEVEL_STAGE_ONE)
}

/** 当前等级内的亲密度进度（0–1），用于等级条展示；满级恒为 1 */
export function levelProgress(intimacy: number): number {
  if (calculateLevel(intimacy) >= MAX_LEVEL_STAGE_ONE) {
    return 1
  }
  return (intimacy % INTIMACY_PER_LEVEL) / INTIMACY_PER_LEVEL
}

export interface FeedResult {
  stardustBalance: number
  intimacy: number
  level: number
  leveledUp: boolean
}

/**
 * 花费固定星尘换取固定亲密度，达阈值升级。
 * 返回 null 表示星尘不足，调用方不应扣除任何东西也不应报错文案（喂养本身不是"失败叙事"场景，只是按钮禁用态）。
 */
export function feedPet(
  stardustBalance: number,
  intimacy: number,
): FeedResult | null {
  if (!canAffordStardust(stardustBalance, FEED_STARDUST_COST)) {
    return null
  }
  const newBalance = spendStardust(stardustBalance, FEED_STARDUST_COST)
  if (newBalance === null) {
    return null
  }
  const previousLevel = calculateLevel(intimacy)
  const newIntimacy = intimacy + FEED_INTIMACY_GAIN
  const newLevel = calculateLevel(newIntimacy)
  return {
    stardustBalance: newBalance,
    intimacy: newIntimacy,
    level: newLevel,
    leveledUp: newLevel > previousLevel,
  }
}
