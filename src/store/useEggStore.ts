import { useGameStore } from './useGameStore'
import { canAffordStardust } from '@/domain/stardust'
import { eggCost, isCollectionComplete } from '@/domain/incubation'
import { EGG_ADVANCE_CHUNK } from '@/config/gameBalance'

/** 按域派生的选择器：孵化系统（抽蛋 → 浇灌 → 孵化） */
export function useEggStore() {
  const egg = useGameStore((s) => s.state.egg)
  const ownedCreatures = useGameStore((s) => s.state.ownedCreatures)
  const stardustBalance = useGameStore((s) => s.state.stardust.balance)
  const drawEgg = useGameStore((s) => s.drawEgg)
  const advanceEgg = useGameStore((s) => s.advanceEgg)
  const renameCreature = useGameStore((s) => s.renameCreature)

  const collectionComplete = isCollectionComplete(ownedCreatures)

  return {
    egg,
    cost: egg ? eggCost(egg.species) : 0,
    advanceChunk: EGG_ADVANCE_CHUNK,
    canAdvance: canAffordStardust(stardustBalance, EGG_ADVANCE_CHUNK),
    collectionComplete,
    canDraw: !egg && !collectionComplete,
    drawEgg,
    advanceEgg,
    renameCreature,
  }
}
