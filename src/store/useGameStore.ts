import { create } from 'zustand'
import type {
  AiConsentSettings,
  AppState,
  FocusLink,
  HabitItem,
  MoodValue,
  NotificationSettings,
  ReflectionAnswers,
  ReminderTime,
  TaskItem,
} from '@/types'
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
  updateTask as updateTaskDomain,
  type CreateTaskOptions,
} from '@/domain/tasks'
import {
  canAddHabit,
  completeHabit as completeHabitDomain,
  createHabit,
  isHabitCompletedOn,
  isHabitTitleValid,
  removeHabit as removeHabitDomain,
  uncompleteHabit as uncompleteHabitDomain,
  updateHabit as updateHabitDomain,
} from '@/domain/habits'
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
import { useAuthStore } from './useAuthStore'
import i18n from '@/i18n'

/** 生物默认昵称跟着当前语言走（起名前的预填值，不是已确认的用户数据） */
function defaultNickname(species: string): string {
  return i18n.t(CREATURES[species].defaultNameKey)
}

/** Admin 测试账号（Supabase profiles.role，见 supabase/schema.sql）跳过全部每日上限 */
function isAdminUser(): boolean {
  return useAuthStore.getState().role === 'admin'
}

interface GameStore {
  state: AppState
  /** 今天是否已经提交过反思（决定「提交」与「编辑」的展示与是否再发星尘） */
  hasSubmittedToday: () => boolean
  getTodayEntry: () => AppState['reflections'][number] | undefined
  saveDraft: (answers: ReflectionAnswers, mood?: MoodValue) => void
  submitReflection: (answers: ReflectionAnswers, mood?: MoodValue) => void
  feedPet: () => boolean
  /** Admin 测试专用：直接加星尘，不走任何赚取入口。非 admin 账号调用直接返回 false，不生效 */
  adminAddStardust: (amount: number) => boolean
  chooseStarter: (species: string, name: string) => void
  /** 图鉴里切换出战宠物：只能切到已拥有的生物，切到当前已经在出战的那只也算失败（无意义操作） */
  switchActivePet: (species: string) => boolean
  addTask: (label: string, options?: CreateTaskOptions) => void
  removeTask: (id: string) => void
  toggleTask: (id: string) => void
  updateTask: (
    id: string,
    patch: Partial<Pick<TaskItem, 'label' | 'dueDate' | 'reminderTime' | 'pinned'>>,
  ) => void
  /** 达到 HABIT_MAX_ACTIVE 或标题非法时返回 false，调用方负责提示 */
  addHabit: (title: string, reminderTime?: ReminderTime) => boolean
  updateHabit: (
    id: string,
    patch: Partial<Pick<HabitItem, 'title' | 'reminderTime' | 'active'>>,
  ) => void
  removeHabit: (id: string) => void
  /** 勾选/取消勾选今天的 Habit；返回本次实发星尘（取消或重复勾选为 0） */
  toggleHabit: (id: string) => number
  /**
   * 专注跑满后结算。minutes 是实际完整完成的分钟数，link 可选。
   * 返回实发星尘——可能因每日上限而小于公式值，UI 要显示真实数字。
   */
  completeFocusSession: (minutes: number, link?: FocusLink | null) => number
  setNotificationSettings: (patch: Partial<NotificationSettings>) => void
  setAiConsent: (patch: Partial<AiConsentSettings>) => void
  /** 抽一颗蛋：抽的瞬间就定好蛋里的生物（未拥有池随机）；已有蛋或全部集齐时返回 false */
  drawEgg: () => boolean
  /** 返回刚孵化出的生物 slug（用于弹起名弹窗）；本次浇灌没有孵化出东西/星尘不够时返回 null */
  advanceEgg: () => string | null
  /** 孵化起名弹窗确认后调用，写入该生物的昵称 */
  renameCreature: (species: string, nickname: string) => void
  /** 返回是否实际发了星尘（输了 / 今日奖励已领完时是 false，但输不扣分，state 不变） */
  recordAnimalChessResult: (result: AnimalChessResult) => boolean
  exportSave: () => string
  importSave: (json: string) => boolean
  /** 清除全部数据回到初始状态（重新选起始宠物）；调用方负责先向用户确认 */
  resetGame: () => void
  resetForTests: () => void
}

/** 四处赚星尘的入口共用：更新 lastGrowthAt，驱动宠物状态机恢复活跃（喂养/孵蛋/小游戏不算成长行为） */
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
    const isAdmin = isAdminUser()
    set((prev) => {
      const existingIndex = prev.state.reflections.findIndex(
        (entry) => entry.date === today,
      )
      const hasExistingToday = existingIndex !== -1
      // 正常用户只有首次提交才发星尘（PRD 3.3.1 异常处理：同日重复提交=编辑，不重复发放）；
      // admin 测试账号每次提交都当作可以领（跳过每日上限），但依旧更新同一天的那条记录，不重复插入
      const shouldReward = !hasExistingToday || isAdmin

      let reflections = prev.state.reflections
      let stardustBalance = prev.state.stardust.balance
      let reflectionCount = prev.state.reflectionCount
      let ownedCreatures = prev.state.ownedCreatures

      if (shouldReward) {
        const reward = calculateReflectionReward(answers)
        stardustBalance = earnStardust(stardustBalance, reward)
        reflectionCount += 1
        const entry = {
          date: today,
          answers,
          mood,
          stardustAwarded: reward,
          updatedAt: new Date().toISOString(),
        }
        reflections = hasExistingToday
          ? reflections.map((e, index) => (index === existingIndex ? entry : e))
          : [...reflections, entry].sort((a, b) => (a.date < b.date ? 1 : -1))

        const legendarySpecies = checkLegendaryUnlock(reflectionCount, ownedCreatures)
        if (legendarySpecies) {
          ownedCreatures = {
            ...ownedCreatures,
            [legendarySpecies]: { nickname: defaultNickname(legendarySpecies) },
          }
        }
      } else {
        // 同日重复提交=编辑：只更新内容，不重复发放星尘
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
        ...withGrowthTimestamp(prev.state, shouldReward),
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

  adminAddStardust: (amount) => {
    if (!isAdminUser() || !Number.isFinite(amount) || amount <= 0) {
      return false
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        stardust: { balance: earnStardust(prev.state.stardust.balance, Math.floor(amount)) },
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
        pet: { name: name.trim() || defaultNickname(species), species, intimacy: 0, level: 1 },
        hasChosenStarter: true,
        ownedCreatures: {
          ...prev.state.ownedCreatures,
          [species]: { nickname: name.trim() || defaultNickname(species) },
        },
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  switchActivePet: (species) => {
    const { state } = get()
    const owned = state.ownedCreatures[species]
    if (!owned || species === state.pet.species) {
      return false
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        // 亲密度/等级沿用同一份数值，不按生物分开算——出战切换只改「显示谁」，
        // 不是重新养一只新的；以后如果要做「每只生物独立成长」，这里要连 ownedCreatures 一起改数据结构
        pet: { ...prev.state.pet, species, name: owned.nickname },
      }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  addTask: (label, options) => {
    if (!label.trim()) {
      return
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        tasks: [...prev.state.tasks, createTask(label, options)],
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  updateTask: (id, patch) => {
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        tasks: updateTaskDomain(prev.state.tasks, id, patch),
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

      const { tasks, stardustEarned } = completeTaskDomain(prev.state.tasks, id, getLocalDateKey(), isAdminUser())
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

  addHabit: (title, reminderTime = null) => {
    const { state } = get()
    if (!isHabitTitleValid(title) || !canAddHabit(state.habits)) {
      return false
    }
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        habits: [...prev.state.habits, createHabit(title, reminderTime)],
      }
      saveState(nextState)
      return { state: nextState }
    })
    return true
  },

  updateHabit: (id, patch) => {
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        habits: updateHabitDomain(prev.state.habits, id, patch),
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  removeHabit: (id) => {
    set((prev) => {
      const { habits, completions } = removeHabitDomain(
        prev.state.habits,
        prev.state.habitCompletions,
        id,
      )
      const nextState: AppState = { ...prev.state, habits, habitCompletions: completions }
      saveState(nextState)
      return { state: nextState }
    })
  },

  toggleHabit: (id) => {
    const today = getLocalDateKey()
    const { state } = get()

    // 取消勾选：不回收星尘，也不算「倒退」；只是把今天这条标成撤销
    if (isHabitCompletedOn(state.habitCompletions, id, today)) {
      set((prev) => {
        const nextState: AppState = {
          ...prev.state,
          habitCompletions: uncompleteHabitDomain(prev.state.habitCompletions, id, today),
        }
        saveState(nextState)
        return { state: nextState }
      })
      return 0
    }

    const { completions, stardustEarned } = completeHabitDomain(
      state.habitCompletions,
      id,
      today,
      isAdminUser(),
    )
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        habitCompletions: completions,
        stardust: { balance: earnStardust(prev.state.stardust.balance, stardustEarned) },
        // 完成 Habit 本身就是成长行为，即使因为每日上限没拿到星尘也算
        ...withGrowthTimestamp(prev.state, true),
      }
      saveState(nextState)
      return { state: nextState }
    })
    return stardustEarned
  },

  completeFocusSession: (minutes, link = null) => {
    const { state } = get()
    const { sessions, stardustEarned } = completeFocusSessionDomain(
      state.focusSessions,
      minutes,
      link,
      getLocalDateKey(),
      isAdminUser(),
    )
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        focusSessions: sessions,
        stardust: { balance: earnStardust(prev.state.stardust.balance, stardustEarned) },
        // 达到每日上限拿 0 星尘时，这段专注依然是成长行为——不该被当成「今天什么都没做」
        ...withGrowthTimestamp(prev.state, true),
      }
      saveState(nextState)
      return { state: nextState }
    })
    return stardustEarned
  },

  setNotificationSettings: (patch) => {
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        notifications: { ...prev.state.notifications, ...patch },
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  setAiConsent: (patch) => {
    set((prev) => {
      const nextState: AppState = {
        ...prev.state,
        aiConsent: { ...prev.state.aiConsent, ...patch },
      }
      saveState(nextState)
      return { state: nextState }
    })
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
      return null
    }
    const result = advanceEggDomain(state.egg, state.stardust.balance)
    if (!result) {
      return null
    }
    set((prev) => {
      // 抽蛋时已保证不重复（池子里只有未拥有的生物），孵化直接入图鉴；
      // 昵称先写生物原名占位，孵化起名弹窗确认后由 renameCreature 覆盖
      const ownedCreatures = result.hatchedSpecies
        ? {
            ...prev.state.ownedCreatures,
            [result.hatchedSpecies]: { nickname: defaultNickname(result.hatchedSpecies) },
          }
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
    return result.hatchedSpecies
  },

  renameCreature: (species, nickname) => {
    set((prev) => {
      if (!prev.state.ownedCreatures[species]) {
        return prev
      }
      const trimmed = nickname.trim() || defaultNickname(species)
      const nextState: AppState = {
        ...prev.state,
        ownedCreatures: {
          ...prev.state.ownedCreatures,
          [species]: { nickname: trimmed },
        },
      }
      saveState(nextState)
      return { state: nextState }
    })
  },

  recordAnimalChessResult: (result) => {
    if (!isHumanWin(result)) {
      return false // 输了不扣分，也没有别的副作用——直接不做任何事
    }
    const { state } = get()
    const { wins, stardustEarned } = recordAnimalChessWin(
      state.animalChessWins,
      getLocalDateKey(),
      isAdminUser(),
    )
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
