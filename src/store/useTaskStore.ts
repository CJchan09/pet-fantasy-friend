import { useGameStore } from './useGameStore'
import { countTasksRewardedToday } from '@/domain/tasks'
import { TASK_FREE_DAILY_ITEM_LIMIT } from '@/config/gameBalance'

/** 按域派生的选择器：自定义任务 */
export function useTaskStore() {
  const tasks = useGameStore((s) => s.state.tasks)
  const addTask = useGameStore((s) => s.addTask)
  const removeTask = useGameStore((s) => s.removeTask)
  const toggleTask = useGameStore((s) => s.toggleTask)

  return {
    tasks,
    rewardedTodayCount: countTasksRewardedToday(tasks),
    dailyRewardLimit: TASK_FREE_DAILY_ITEM_LIMIT,
    addTask,
    removeTask,
    toggleTask,
  }
}
