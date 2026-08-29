import {
  FOCUS_DAILY_CAP,
  FOCUS_DEFAULT_MINUTES,
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
  FOCUS_MINUTES_PER_STARDUST,
  FOCUS_STEP_MINUTES,
} from '@/config/gameBalance'
import { getLocalDateKey } from './reflection'
import type { FocusLink, FocusSessionRecord } from '@/types'

/**
 * 专注计时做荣誉制，不做严格监控（PRD 5.3 风险 #2：Page Visibility API 测不准）。
 * 倒计时本身不持久化——刷新页面即中断，不给星尘也不惩罚、不显示责备文案。
 * 但「今日已发放多少星尘」必须持久化，否则刷新可以绕过每日上限。
 *
 * 星尘公式（CJ 2026-08-29 确认）：floor(完整完成分钟数 / 5)，不足一档不进位。
 * 这是整个经济的计价锚点：所有其他产出都按「等价多少分钟专注」来定（见 config/gameBalance.ts）。
 */

/** 把任意输入夹到合法的时长（5–180 分钟，5 分钟步进） */
export function clampFocusMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) {
    return FOCUS_DEFAULT_MINUTES
  }
  const stepped = Math.round(minutes / FOCUS_STEP_MINUTES) * FOCUS_STEP_MINUTES
  return Math.min(FOCUS_MAX_MINUTES, Math.max(FOCUS_MIN_MINUTES, stepped))
}

export function isValidFocusMinutes(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= FOCUS_MIN_MINUTES &&
    minutes <= FOCUS_MAX_MINUTES &&
    minutes % FOCUS_STEP_MINUTES === 0
  )
}

/** 公式值（未扣每日上限）。中途取消的分钟数不该传进来——取消根本不结算 */
export function focusStardustFor(completedMinutes: number): number {
  if (!Number.isFinite(completedMinutes) || completedMinutes <= 0) {
    return 0
  }
  return Math.floor(completedMinutes / FOCUS_MINUTES_PER_STARDUST)
}

/** 旧存档的记录没有 stardustAwarded/plannedMinutes，按当年的固定值 25 分钟回填 */
const LEGACY_SESSION_MINUTES = 25

export function sessionMinutes(session: FocusSessionRecord): number {
  return session.completedMinutes ?? session.plannedMinutes ?? LEGACY_SESSION_MINUTES
}

export function countFocusSessionsToday(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
): number {
  return sessions.filter((s) => s.date === today).length
}

export function focusMinutesToday(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
): number {
  return sessions.filter((s) => s.date === today).reduce((sum, s) => sum + sessionMinutes(s), 0)
}

/**
 * 今日已由专注发出的星尘。旧记录没有 stardustAwarded 字段——
 * 用旧的固定奖励 15 回填会让老用户当天凭空少赚，用新公式回填又跟当时实发不符；
 * 这里取「记录里写了多少就是多少，没写就按新公式重算」，
 * 保证同一天内的上限判断自洽，也不会追溯扣掉老用户已经拿到的余额。
 */
export function focusStardustEarnedToday(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
): number {
  return sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.stardustAwarded ?? focusStardustFor(sessionMinutes(s))), 0)
}

/** 今天还剩多少专注星尘额度 */
export function focusStardustRemainingToday(
  sessions: FocusSessionRecord[],
  today = getLocalDateKey(),
  isAdmin = false,
): number {
  if (isAdmin) {
    return Number.POSITIVE_INFINITY
  }
  return Math.max(0, FOCUS_DAILY_CAP - focusStardustEarnedToday(sessions, today))
}

/**
 * 每日上限只挡星尘，不挡「开始专注」这个动作本身——
 * 用户想在额度用完后继续专注是好事，不该被产品拦住（方案文档 §5「不惩罚」精神）。
 * 所以这里没有 canStartFocusSession，只有「这次能拿多少」。
 */
export function previewFocusReward(
  sessions: FocusSessionRecord[],
  plannedMinutes: number,
  today = getLocalDateKey(),
  isAdmin = false,
): number {
  const formula = focusStardustFor(plannedMinutes)
  if (isAdmin) {
    return formula
  }
  return Math.min(formula, focusStardustRemainingToday(sessions, today))
}

export interface CompleteFocusResult {
  sessions: FocusSessionRecord[]
  stardustEarned: number
}

/**
 * 专注计时跑满后调用。中途取消的路径根本不会走到这里（UI 直接丢弃计时状态）。
 * 达到每日上限时依然记录这次专注（统计要看得见真实投入），只是 stardustAwarded=0。
 */
export function completeFocusSession(
  sessions: FocusSessionRecord[],
  completedMinutes: number,
  link: FocusLink | null = null,
  today = getLocalDateKey(),
  isAdmin = false,
): CompleteFocusResult {
  const minutes = clampFocusMinutes(completedMinutes)
  const stardustEarned = previewFocusReward(sessions, minutes, today, isAdmin)
  return {
    sessions: [
      ...sessions,
      {
        date: today,
        completedAt: new Date().toISOString(),
        plannedMinutes: minutes,
        completedMinutes: minutes,
        stardustAwarded: stardustEarned,
        link,
      },
    ],
    stardustEarned,
  }
}
