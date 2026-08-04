import { useGameStore } from './useGameStore'
import { canAffordStardust } from '@/domain/stardust'
import { FEED_STARDUST_COST } from '@/config/gameBalance'

/** 按域派生的选择器：只关心宠物相关状态与操作 */
export function usePetStore() {
  const pet = useGameStore((s) => s.state.pet)
  const stardustBalance = useGameStore((s) => s.state.stardust.balance)
  const feedPet = useGameStore((s) => s.feedPet)

  return {
    pet,
    canFeed: canAffordStardust(stardustBalance, FEED_STARDUST_COST),
    feedCost: FEED_STARDUST_COST,
    feedPet,
  }
}
