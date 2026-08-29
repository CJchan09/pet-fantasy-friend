import {
  HABIT_DAILY_CAP,
  HABIT_MAX_ACTIVE,
  HABIT_REWARD_PER_COMPLETION,
} from '@/config/gameBalance'
import { getLocalDateKey } from './reflection'
import { isValidReminderTime } from './reminders'
import type { HabitCompletion, HabitItem, ReminderTime } from '@/types'

/**
 * 每日习惯。核心不变量（方案文档 §5.1）：
 * - 一个 Habit 每个自然日最多结算一次（(habitId, date) 唯一）。
 * - 漏掉一天**不扣星尘、不伤害宠物、不清空历史**——这里没有任何惩罚分支，别加。
 * - 只显示本周完成次数，不做带压力的超长连续天数。
 */

export const HABIT_MAX_TITLE_LENGTH = 40

export function isHabitTitleValid(title: string): boolean {
  const trimmed = title.trim()
  return trimmed.length > 0 && trimmed.length <= HABIT_MAX_TITLE_LENGTH
}

export function activeHabits(habits: HabitItem[]): HabitItem[] {
  return habits.filter((h) => h.active)
}

export function canAddHabit(habits: HabitItem[]): boolean {
  return activeHabits(habits).length < HABIT_MAX_ACTIVE
}

export function createHabit(title: string, reminderTime: ReminderTime = null): HabitItem {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    reminderTime: isValidReminderTime(reminderTime) ? reminderTime : null,
    active: true,
    createdAt: new Date().toISOString(),
  }
}

/** 「今天完成了吗」：被撤销的记录不算完成，但它占掉的每日额度依然作数 */
export function isHabitCompletedOn(
  completions: HabitCompletion[],
  habitId: string,
  date = getLocalDateKey(),
): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date && !c.revoked)
}

/**
 * 今日已由 Habit 消耗掉的每日额度。
 * 刻意把 revoked 的记录也算进来——星尘已经发出去了不回收，额度自然也不该退回，
 * 否则「勾→取消→再勾」可以无限突破 HABIT_DAILY_CAP。
 */
export function habitStardustEarnedToday(
  completions: HabitCompletion[],
  today = getLocalDateKey(),
): number {
  return completions
    .filter((c) => c.date === today)
    .reduce((sum, c) => sum + c.stardustAwarded, 0)
}

/** isAdmin：CJ 的测试账号跳过每日上限（Supabase profiles.role='admin'） */
export function habitRewardFor(
  completions: HabitCompletion[],
  today = getLocalDateKey(),
  isAdmin = false,
): number {
  if (isAdmin) {
    return HABIT_REWARD_PER_COMPLETION
  }
  const remaining = HABIT_DAILY_CAP - habitStardustEarnedToday(completions, today)
  return Math.max(0, Math.min(HABIT_REWARD_PER_COMPLETION, remaining))
}

export interface CompleteHabitResult {
  completions: HabitCompletion[]
  stardustEarned: number
}

/**
 * 勾选完成某个 Habit。
 * - 今天已完成（未撤销）→ 完全幂等，不加记录也不发星尘。
 * - 今天撤销过又重新勾 → 复活那条记录（revoked=false），**不再发第二次星尘**。
 * - 达到每日上限 → 仍然记录完成（行为该被看见），奖励为 0。
 */
export function completeHabit(
  completions: HabitCompletion[],
  habitId: string,
  today = getLocalDateKey(),
  isAdmin = false,
): CompleteHabitResult {
  const existing = completions.find((c) => c.habitId === habitId && c.date === today)
  if (existing && !existing.revoked) {
    return { completions, stardustEarned: 0 }
  }
  if (existing) {
    return {
      completions: completions.map((c) =>
        c === existing ? { ...c, revoked: false, completedAt: new Date().toISOString() } : c,
      ),
      stardustEarned: 0,
    }
  }

  const stardustEarned = habitRewardFor(completions, today, isAdmin)
  return {
    completions: [
      ...completions,
      {
        habitId,
        date: today,
        stardustAwarded: stardustEarned,
        completedAt: new Date().toISOString(),
      },
    ],
    stardustEarned,
  }
}

/** 取消今天的勾选：标记 revoked，不删记录、不回收星尘（见 habitStardustEarnedToday 注释） */
export function uncompleteHabit(
  completions: HabitCompletion[],
  habitId: string,
  today = getLocalDateKey(),
): HabitCompletion[] {
  return completions.map((c) =>
    c.habitId === habitId && c.date === today ? { ...c, revoked: true } : c,
  )
}

/** 本周（近 7 天，含今天）完成次数。方案文档 §5.1：不强调连续天数 */
export function habitWeeklyCount(
  completions: HabitCompletion[],
  habitId: string,
  today = getLocalDateKey(),
): number {
  const days = lastNDateKeys(7, today)
  return completions.filter(
    (c) => c.habitId === habitId && !c.revoked && days.includes(c.date),
  ).length
}

/** 从 today 往回数 n 天的日期 key（含 today），最新的在最前 */
export function lastNDateKeys(n: number, today = getLocalDateKey()): string[] {
  const base = new Date(`${today}T00:00:00`)
  const keys: string[] = []
  for (let i = 0; i < n; i += 1) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    keys.push(getLocalDateKey(d))
  }
  return keys
}

export function updateHabit(
  habits: HabitItem[],
  id: string,
  patch: Partial<Pick<HabitItem, 'title' | 'reminderTime' | 'active'>>,
): HabitItem[] {
  return habits.map((h) => {
    if (h.id !== id) {
      return h
    }
    const next = { ...h }
    if (patch.title !== undefined && isHabitTitleValid(patch.title)) {
      next.title = patch.title.trim()
    }
    if (patch.reminderTime !== undefined) {
      next.reminderTime = isValidReminderTime(patch.reminderTime) ? patch.reminderTime : null
    }
    if (patch.active !== undefined) {
      next.active = patch.active
    }
    return next
  })
}

/** 删除 Habit 时一并清掉它的完成记录，避免存档里留下永远查不到主体的孤儿数据 */
export function removeHabit(
  habits: HabitItem[],
  completions: HabitCompletion[],
  id: string,
): { habits: HabitItem[]; completions: HabitCompletion[] } {
  return {
    habits: habits.filter((h) => h.id !== id),
    completions: completions.filter((c) => c.habitId !== id),
  }
}
