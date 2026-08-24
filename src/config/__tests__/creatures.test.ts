import { describe, expect, it } from 'vitest'
import { CREATURES, CREATURES_BY_RARITY, STARTER_SPECIES, eggAsset } from '../creatures'

describe('starter species', () => {
  it('只把原始三只放进起始选择池', () => {
    expect(STARTER_SPECIES).toEqual(['mossbear', 'spiritfox', 'cloudsheep'])
  })

  it('登记完整 20 只图鉴，并保持 10/6/4 稀有度分布', () => {
    expect(Object.keys(CREATURES)).toHaveLength(20)
    expect(CREATURES_BY_RARITY.common).toHaveLength(10)
    expect(CREATURES_BY_RARITY.rare).toHaveLength(6)
    expect(CREATURES_BY_RARITY.legendary).toHaveLength(4)
  })

  it('未有专属蛋图的新物种使用中性星光蛋', () => {
    expect(eggAsset('mossbear')).toBe('/eggs/mossbear.webp')
    expect(eggAsset('amberwolf')).toBe('/eggs/generic.webp')
  })
})
