import { useGameStore } from './useGameStore'
import { canAffordStardust } from '@/domain/stardust'
import { eggCost } from '@/domain/incubation'
import { EGG_ADVANCE_CHUNK } from '@/config/gameBalance'

/** 按域派生的选择器：孵化系统 */
export function useEggStore() {
  const egg = useGameStore((s) => s.state.egg)
  const stardustBalance = useGameStore((s) => s.state.stardust.balance)
  const advanceEgg = useGameStore((s) => s.advanceEgg)
  const startNewEgg = useGameStore((s) => s.startNewEgg)

  return {
    egg,
    cost: egg ? eggCost(egg.rarity) : 0,
    advanceChunk: EGG_ADVANCE_CHUNK,
    canAdvance: canAffordStardust(stardustBalance, EGG_ADVANCE_CHUNK),
    advanceEgg,
    startNewEgg,
  }
}
