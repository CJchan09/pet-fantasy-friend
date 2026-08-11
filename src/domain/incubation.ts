import {
  EGG_ADVANCE_CHUNK,
  EGG_COMMON_COST,
  EGG_RARE_COST,
  LEGENDARY_UNLOCK_REFLECTION_COUNT,
} from '@/config/gameBalance'
import { CREATURES, CREATURES_BY_RARITY } from '@/config/creatures'
import { canAffordStardust, spendStardust } from './stardust'
import type { EggState } from '@/types'

/**
 * 孵化系统（CJ 2026-08-10 重做为「先抽蛋」流程）：
 * 1. 玩家按「抽一颗蛋」——抽的那一刻就确定蛋里是什么生物（对玩家保密到孵化完成）。
 * 2. 抽蛋池 = 还没拥有的生物，抽过就从池里消失——每只生物永远只有一只，不会重复。
 * 3. 抽到蛋后用星尘「浇灌」推进可见进度条，攒满即孵化——依旧是确定性推进，
 *    不做付费随机、不做开箱悬念（PRD 原则 3 仍然成立：随机只发生在「哪只先来」，
 *    最终全部都能集齐，且抽蛋本身免费）。
 */

export function unownedSpecies(ownedCreatures: Record<string, boolean>): string[] {
  return Object.keys(CREATURES).filter((slug) => !ownedCreatures[slug])
}

export function isCollectionComplete(ownedCreatures: Record<string, boolean>): boolean {
  return unownedSpecies(ownedCreatures).length === 0
}

/** 从未拥有的生物里随机抽一只；全部集齐时返回 null（UI 显示「都到齐了」状态） */
export function drawEggSpecies(ownedCreatures: Record<string, boolean>): string | null {
  const pool = unownedSpecies(ownedCreatures)
  if (pool.length === 0) {
    return null
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 孵化成本按蛋里生物的稀有度定；当前全是 common（60⭐），rare 常量留给未来更强的生物 */
export function eggCost(species: string): number {
  const rarity = CREATURES[species]?.rarity ?? 'common'
  return rarity === 'common' ? EGG_COMMON_COST : EGG_RARE_COST
}

export interface AdvanceEggResult {
  egg: EggState | null
  stardustBalance: number
  hatchedSpecies: string | null
}

/**
 * 花 EGG_ADVANCE_CHUNK 星尘推进蛋的进度；达到成本即孵化（孵出的就是抽蛋时定好的生物）。
 * 星尘不足时返回 null，不扣任何东西（喂养同款异常处理模式）。
 */
export function advanceEgg(egg: EggState, stardustBalance: number): AdvanceEggResult | null {
  if (!canAffordStardust(stardustBalance, EGG_ADVANCE_CHUNK)) {
    return null
  }
  const newBalance = spendStardust(stardustBalance, EGG_ADVANCE_CHUNK)
  if (newBalance === null) {
    return null
  }

  const cost = eggCost(egg.species)
  const newProgress = Math.min(egg.progress + EGG_ADVANCE_CHUNK, cost)

  if (newProgress >= cost) {
    return { egg: null, stardustBalance: newBalance, hatchedSpecies: egg.species }
  }
  return { egg: { ...egg, progress: newProgress }, stardustBalance: newBalance, hatchedSpecies: null }
}

/**
 * 传说生物走里程碑解锁，完全不依赖概率（PRD 3.3.4）：累计 30 次每日反思。
 * 当前没有配置任何 legendary 生物（全部重划为 common），此函数恒返回 null——
 * 保留是为了未来加入更强生物时里程碑通道直接可用。幂等：已拥有时不重复触发。
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
