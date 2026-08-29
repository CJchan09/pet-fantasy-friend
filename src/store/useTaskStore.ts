import { useGameStore } from './useGameStore'
import { useAuthStore } from './useAuthStore'
import {
  canRewardMoreTasksToday,
  completedTasks,
  countTasksRewardedToday,
  todaysTasks,
  upcomingTasks,
} from '@/domain/tasks'
import { TASK_FREE_DAILY_ITEM_LIMIT, TASK_REWARD_PER_ITEM } from '@/config/gameBalance'

/** 按域派生的选择器：Todo */
export function useTaskStore() {
  const tasks = useGameStore((s) => s.state.tasks)
  const addTask = useGameStore((s) => s.addTask)
  const removeTask = useGameStore((s) => s.removeTask)
  const toggleTask = useGameStore((s) => s.toggleTask)
  const updateTask = useGameStore((s) => s.updateTask)
  const isAdmin = useAuthStore((s) => s.role === 'admin')

  const rewardedTodayCount = countTasksRewardedToday(tasks)

  return {
    tasks,
    /** Today 页面用：今天到期 / 已过期 / 置顶 / 没设截止日的未完成项 */
    today: todaysTasks(tasks),
    upcoming: upcomingTasks(tasks),
    completed: completedTasks(tasks),
    rewardedTodayCount,
    rewardPerItem: TASK_REWARD_PER_ITEM,
    dailyRewardLimit: TASK_FREE_DAILY_ITEM_LIMIT,
    /** UI 判断「今天还能不能领」要用这个，不要直接拿 rewardedTodayCount 跟 dailyRewardLimit 比——admin 账号会跳过 */
    canRewardMore: canRewardMoreTasksToday(rewardedTodayCount, isAdmin),
    addTask,
    removeTask,
    toggleTask,
    updateTask,
  }
}
