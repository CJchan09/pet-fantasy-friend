import {
  EGG_ADVANCE_CHUNK,
  EGG_COMMON_COST,
  EGG_RARE_COST,
  LEGENDARY_UNLOCK_REFLECTION_COUNT,
} from '@/config/gameBalance'
import { CREATURES_BY_RARITY } from '@/config/creatures'
import { canAffordStardust, spendStardust } from './stardust'
import type { EggState } from '@/types'

/**
 * 孵化：可见进度条 + 确定性推进，不做开箱式随机悬念（PRD 3.3.4 / Claude_Code_Prompt 原则 3）。
 * 稀有度由蛋的类型决定（推进多少星尘就孵出对应稀有度）；同稀有度内具体生物随机。
 */

export function eggCost(rarity: 'common' | 'rare'): number {
  return rarity === 'common' ? EGG_COMMON_COST : EGG_RARE_COST
}

export function startNewEgg(rarity: 'common' | 'rare'): EggState {
  return { rarity, progress: 0 }
}

export interface AdvanceEggResult {
  egg: EggState | null
  stardustBalance: number
  hatchedSpecies: string | null
}

/**
 * 花 EGG_ADVANCE_CHUNK 星尘推进蛋的进度；达到该稀有度成本即孵化。
 * 星尘不足时返回 null，不扣任何东西（喂养同款异常处理模式）。
 */
export function advanceEgg(
  egg: EggState,
  stardustBalance: number,
  ownedCreatures: Record<string, boolean>,
): AdvanceEggResult | null {
  if (!canAffordStardust(stardustBalance, EGG_ADVANCE_CHUNK)) {
    return null
  }
  const newBalance = spendStardust(stardustBalance, EGG_ADVANCE_CHUNK)
  if (newBalance === null) {
    return null
  }

  const cost = eggCost(egg.rarity)
  const newProgress = Math.min(egg.progress + EGG_ADVANCE_CHUNK, cost)

  if (newProgress >= cost) {
    return {
      egg: null,
      stardustBalance: newBalance,
      hatchedSpecies: pickHatchSpecies(egg.rarity, ownedCreatures),
    }
  }

  return {
    egg: { ...egg, progress: newProgress },
    stardustBalance: newBalance,
    hatchedSpecies: null,
  }
}

/**
 * 同稀有度内随机挑一只：优先给还没拥有的；如果该稀有度全部已拥有（重复孵化），
 * 仍随机返回一只已拥有的——由调用方（store）决定给予星尘返还作为安慰（见 useGameStore.advanceEgg）。
 */
export function pickHatchSpecies(
  rarity: 'common' | 'rare',
  ownedCreatures: Record<string, boolean>,
): string {
  const pool = CREATURES_BY_RARITY[rarity]
  const notOwned = pool.filter((slug) => !ownedCreatures[slug])
  const candidates = notOwned.length > 0 ? notOwned : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function isDuplicateHatch(species: string, ownedCreatures: Record<string, boolean>): boolean {
  return Boolean(ownedCreatures[species])
}

/**
 * 传说生物走里程碑解锁，完全不依赖概率（PRD 3.3.4）：累计 30 次每日反思。
 * 幂等：已拥有传说生物时不重复触发。
 */
export function checkLegendaryUnlock(
  reflectionCount: number,
  ownedCreatures: Record<string, boolean>,
): string | null {
  if (reflectionCount < LEGENDARY_UNLOCK_REFLECTION_COUNT) {
    return null
  }
  const [legendarySpecies] = CREATURES_BY_RARITY.legendary
  if (!legendarySpecies || ownedCreatures[legendarySpecies]) {
    return null
  }
  return legendarySpecies
}
