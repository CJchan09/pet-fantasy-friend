import { describe, expect, it } from 'vitest'
import { canStartFocusSession, completeFocusSession, countFocusSessionsToday } from '../focus'
import { FOCUS_DAILY_SESSION_LIMIT, FOCUS_REWARD_PER_SESSION } from '@/config/gameBalance'
import type { FocusSessionRecord } from '@/types'

const TODAY = '2026-08-05'

function sessionsToday(n: number): FocusSessionRecord[] {
  return Array.from({ length: n }, () => ({ date: TODAY, completedAt: '2026-08-05T00:00:00.000Z' }))
}

describe('focus 每日上限', () => {
  it('未达上限时可以开始新的一次', () => {
    expect(canStartFocusSession(sessionsToday(FOCUS_DAILY_SESSION_LIMIT - 1), TODAY)).toBe(true)
  })

  it('达到上限后不能再开始', () => {
    expect(canStartFocusSession(sessionsToday(FOCUS_DAILY_SESSION_LIMIT), TODAY)).toBe(false)
  })

  it('completeFocusSession 未达上限时发放星尘并记录', () => {
    const { sessions, stardustEarned } = completeFocusSession([], TODAY)
    expect(stardustEarned).toBe(FOCUS_REWARD_PER_SESSION)
    expect(sessions).toHaveLength(1)
  })

  it('completeFocusSession 达到上限时不发星尘也不新增记录', () => {
    const full = sessionsToday(FOCUS_DAILY_SESSION_LIMIT)
    const { sessions, stardustEarned } = completeFocusSession(full, TODAY)
    expect(stardustEarned).toBe(0)
    expect(sessions).toHaveLength(FOCUS_DAILY_SESSION_LIMIT)
  })

  it('昨天的记录不计入今天的计数', () => {
    const yesterday: FocusSessionRecord[] = [
      { date: '2026-08-04', completedAt: '2026-08-04T00:00:00.000Z' },
    ]
    expect(countFocusSessionsToday(yesterday, TODAY)).toBe(0)
    expect(canStartFocusSession(yesterday, TODAY)).toBe(true)
  })
})
