import { describe, expect, it } from 'vitest'
import {
  advanceEgg,
  checkLegendaryUnlock,
  eggCost,
  isDuplicateHatch,
  pickHatchSpecies,
  startNewEgg,
} from '../incubation'
import {
  EGG_ADVANCE_CHUNK,
  EGG_COMMON_COST,
  EGG_RARE_COST,
  LEGENDARY_UNLOCK_REFLECTION_COUNT,
} from '@/config/gameBalance'
import { CREATURES_BY_RARITY } from '@/config/creatures'

describe('eggCost / startNewEgg', () => {
  it('普通蛋与稀有蛋成本不同', () => {
    expect(eggCost('common')).toBe(EGG_COMMON_COST)
    expect(eggCost('rare')).toBe(EGG_RARE_COST)
  })

  it('新蛋进度从 0 开始', () => {
    expect(startNewEgg('common')).toEqual({ rarity: 'common', progress: 0 })
  })
})

describe('advanceEgg', () => {
  it('星尘足够时推进进度并扣星尘', () => {
    const egg = startNewEgg('common')
    const result = advanceEgg(egg, 1000, {})
    expect(result).not.toBeNull()
    expect(result?.egg?.progress).toBe(EGG_ADVANCE_CHUNK)
    expect(result?.stardustBalance).toBe(1000 - EGG_ADVANCE_CHUNK)
    expect(result?.hatchedSpecies).toBeNull()
  })

  it('星尘不足时返回 null，不扣任何东西', () => {
    const egg = startNewEgg('common')
    expect(advanceEgg(egg, EGG_ADVANCE_CHUNK - 1, {})).toBeNull()
  })

  it('进度达到成本即孵化，蛋位清空', () => {
    const egg = { rarity: 'common' as const, progress: EGG_COMMON_COST - EGG_ADVANCE_CHUNK }
    const result = advanceEgg(egg, 1000, {})
    expect(result?.egg).toBeNull()
    expect(result?.hatchedSpecies).not.toBeNull()
    expect(CREATURES_BY_RARITY.common).toContain(result?.hatchedSpecies)
  })

  it('进度不会超过成本上限（最后一次推进会被裁到刚好孵化）', () => {
    const egg = { rarity: 'common' as const, progress: EGG_COMMON_COST - 5 }
    const result = advanceEgg(egg, 1000, {})
    expect(result?.egg).toBeNull()
  })
})

describe('pickHatchSpecies', () => {
  it('优先给还没拥有的生物', () => {
    const owned = Object.fromEntries(
      CREATURES_BY_RARITY.common.slice(0, CREATURES_BY_RARITY.common.length - 1).map((s) => [s, true]),
    )
    const picked = pickHatchSpecies('common', owned)
    expect(owned[picked]).toBeUndefined()
  })

  it('全部拥有时仍能返回一只（重复）', () => {
    const owned = Object.fromEntries(CREATURES_BY_RARITY.common.map((s) => [s, true]))
    const picked = pickHatchSpecies('common', owned)
    expect(CREATURES_BY_RARITY.common).toContain(picked)
  })
})

describe('isDuplicateHatch', () => {
  it('已拥有的生物判定为重复', () => {
    expect(isDuplicateHatch('mossbear', { mossbear: true })).toBe(true)
    expect(isDuplicateHatch('mossbear', {})).toBe(false)
  })
})

describe('checkLegendaryUnlock', () => {
  const [legendary] = CREATURES_BY_RARITY.legendary

  it('未达累计次数不解锁', () => {
    expect(checkLegendaryUnlock(LEGENDARY_UNLOCK_REFLECTION_COUNT - 1, {})).toBeNull()
  })

  it('达到累计次数且未拥有时解锁', () => {
    expect(checkLegendaryUnlock(LEGENDARY_UNLOCK_REFLECTION_COUNT, {})).toBe(legendary)
  })

  it('已拥有传说生物时不重复解锁', () => {
    expect(
      checkLegendaryUnlock(LEGENDARY_UNLOCK_REFLECTION_COUNT, { [legendary]: true }),
    ).toBeNull()
  })
})
