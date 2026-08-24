import { describe, expect, it } from 'vitest'
import { calculateLevel, feedPet, levelProgress, petStageForLevel } from '../pet'
import {
  FEED_STARDUST_COST,
  INTIMACY_PER_LEVEL,
  MAX_PET_LEVEL,
} from '@/config/gameBalance'

describe('pet 亲密度与等级', () => {
  it('0 亲密度是 1 级', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('达到一个阈值升一级', () => {
    expect(calculateLevel(INTIMACY_PER_LEVEL)).toBe(2)
  })

  it('等级上限为 50，不再停在 5 级', () => {
    expect(calculateLevel(INTIMACY_PER_LEVEL * 4)).toBe(5)
    expect(calculateLevel(INTIMACY_PER_LEVEL * 5)).toBe(6)
    expect(calculateLevel(Number.MAX_SAFE_INTEGER)).toBe(MAX_PET_LEVEL)
  })

  it('在 20、30、40 级切换四个生命阶段', () => {
    expect(petStageForLevel(1)).toBe(1)
    expect(petStageForLevel(19)).toBe(1)
    expect(petStageForLevel(20)).toBe(2)
    expect(petStageForLevel(29)).toBe(2)
    expect(petStageForLevel(30)).toBe(3)
    expect(petStageForLevel(39)).toBe(3)
    expect(petStageForLevel(40)).toBe(4)
    expect(petStageForLevel(50)).toBe(4)
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
    expect(levelProgress(INTIMACY_PER_LEVEL * MAX_PET_LEVEL)).toBe(1)
  })
})
