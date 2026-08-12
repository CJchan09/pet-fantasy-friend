import { describe, expect, it } from 'vitest'
import {
  advanceEgg,
  checkLegendaryUnlock,
  drawEggSpecies,
  eggCost,
  isCollectionComplete,
  unownedSpecies,
} from '../incubation'
import {
  EGG_ADVANCE_CHUNK,
  EGG_COMMON_COST,
  LEGENDARY_UNLOCK_REFLECTION_COUNT,
} from '@/config/gameBalance'
import { CREATURES } from '@/config/creatures'
import type { OwnedCreatureRecord } from '@/types'

const ALL_SPECIES = Object.keys(CREATURES)

function ownedExcept(...notOwned: string[]): Record<string, OwnedCreatureRecord> {
  return Object.fromEntries(
    ALL_SPECIES.filter((s) => !notOwned.includes(s)).map((s) => [s, { nickname: s }]),
  )
}

describe('drawEggSpecies 抽蛋（不重复）', () => {
  it('只会抽到还没拥有的生物', () => {
    const owned = ownedExcept('cloudsheep')
    expect(drawEggSpecies(owned)).toBe('cloudsheep')
  })

  it('全部集齐后返回 null', () => {
    const owned = ownedExcept()
    expect(drawEggSpecies(owned)).toBeNull()
    expect(isCollectionComplete(owned)).toBe(true)
  })

  it('未拥有池随机抽取，结果始终落在池内', () => {
    const owned = { mossbear: { nickname: 'mossbear' } }
    for (let i = 0; i < 20; i++) {
      const drawn = drawEggSpecies(owned)
      expect(drawn).not.toBe('mossbear')
      expect(ALL_SPECIES).toContain(drawn)
    }
  })

  it('unownedSpecies 正确列出未拥有的生物', () => {
    expect(unownedSpecies({})).toHaveLength(ALL_SPECIES.length)
    expect(unownedSpecies(ownedExcept('spiritfox'))).toEqual(['spiritfox'])
  })
})

describe('eggCost', () => {
  it('当前全部生物都是 common，成本一致', () => {
    for (const species of ALL_SPECIES) {
      expect(eggCost(species)).toBe(EGG_COMMON_COST)
    }
  })
})

describe('advanceEgg 浇灌与孵化', () => {
  it('星尘足够时推进进度并扣星尘', () => {
    const egg = { species: 'cloudsheep', progress: 0 }
    const result = advanceEgg(egg, 1000)
    expect(result).not.toBeNull()
    expect(result?.egg?.progress).toBe(EGG_ADVANCE_CHUNK)
    expect(result?.stardustBalance).toBe(1000 - EGG_ADVANCE_CHUNK)
    expect(result?.hatchedSpecies).toBeNull()
  })

  it('星尘不足时返回 null，不扣任何东西', () => {
    const egg = { species: 'cloudsheep', progress: 0 }
    expect(advanceEgg(egg, EGG_ADVANCE_CHUNK - 1)).toBeNull()
  })

  it('进度达到成本即孵化，孵出的正是抽蛋时定好的生物', () => {
    const egg = { species: 'mistdeer', progress: EGG_COMMON_COST - EGG_ADVANCE_CHUNK }
    const result = advanceEgg(egg, 1000)
    expect(result?.egg).toBeNull()
    expect(result?.hatchedSpecies).toBe('mistdeer')
  })
})

describe('checkLegendaryUnlock（当前没有 legendary 生物，通道保留给未来）', () => {
  it('没有配置 legendary 生物时恒返回 null，即使达到里程碑次数', () => {
    expect(checkLegendaryUnlock(LEGENDARY_UNLOCK_REFLECTION_COUNT, {})).toBeNull()
    expect(checkLegendaryUnlock(LEGENDARY_UNLOCK_REFLECTION_COUNT + 100, {})).toBeNull()
  })
})
