import { useGameStore } from './useGameStore'

/** 按域派生的选择器：只关心星尘余额 */
export function useStardustStore() {
  const balance = useGameStore((s) => s.state.stardust.balance)
  return { balance }
}
