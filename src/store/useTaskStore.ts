import { useGameStore } from './useGameStore'
import { useAuthStore } from './useAuthStore'
import { canRewardMoreTasksToday, countTasksRewardedToday } from '@/domain/tasks'
import { TASK_FREE_DAILY_ITEM_LIMIT } from '@/config/gameBalance'

/** 按域派生的选择器：自定义任务 */
export function useTaskStore() {
  const tasks = useGameStore((s) => s.state.tasks)
  const addTask = useGameStore((s) => s.addTask)
  const removeTask = useGameStore((s) => s.removeTask)
  const toggleTask = useGameStore((s) => s.toggleTask)
  const isAdmin = useAuthStore((s) => s.role === 'admin')

  const rewardedTodayCount = countTasksRewardedToday(tasks)

  return {
    tasks,
    rewardedTodayCount,
    dailyRewardLimit: TASK_FREE_DAILY_ITEM_LIMIT,
    /** UI 判断「今天还能不能领」要用这个，不要直接拿 rewardedTodayCount 跟 dailyRewardLimit 比——admin 账号会跳过 */
    canRewardMore: canRewardMoreTasksToday(rewardedTodayCount, isAdmin),
    addTask,
    removeTask,
    toggleTask,
  }
}
