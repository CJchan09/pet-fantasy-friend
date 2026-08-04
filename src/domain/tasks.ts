import { TASK_FREE_DAILY_ITEM_LIMIT, TASK_REWARD_PER_ITEM } from '@/config/gameBalance'
import { getLocalDateKey } from './reflection'
import type { TaskItem } from '@/types'

/**
 * 自定义任务是一次性待办（加→勾选→完成→可删除），不是每日重置的习惯打卡。
 * 每个任务只发一次星尘：一旦 rewarded=true 就永远是 true，重复勾选/取消不会重复领。
 * 「每日上限 5 项」指当天新增的已发放星尘任务数——超过后照样能勾选完成，只是不再发星尘。
 */

export function countTasksRewardedToday(tasks: TaskItem[], today = getLocalDateKey()): number {
  return tasks.filter((t) => t.rewarded && t.rewardedDate === today).length
}

export function canRewardMoreTasksToday(rewardedTodayCount: number): boolean {
  return rewardedTodayCount < TASK_FREE_DAILY_ITEM_LIMIT
}

export interface CompleteTaskResult {
  tasks: TaskItem[]
  stardustEarned: number
}

/**
 * 勾选任务完成。已经完成过的任务再次勾选不做任何事（幂等）。
 */
export function completeTask(tasks: TaskItem[], id: string, today = getLocalDateKey()): CompleteTaskResult {
  const target = tasks.find((t) => t.id === id)
  if (!target || target.done) {
    return { tasks, stardustEarned: 0 }
  }

  // 已经发过星尘的任务（曾经完成过又被取消勾选）重新勾选：只改 done，不再判定/发放星尘
  if (target.rewarded) {
    return {
      tasks: tasks.map((t) => (t.id === id ? { ...t, done: true } : t)),
      stardustEarned: 0,
    }
  }

  const rewardedTodayCount = countTasksRewardedToday(tasks, today)
  const canReward = canRewardMoreTasksToday(rewardedTodayCount)
  const stardustEarned = canReward ? TASK_REWARD_PER_ITEM : 0

  return {
    tasks: tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            done: true,
            rewarded: canReward,
            rewardedDate: canReward ? today : undefined,
          }
        : t,
    ),
    stardustEarned,
  }
}

export function uncompleteTask(tasks: TaskItem[], id: string): TaskItem[] {
  return tasks.map((t) => (t.id === id ? { ...t, done: false } : t))
}

export function createTask(label: string): TaskItem {
  return {
    id: crypto.randomUUID(),
    label: label.trim(),
    done: false,
    rewarded: false,
    createdAt: new Date().toISOString(),
  }
}

export function removeTask(tasks: TaskItem[], id: string): TaskItem[] {
  return tasks.filter((t) => t.id !== id)
}

export function isTaskLabelValid(label: string): boolean {
  return label.trim().length > 0
}
