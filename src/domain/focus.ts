import { FOCUS_DAILY_SESSION_LIMIT, FOCUS_REWARD_PER_SESSION } from '@/config/gameBalance'
import { getLocalDateKey } from './reflection'
import type { FocusSessionRecord } from '@/types'

/**
 * 专注计时做荣誉制，不做严格监控（PRD 5.3 风险 #2：Page Visibility API 测不准）。
 * 倒计时本身不持久化——刷新页面即中断，不给星尘也不惩罚。
 * 但「今日已完成几次」必须持久化，否则刷新可以绕过每日 4 次上限。
 */

export function countFocusSessionsToday(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
): number {
  return sessions.filter((s) => s.date === today).length
}

export function canStartFocusSession(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
): boolean {
  return countFocusSessionsToday(sessions, today) < FOCUS_DAILY_SESSION_LIMIT
}

export interface CompleteFocusResult {
  sessions: FocusSessionRecord[]
  stardustEarned: number
}

/**
 * 专注计时跑满后调用。已达当日上限时返回 0 星尘，不追加记录（避免无限增长的日志）。
 */
export function completeFocusSession(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
): CompleteFocusResult {
  if (!canStartFocusSession(sessions, today)) {
    return { sessions, stardustEarned: 0 }
  }
  return {
    sessions: [...sessions, { date: today, completedAt: new Date().toISOString() }],
    stardustEarned: FOCUS_REWARD_PER_SESSION,
  }
}
