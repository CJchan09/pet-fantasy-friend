import { useGameStore } from './useGameStore'

/** 按域派生的选择器：图鉴 */
export function useDexStore() {
  const ownedCreatures = useGameStore((s) => s.state.ownedCreatures)
  const activeSpecies = useGameStore((s) => s.state.pet.species)
  const switchActivePet = useGameStore((s) => s.switchActivePet)
  return { ownedCreatures, activeSpecies, switchActivePet }
}
