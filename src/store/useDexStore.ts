import { useGameStore } from './useGameStore'

/** 按域派生的选择器：图鉴 */
export function useDexStore() {
  const ownedCreatures = useGameStore((s) => s.state.ownedCreatures)
  return { ownedCreatures }
}
