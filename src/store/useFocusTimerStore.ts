import { create } from 'zustand'
import { FOCUS_SESSION_MINUTES } from '@/config/gameBalance'

const SESSION_SECONDS = FOCUS_SESSION_MINUTES * 60

interface FocusTimerStore {
  secondsRemaining: number
  running: boolean
  start: () => void
  cancel: () => void
  decrement: () => void
}

/**
 * 专注倒计时状态特意不进 useGameStore / localStorage：
 * 刷新页面=中断本次专注，不给星尘也不惩罚（PRD 荣誉制原则），
 * 「今日已完成几次」的持久化记账在 useGameStore.focusSessions 里。
 */
export const useFocusTimerStore = create<FocusTimerStore>((set) => ({
  secondsRemaining: SESSION_SECONDS,
  running: false,
  start: () => set({ running: true, secondsRemaining: SESSION_SECONDS }),
  cancel: () => set({ running: false, secondsRemaining: SESSION_SECONDS }),
  decrement: () =>
    set((s) => ({ secondsRemaining: Math.max(0, s.secondsRemaining - 1) })),
}))
