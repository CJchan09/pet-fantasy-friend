import { create } from 'zustand'
import type { AppState, MoodValue, ReflectionAnswers } from '@/types'
import {
  createDefaultState,
  exportStateAsJson,
  importStateFromJson,
  loadState,
  saveState,
} from '@/storage/localStorageAdapter'
import {
  calculateReflectionReward,
  getLocalDateKey,
  isReflectionSubmittable,
} from '@/domain/reflection'
import { earnStardust } from '@/domain/stardust'
import { feedPet as feedPetDomain } from '@/domain/pet'
import { FEED_STARDUST_COST } from '@/config/gameBalance'

interface GameStore {
  state: AppState
  /** 今天是否已经提交过反思（决定「提交」与「编辑」的展示与是否再发星尘） */
  hasSubmittedToday: () => boolean
  getTodayEntry: () => AppState['reflections'][number] | undefined
  saveDraft: (answers: ReflectionAnswers, mood?: MoodValue) => void
  submitReflection: (answers: ReflectionAnswers, mood?: MoodValue) => void
  feedPet: () => boolean
  exportSave: () => string
  importSave: (json: string) => boolean
  resetForTests: () => void
}

/**
 * 单一持久化 store：全部 AppState（宠物/星尘/反思）作为一个整体读写 localStorage，
 * 避免多个各自持久化的 store 互相覆盖同一个存档 key。
 * 下方 usePetStore / useStardustStore / useReflectionStore 是从这里派生的按域选择器，
 * 供组件按需订阅，不必每个组件都拿完整 state。
 */
export const useGameStore = create<GameStore>((set, get) => ({
  state: loadState(),

  hasSubmittedToday: () => {
    const today = getLocalDateKey()
    return get().state.reflections.some((entry) => entry.date === today)
  },

  getTodayEntry: () => {
    const today = getLocalDateKey()
    return get().state.reflections.find((entry) => entry.date === today)
  },

  saveDraft: (answers, mood) => {
    const today = getLocalDateKey()
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        draftReflection: { date: today, answers, mood },
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  submitReflection: (answers, mood) => {
    if (!isReflectionSubmittable(answers)) {
      return
    }
    const today = getLocalDateKey()
    set((prev) => {
      const existingIndex = prev.state.reflections.findIndex(
        (entry) => entry.date === today,
      )
      const isFirstSubmissionToday = existingIndex === -1

      let reflections = prev.state.reflections
      let stardustBalance = prev.state.stardust.balance

      if (isFirstSubmissionToday) {
        // 首次提交：按填写题数发放星尘
        const reward = calculateReflectionReward(answers)
        stardustBalance = earnStardust(stardustBalance, reward)
        reflections = [
          ...reflections,
          {
            date: today,
            answers,
            mood,
            stardustAwarded: reward,
            updatedAt: new Date().toISOString(),
          },
        ].sort((a, b) => (a.date < b.date ? 1 : -1))
      } else {
        // 同日重复提交=编辑：只更新内容，不重复发放星尘（PRD 3.3.1 异常处理）
        reflections = reflections.map((entry, index) =>
          index === existingIndex
            ? {
                ...entry,
                answers,
                mood,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        )
      }

      const nextState: AppState = {
        ...prev.state,
        stardust: { balance: stardustBalance },
        reflections,
        draftReflection: null,
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  feedPet: () => {
    const { state } = get()
    const result = feedPetDomain(state.stardust.balance, state.pet.intimacy)
    if (!result) {
      return false
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        stardust: { balance: result.stardustBalance },
        pet: {
          ...prev.state.pet,
          intimacy: result.intimacy,
          level: result.level,
        },
      }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  exportSave: () => exportStateAsJson(get().state),

  importSave: (json) => {
    const imported = importStateFromJson(json)
    if (!imported) {
      return false
    }
    saveState(imported)
    set({ state: imported })
    return true
  },

  resetForTests: () => {
    const fresh = createDefaultState()
    saveState(fresh)
    set({ state: fresh })
  },
}))

export const FEED_COST = FEED_STARDUST_COST
