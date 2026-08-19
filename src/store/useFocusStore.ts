import { useGameStore } from './useGameStore'
import { useAuthStore } from './useAuthStore'
import { canStartFocusSession, countFocusSessionsToday } from '@/domain/focus'
import { FOCUS_DAILY_SESSION_LIMIT, FOCUS_REWARD_PER_SESSION } from '@/config/gameBalance'

/** 按域派生的选择器：专注计时的「今日次数」记账部分（倒计时本身在 useFocusTimerStore） */
export function useFocusStore() {
  const focusSessions = useGameStore((s) => s.state.focusSessions)
  const completeFocusSession = useGameStore((s) => s.completeFocusSession)
  const isAdmin = useAuthStore((s) => s.role === 'admin')

  return {
    sessionsToday: countFocusSessionsToday(focusSessions),
    dailyLimit: FOCUS_DAILY_SESSION_LIMIT,
    // admin 账号跳过每日上限，Start 按钮和文案都要跟着不显示「已达上限」
    canStart: canStartFocusSession(focusSessions, undefined, isAdmin),
    rewardPerSession: FOCUS_REWARD_PER_SESSION,
    completeFocusSession,
  }
}
