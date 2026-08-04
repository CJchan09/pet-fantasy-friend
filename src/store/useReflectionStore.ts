import { useGameStore } from './useGameStore'

/** 按域派生的选择器：反思相关状态与操作 */
export function useReflectionStore() {
  const reflections = useGameStore((s) => s.state.reflections)
  const draftReflection = useGameStore((s) => s.state.draftReflection)
  const hasSubmittedToday = useGameStore((s) => s.hasSubmittedToday)
  const getTodayEntry = useGameStore((s) => s.getTodayEntry)
  const saveDraft = useGameStore((s) => s.saveDraft)
  const submitReflection = useGameStore((s) => s.submitReflection)

  return {
    reflections,
    draftReflection,
    hasSubmittedToday: hasSubmittedToday(),
    todayEntry: getTodayEntry(),
    saveDraft,
    submitReflection,
  }
}
