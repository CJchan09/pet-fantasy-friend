import { useGameStore } from './useGameStore'
import { useAuthStore } from './useAuthStore'
import {
  countFocusSessionsToday,
  focusMinutesToday,
  focusStardustEarnedToday,
  focusStardustRemainingToday,
  previewFocusReward,
} from '@/domain/focus'
import { FOCUS_DAILY_CAP } from '@/config/gameBalance'

/** 按域派生的选择器：专注记账部分（倒计时本身在 useFocusTimerStore） */
export function useFocusStore() {
  const focusSessions = useGameStore((s) => s.state.focusSessions)
  const completeFocusSession = useGameStore((s) => s.completeFocusSession)
  const isAdmin = useAuthStore((s) => s.role === 'admin')

  return {
    focusSessions,
    sessionsToday: countFocusSessionsToday(focusSessions),
    minutesToday: focusMinutesToday(focusSessions),
    stardustEarnedToday: focusStardustEarnedToday(focusSessions),
    stardustRemainingToday: focusStardustRemainingToday(focusSessions, undefined, isAdmin),
    dailyCap: FOCUS_DAILY_CAP,
    /**
     * 每日上限只挡星尘，不挡「开始专注」——用户想继续专注是好事。
     * UI 用这个算「这次跑完能拿多少」，达上限时会是 0，如实显示。
     */
    previewReward: (minutes: number) =>
      previewFocusReward(focusSessions, minutes, undefined, isAdmin),
    completeFocusSession,
  }
}
