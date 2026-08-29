import { create } from 'zustand'
import { FOCUS_DEFAULT_MINUTES } from '@/config/gameBalance'
import { clampFocusMinutes } from '@/domain/focus'
import type { FocusLink } from '@/types'

interface FocusTimerStore {
  /** 本次选择的时长（分钟），未开始时可自由调整 */
  minutes: number
  secondsRemaining: number
  running: boolean
  /** 本次专注关联的 Todo / Habit，可为 null */
  link: FocusLink | null
  setMinutes: (minutes: number) => void
  setLink: (link: FocusLink | null) => void
  start: () => void
  cancel: () => void
  decrement: () => void
}

/**
 * 专注倒计时状态特意不进 useGameStore / localStorage：
 * 刷新页面=中断本次专注，不给星尘也不惩罚（PRD 荣誉制原则），
 * 「今日已发放多少星尘」的持久化记账在 useGameStore.focusSessions 里。
 */
export const useFocusTimerStore = create<FocusTimerStore>((set, get) => ({
  minutes: FOCUS_DEFAULT_MINUTES,
  secondsRemaining: FOCUS_DEFAULT_MINUTES * 60,
  running: false,
  link: null,
  setMinutes: (minutes) => {
    if (get().running) {
      return // 跑起来之后不允许改时长，否则可以边跑边缩短来提前结算
    }
    const next = clampFocusMinutes(minutes)
    set({ minutes: next, secondsRemaining: next * 60 })
  },
  setLink: (link) => set({ link }),
  start: () => set((s) => ({ running: true, secondsRemaining: s.minutes * 60 })),
  cancel: () =>
    set((s) => ({ running: false, secondsRemaining: s.minutes * 60, link: s.link })),
  decrement: () => set((s) => ({ secondsRemaining: Math.max(0, s.secondsRemaining - 1) })),
}))
