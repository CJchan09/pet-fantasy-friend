import { describe, expect, it } from 'vitest'
import {
  clampFocusMinutes,
  completeFocusSession,
  countFocusSessionsToday,
  focusMinutesToday,
  focusStardustEarnedToday,
  focusStardustFor,
  isValidFocusMinutes,
  previewFocusReward,
} from '../focus'
import { FOCUS_DAILY_CAP, FOCUS_MINUTES_PER_STARDUST } from '@/config/gameBalance'
import type { FocusSessionRecord } from '@/types'

const TODAY = '2026-08-05'

function session(minutes: number, stardust: number, date = TODAY): FocusSessionRecord {
  return {
    date,
    completedAt: `${date}T00:00:00.000Z`,
    plannedMinutes: minutes,
    completedMinutes: minutes,
    stardustAwarded: stardust,
  }
}

describe('focus 星尘公式 floor(分钟/5)', () => {
  it.each([
    [5, 1],
    [10, 2],
    [15, 3],
    [25, 5],
    [30, 6],
    [45, 9],
    [60, 12],
  ])('%i 分钟 → %i 星尘', (minutes, expected) => {
    expect(focusStardustFor(minutes)).toBe(expected)
  })

  it('不足一档不进位', () => {
    expect(focusStardustFor(FOCUS_MINUTES_PER_STARDUST - 1)).toBe(0)
    expect(focusStardustFor(24)).toBe(4)
  })

  it('0 或负数不给星尘', () => {
    expect(focusStardustFor(0)).toBe(0)
    expect(focusStardustFor(-30)).toBe(0)
  })
})

describe('focus 时长合法性', () => {
  it('夹到 5–180 分钟并对齐 5 分钟步进', () => {
    expect(clampFocusMinutes(1)).toBe(5)
    expect(clampFocusMinutes(999)).toBe(180)
    expect(clampFocusMinutes(27)).toBe(25)
    expect(clampFocusMinutes(28)).toBe(30)
  })

  it('非法输入退回默认时长', () => {
    expect(clampFocusMinutes(Number.NaN)).toBe(25)
  })

  it('isValidFocusMinutes 只认步进上的整数', () => {
    expect(isValidFocusMinutes(25)).toBe(true)
    expect(isValidFocusMinutes(26)).toBe(false)
    expect(isValidFocusMinutes(200)).toBe(false)
    expect(isValidFocusMinutes(0)).toBe(false)
  })
})

describe('focus 每日星尘上限', () => {
  it('未达上限时按公式全额发放并写入记录', () => {
    const { sessions, stardustEarned } = completeFocusSession([], 25, null, TODAY)
    expect(stardustEarned).toBe(5)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].completedMinutes).toBe(25)
    expect(sessions[0].stardustAwarded).toBe(5)
  })

  it('达到上限后依然记录这次专注，但奖励为 0', () => {
    const full = [session(180, FOCUS_DAILY_CAP)]
    const { sessions, stardustEarned } = completeFocusSession(full, 25, null, TODAY)
    expect(stardustEarned).toBe(0)
    // 行为要被看见：记录照样加，只是不发星尘
    expect(sessions).toHaveLength(2)
    expect(sessions[1].stardustAwarded).toBe(0)
  })

  it('跨过上限的那一次按剩余额度部分发放', () => {
    const almost = [session(170, FOCUS_DAILY_CAP - 2)]
    const { stardustEarned } = completeFocusSession(almost, 60, null, TODAY)
    expect(stardustEarned).toBe(2)
  })

  it('昨天的记录不占用今天的额度', () => {
    const yesterday = [session(180, FOCUS_DAILY_CAP, '2026-08-04')]
    expect(countFocusSessionsToday(yesterday, TODAY)).toBe(0)
    expect(focusStardustEarnedToday(yesterday, TODAY)).toBe(0)
    expect(previewFocusReward(yesterday, 25, TODAY)).toBe(5)
  })

  it('isAdmin=true 时跳过每日上限', () => {
    const full = [session(180, FOCUS_DAILY_CAP)]
    const { stardustEarned } = completeFocusSession(full, 25, null, TODAY, true)
    expect(stardustEarned).toBe(5)
  })

  it('可选关联的 Todo 会写进记录', () => {
    const link = { kind: 'todo' as const, id: 'abc', label: '写提案' }
    const { sessions } = completeFocusSession([], 25, link, TODAY)
    expect(sessions[0].link).toEqual(link)
  })
})

describe('focus 旧存档兼容', () => {
  const legacy: FocusSessionRecord[] = [{ date: TODAY, completedAt: `${TODAY}T00:00:00.000Z` }]

  it('没有时长字段的旧记录按当年固定值 25 分钟计', () => {
    expect(focusMinutesToday(legacy, TODAY)).toBe(25)
  })

  it('没有 stardustAwarded 的旧记录按新公式回填参与上限计算', () => {
    expect(focusStardustEarnedToday(legacy, TODAY)).toBe(5)
  })
})
