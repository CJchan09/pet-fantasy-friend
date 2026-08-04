import { describe, expect, it } from 'vitest'
import { calculateLevel, feedPet, levelProgress } from '../pet'
import {
  FEED_STARDUST_COST,
  INTIMACY_PER_LEVEL,
  MAX_LEVEL_STAGE_ONE,
} from '@/config/gameBalance'

describe('pet 亲密度与等级', () => {
  it('0 亲密度是 1 级', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('达到一个阈值升一级', () => {
    expect(calculateLevel(INTIMACY_PER_LEVEL)).toBe(2)
  })

  it('星尘足够时喂养成功并可能升级', () => {
    const result = feedPet(FEED_STARDUST_COST, INTIMACY_PER_LEVEL - 5)
    expect(result).not.toBeNull()
    expect(result?.stardustBalance).toBe(0)
    expect(result?.leveledUp).toBe(true)
  })

  it('星尘不足时喂养返回 null，不扣任何东西', () => {
    const result = feedPet(FEED_STARDUST_COST - 1, 0)
    expect(result).toBeNull()
  })

  it('levelProgress 反映当前等级内进度，满级恒为 1', () => {
    expect(levelProgress(0)).toBe(0)
    expect(levelProgress(INTIMACY_PER_LEVEL / 2)).toBe(0.5)
    expect(levelProgress(INTIMACY_PER_LEVEL * MAX_LEVEL_STAGE_ONE)).toBe(1)
  })
})
