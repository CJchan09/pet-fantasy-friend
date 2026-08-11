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
import {
  completeTask as completeTaskDomain,
  createTask,
  removeTask as removeTaskDomain,
  uncompleteTask,
} from '@/domain/tasks'
import { completeFocusSession as completeFocusSessionDomain } from '@/domain/focus'
import {
  advanceEgg as advanceEggDomain,
  checkLegendaryUnlock,
  drawEggSpecies,
} from '@/domain/incubation'
import {
  isHumanWin,
  recordAnimalChessWin,
  type AnimalChessResult,
} from '@/domain/animalChess'
import { FEED_STARDUST_COST, EGG_ADVANCE_CHUNK } from '@/config/gameBalance'
import { CREATURES } from '@/config/creatures'

interface GameStore {
  state: AppState
  /** 今天是否已经提交过反思（决定「提交」与「编辑」的展示与是否再发星尘） */
  hasSubmittedToday: () => boolean
  getTodayEntry: () => AppState['reflections'][number] | undefined
  saveDraft: (answers: ReflectionAnswers, mood?: MoodValue) => void
  submitReflection: (answers: ReflectionAnswers, mood?: MoodValue) => void
  feedPet: () => boolean
  chooseStarter: (species: string, name: string) => void
  addTask: (label: string) => void
  removeTask: (id: string) => void
  toggleTask: (id: string) => void
  completeFocusSession: () => boolean
  /** 抽一颗蛋：抽的瞬间就定好蛋里的生物（未拥有池随机）；已有蛋或全部集齐时返回 false */
  drawEgg: () => boolean
  advanceEgg: () => boolean
  /** 返回是否实际发了星尘（输了 / 今日奖励已领完时是 false，但输不扣分，state 不变） */
  recordAnimalChessResult: (result: AnimalChessResult) => boolean
  exportSave: () => string
  importSave: (json: string) => boolean
  /** 清除全部数据回到初始状态（重新选起始宠物）；调用方负责先向用户确认 */
  resetGame: () => void
  resetForTests: () => void
}

/** 三处赚星尘的入口共用：更新 lastGrowthAt，驱动宠物状态机恢复活跃（喂养/孵蛋不算成长行为） */
function withGrowthTimestamp(state: AppState, didEarn: boolean): Pick<AppState, 'lastGrowthAt'> {
  return { lastGrowthAt: didEarn ? new Date().toISOString() : state.lastGrowthAt }
}

/**
 * 单一持久化 store：全部 AppState（宠物/星尘/反思/任务/专注/孵化/图鉴）作为一个整体读写 localStorage，
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
      let reflectionCount = prev.state.reflectionCount
      let ownedCreatures = prev.state.ownedCreatures

      if (isFirstSubmissionToday) {
        // 首次提交：按填写题数发放星尘
        const reward = calculateReflectionReward(answers)
        stardustBalance = earnStardust(stardustBalance, reward)
        reflectionCount += 1
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

        const legendarySpecies = checkLegendaryUnlock(reflectionCount, ownedCreatures)
        if (legendarySpecies) {
          ownedCreatures = { ...ownedCreatures, [legendarySpecies]: true }
        }
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
        reflectionCount,
        ownedCreatures,
        ...withGrowthTimestamp(prev.state, isFirstSubmissionToday),
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

  chooseStarter: (species, name) => {
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        pet: { name: name.trim() || CREATURES[species].defaultName, species, intimacy: 0, level: 1 },
        hasChosenStarter: true,
        ownedCreatures: { ...prev.state.ownedCreatures, [species]: true },
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  addTask: (label) => {
    if (!label.trim()) {
      return
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        tasks: [...prev.state.tasks, createTask(label)],
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  removeTask: (id) => {
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        tasks: removeTaskDomain(prev.state.tasks, id),
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  toggleTask: (id) => {
    set((prev) => {
      const target = prev.state.tasks.find((t) => t.id === id)
      if (!target) {
        return prev
      }

      if (target.done) {
        const nextState: AppState = { ...prev.state, tasks: uncompleteTask(prev.state.tasks, id) }
        saveState(nextState)
        return { state: nextState }
      }

      const { tasks, stardustEarned } = completeTaskDomain(prev.state.tasks, id)
      const nextState: AppState = {
        ...prev.state,
        tasks,
        stardust: { balance: earnStardust(prev.state.stardust.balance, stardustEarned) },
        ...withGrowthTimestamp(prev.state, stardustEarned > 0),
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  completeFocusSession: () => {
    const { state } = get()
    const { sessions, stardustEarned } = completeFocusSessionDomain(state.focusSessions)
    if (stardustEarned === 0) {
      return false
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        focusSessions: sessions,
        stardust: { balance: earnStardust(prev.state.stardust.balance, stardustEarned) },
        ...withGrowthTimestamp(prev.state, true),
      }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  drawEgg: () => {
    const { state } = get()
    if (state.egg) {
      return false
    }
    const species = drawEggSpecies(state.ownedCreatures)
    if (!species) {
      return false // 全部集齐，没得抽了
    }
    set((prev) => {
      const nextState: AppState = { ...prev.state, egg: { species, progress: 0 } }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  advanceEgg: () => {
    const { state } = get()
    if (!state.egg) {
      return false
    }
    const result = advanceEggDomain(state.egg, state.stardust.balance)
    if (!result) {
      return false
    }
    set((prev) => {
      // 抽蛋时已保证不重复（池子里只有未拥有的生物），孵化直接入图鉴即可
      const ownedCreatures = result.hatchedSpecies
        ? { ...prev.state.ownedCreatures, [result.hatchedSpecies]: true }
        : prev.state.ownedCreatures

      const nextState: AppState = {
        ...prev.state,
        egg: result.egg,
        stardust: { balance: result.stardustBalance },
        ownedCreatures,
      }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  recordAnimalChessResult: (result) => {
    if (!isHumanWin(result)) {
      return false // 输了不扣分，也没有别的副作用——直接不做任何事
    }
    const { state } = get()
    const { wins, stardustEarned } = recordAnimalChessWin(state.animalChessWins)
    if (stardustEarned === 0) {
      return false // 赢了，但今日奖励已经领完，不再重复给
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        animalChessWins: wins,
        stardust: { balance: earnStardust(prev.state.stardust.balance, stardustEarned) },
        // 特意不调用 withGrowthTimestamp：小游戏不算「成长行为」，不会唤醒沉睡宠物
      }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  exportSave: () => {
    const json = exportStateAsJson(get().state)
    set((prev) => {
      if (prev.state.hasExportedSave) {
        return prev
      }
      const nextState: AppState = { ...prev.state, hasExportedSave: true }
      saveState(nextState)
      return { state: nextState }
    })
    return json
  },

  importSave: (json) => {
    const imported = importStateFromJson(json)
    if (!imported) {
      return false
    }
    saveState(imported)
    set({ state: imported })
    return true
  },

  resetGame: () => {
    const fresh = createDefaultState()
    saveState(fresh)
    set({ state: fresh })
  },

  resetForTests: () => {
    get().resetGame()
  },
}))

export const FEED_COST = FEED_STARDUST_COST
export const EGG_ADVANCE_COST = EGG_ADVANCE_CHUNK
