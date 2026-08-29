import { describe, expect, it } from 'vitest'
import {
  canAddHabit,
  completeHabit,
  createHabit,
  habitStardustEarnedToday,
  habitWeeklyCount,
  isHabitCompletedOn,
  isHabitTitleValid,
  lastNDateKeys,
  removeHabit,
  uncompleteHabit,
  updateHabit,
} from '../habits'
import { HABIT_DAILY_CAP, HABIT_MAX_ACTIVE, HABIT_REWARD_PER_COMPLETION } from '@/config/gameBalance'
import type { HabitCompletion, HabitItem } from '@/types'

const TODAY = '2026-08-29'
const YESTERDAY = '2026-08-28'

function completion(
  habitId: string,
  date: string,
  stardust = HABIT_REWARD_PER_COMPLETION,
  revoked = false,
): HabitCompletion {
  return { habitId, date, stardustAwarded: stardust, completedAt: `${date}T09:00:00.000Z`, revoked }
}

describe('habits 基本规则', () => {
  it('标题为空或过长都不合法', () => {
    expect(isHabitTitleValid('  ')).toBe(false)
    expect(isHabitTitleValid('喝水')).toBe(true)
    expect(isHabitTitleValid('x'.repeat(41))).toBe(false)
  })

  it('非法提醒时间会被丢掉，不会写进 Habit', () => {
    expect(createHabit('喝水', '25:99').reminderTime).toBeNull()
    expect(createHabit('喝水', '08:00').reminderTime).toBe('08:00')
  })

  it('进行中的 Habit 达到上限后不能再加，停用的不占额度', () => {
    const active: HabitItem[] = Array.from({ length: HABIT_MAX_ACTIVE }, (_, i) => ({
      id: `h${i}`,
      title: `习惯 ${i}`,
      reminderTime: null,
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z',
    }))
    expect(canAddHabit(active)).toBe(false)
    expect(canAddHabit(updateHabit(active, 'h0', { active: false }))).toBe(true)
  })
})

describe('habits 每天最多结算一次', () => {
  it('同一天重复勾选完全幂等，不重复发星尘', () => {
    const first = completeHabit([], 'h1', TODAY)
    expect(first.stardustEarned).toBe(HABIT_REWARD_PER_COMPLETION)

    const second = completeHabit(first.completions, 'h1', TODAY)
    expect(second.stardustEarned).toBe(0)
    expect(second.completions).toHaveLength(1)
  })

  it('昨天完成过不影响今天', () => {
    const before = [completion('h1', YESTERDAY)]
    expect(isHabitCompletedOn(before, 'h1', TODAY)).toBe(false)
    expect(completeHabit(before, 'h1', TODAY).stardustEarned).toBe(HABIT_REWARD_PER_COMPLETION)
  })
})

describe('habits 撤销不能变成刷分入口', () => {
  it('取消勾选保留已消耗的额度，重新勾选不再发第二次星尘', () => {
    const done = completeHabit([], 'h1', TODAY)
    const revokedList = uncompleteHabit(done.completions, 'h1', TODAY)

    // 撤销后不算「今天完成过」
    expect(isHabitCompletedOn(revokedList, 'h1', TODAY)).toBe(false)
    // 但额度依然算已经用掉了
    expect(habitStardustEarnedToday(revokedList, TODAY)).toBe(HABIT_REWARD_PER_COMPLETION)

    const again = completeHabit(revokedList, 'h1', TODAY)
    expect(again.stardustEarned).toBe(0)
    expect(isHabitCompletedOn(again.completions, 'h1', TODAY)).toBe(true)
  })

  it('反复勾-取消-勾不会突破每日上限', () => {
    let completions: HabitCompletion[] = []
    let total = 0
    for (let i = 0; i < 30; i += 1) {
      const result = completeHabit(completions, `h${i % 3}`, TODAY)
      completions = result.completions
      total += result.stardustEarned
      completions = uncompleteHabit(completions, `h${i % 3}`, TODAY)
    }
    expect(total).toBeLessThanOrEqual(HABIT_DAILY_CAP)
  })
})

describe('habits 每日上限', () => {
  it('打满上限后仍记录完成，但奖励为 0', () => {
    const full = [completion('x', TODAY, HABIT_DAILY_CAP)]
    const result = completeHabit(full, 'h1', TODAY)
    expect(result.stardustEarned).toBe(0)
    expect(result.completions).toHaveLength(2)
  })

  it('跨过上限的那一次按剩余额度部分发放', () => {
    const almost = [completion('x', TODAY, HABIT_DAILY_CAP - 2)]
    expect(completeHabit(almost, 'h1', TODAY).stardustEarned).toBe(2)
  })

  it('isAdmin=true 跳过每日上限', () => {
    const full = [completion('x', TODAY, HABIT_DAILY_CAP)]
    expect(completeHabit(full, 'h1', TODAY, true).stardustEarned).toBe(
      HABIT_REWARD_PER_COMPLETION,
    )
  })
})

describe('habits 本周统计', () => {
  it('lastNDateKeys 含今天并往回数', () => {
    expect(lastNDateKeys(3, TODAY)).toEqual(['2026-08-29', '2026-08-28', '2026-08-27'])
  })

  it('只数近 7 天且不数被撤销的', () => {
    const completions = [
      completion('h1', TODAY),
      completion('h1', YESTERDAY),
      completion('h1', '2026-08-27', HABIT_REWARD_PER_COMPLETION, true),
      completion('h1', '2026-08-01'),
    ]
    expect(habitWeeklyCount(completions, 'h1', TODAY)).toBe(2)
  })
})

describe('habits 删除', () => {
  it('删除 Habit 会一并清掉它的完成记录，不留孤儿数据', () => {
    const habits: HabitItem[] = [
      { id: 'h1', title: '喝水', reminderTime: null, active: true, createdAt: '' },
      { id: 'h2', title: '阅读', reminderTime: null, active: true, createdAt: '' },
    ]
    const completions = [completion('h1', TODAY), completion('h2', TODAY)]
    const result = removeHabit(habits, completions, 'h1')
    expect(result.habits.map((h) => h.id)).toEqual(['h2'])
    expect(result.completions.map((c) => c.habitId)).toEqual(['h2'])
  })
})
