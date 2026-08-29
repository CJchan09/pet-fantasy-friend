import { useGameStore } from './useGameStore'
import { useAuthStore } from './useAuthStore'
import {
  activeHabits,
  canAddHabit,
  habitRewardFor,
  habitStardustEarnedToday,
  habitWeeklyCount,
  isHabitCompletedOn,
} from '@/domain/habits'
import { HABIT_DAILY_CAP, HABIT_MAX_ACTIVE, HABIT_REWARD_PER_COMPLETION } from '@/config/gameBalance'

/** 按域派生的选择器：每日习惯 */
export function useHabitStore() {
  const habits = useGameStore((s) => s.state.habits)
  const completions = useGameStore((s) => s.state.habitCompletions)
  const addHabit = useGameStore((s) => s.addHabit)
  const updateHabit = useGameStore((s) => s.updateHabit)
  const removeHabit = useGameStore((s) => s.removeHabit)
  const toggleHabit = useGameStore((s) => s.toggleHabit)
  const isAdmin = useAuthStore((s) => s.role === 'admin')

  const active = activeHabits(habits)

  return {
    habits,
    activeHabits: active,
    /** 今日清单：Habit + 今天是否已完成 + 本周完成次数 */
    todayList: active.map((habit) => ({
      habit,
      done: isHabitCompletedOn(completions, habit.id),
      weeklyCount: habitWeeklyCount(completions, habit.id),
    })),
    completedTodayCount: active.filter((h) => isHabitCompletedOn(completions, h.id)).length,
    rewardPerCompletion: HABIT_REWARD_PER_COMPLETION,
    /** 下一次勾选实际能拿多少（已达上限时是 0，UI 要如实显示，不能画大饼） */
    nextReward: habitRewardFor(completions, undefined, isAdmin),
    stardustEarnedToday: habitStardustEarnedToday(completions),
    dailyCap: HABIT_DAILY_CAP,
    maxActive: HABIT_MAX_ACTIVE,
    canAdd: canAddHabit(habits),
    addHabit,
    updateHabit,
    removeHabit,
    toggleHabit,
  }
}
