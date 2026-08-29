import { TASK_FREE_DAILY_ITEM_LIMIT, TASK_REWARD_PER_ITEM } from '@/config/gameBalance'
import { getLocalDateKey } from './reflection'
import { isValidReminderTime } from './reminders'
import type { ReminderTime, TaskItem } from '@/types'

/**
 * Todo 是一次性待办（加→勾选→完成→进历史），不是每日重置的习惯打卡——那是 Habit。
 * 每个任务只发一次星尘：一旦 rewarded=true 就永远是 true，重复勾选/取消不会重复领。
 * 「每日上限 5 项」指当天新增的已发放星尘任务数——超过后照样能勾选完成，只是不再发星尘。
 *
 * 奖励刻意定得比 Habit 低（4 vs 5，≈20 分钟专注）：Todo 是唯一可以被用户任意拆碎的来源，
 * 数值一高就会变成刷分入口，把专注挤掉（方案文档 §7.2 点名的风险）。
 */

export const TASK_MAX_LABEL_LENGTH = 60

export function countTasksRewardedToday(tasks: TaskItem[], today = getLocalDateKey()): number {
  return tasks.filter((t) => t.rewarded && t.rewardedDate === today).length
}

/** isAdmin：CJ 的测试账号跳过每日上限（Supabase profiles.role='admin'，见 useGameStore.ts） */
export function canRewardMoreTasksToday(rewardedTodayCount: number, isAdmin = false): boolean {
  return isAdmin || rewardedTodayCount < TASK_FREE_DAILY_ITEM_LIMIT
}

export interface CompleteTaskResult {
  tasks: TaskItem[]
  stardustEarned: number
}

/**
 * 勾选任务完成。已经完成过的任务再次勾选不做任何事（幂等）。
 */
export function completeTask(
  tasks: TaskItem[],
  id: string,
  today = getLocalDateKey(),
  isAdmin = false,
): CompleteTaskResult {
  const target = tasks.find((t) => t.id === id)
  if (!target || target.done) {
    return { tasks, stardustEarned: 0 }
  }

  const completedAt = new Date().toISOString()

  // 已经发过星尘的任务（曾经完成过又被取消勾选）重新勾选：只改 done，不再判定/发放星尘
  // （admin 也不例外——这条是防重复刷同一个任务，不是每日上限，两者不是一回事）
  if (target.rewarded) {
    return {
      tasks: tasks.map((t) => (t.id === id ? { ...t, done: true, completedAt } : t)),
      stardustEarned: 0,
    }
  }

  const rewardedTodayCount = countTasksRewardedToday(tasks, today)
  const canReward = canRewardMoreTasksToday(rewardedTodayCount, isAdmin)
  const stardustEarned = canReward ? TASK_REWARD_PER_ITEM : 0

  return {
    tasks: tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            done: true,
            completedAt,
            rewarded: canReward,
            rewardedDate: canReward ? today : undefined,
          }
        : t,
    ),
    stardustEarned,
  }
}

export function uncompleteTask(tasks: TaskItem[], id: string): TaskItem[] {
  return tasks.map((t) => (t.id === id ? { ...t, done: false, completedAt: undefined } : t))
}

export interface CreateTaskOptions {
  dueDate?: string | null
  reminderTime?: ReminderTime
}

export function createTask(label: string, options: CreateTaskOptions = {}): TaskItem {
  const dueDate = isValidDueDate(options.dueDate) ? options.dueDate : null
  return {
    id: crypto.randomUUID(),
    label: label.trim(),
    done: false,
    rewarded: false,
    createdAt: new Date().toISOString(),
    dueDate,
    // 提醒依附于截止日：没有截止日的任务没有「什么时候提醒」可言
    reminderTime: dueDate && isValidReminderTime(options.reminderTime) ? options.reminderTime : null,
    pinned: false,
  }
}

export function updateTask(
  tasks: TaskItem[],
  id: string,
  patch: Partial<Pick<TaskItem, 'label' | 'dueDate' | 'reminderTime' | 'pinned'>>,
): TaskItem[] {
  return tasks.map((t) => {
    if (t.id !== id) {
      return t
    }
    const next = { ...t }
    if (patch.label !== undefined && isTaskLabelValid(patch.label)) {
      next.label = patch.label.trim()
    }
    if (patch.dueDate !== undefined) {
      next.dueDate = isValidDueDate(patch.dueDate) ? patch.dueDate : null
      if (!next.dueDate) {
        next.reminderTime = null
      }
    }
    if (patch.reminderTime !== undefined) {
      next.reminderTime =
        next.dueDate && isValidReminderTime(patch.reminderTime) ? patch.reminderTime : null
    }
    if (patch.pinned !== undefined) {
      next.pinned = patch.pinned
    }
    return next
  })
}

export function removeTask(tasks: TaskItem[], id: string): TaskItem[] {
  return tasks.filter((t) => t.id !== id)
}

export function isTaskLabelValid(label: string): boolean {
  const trimmed = label.trim()
  return trimmed.length > 0 && trimmed.length <= TASK_MAX_LABEL_LENGTH
}

const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDueDate(value: unknown): value is string {
  return typeof value === 'string' && DUE_DATE_PATTERN.test(value)
}

/** 过期未完成：有截止日、截止日早于今天、还没勾。UI 只用它标个提示，**不惩罚**、不扣星尘 */
export function isTaskOverdue(task: TaskItem, today = getLocalDateKey()): boolean {
  return !task.done && isValidDueDate(task.dueDate) && task.dueDate < today
}

export function isTaskDueToday(task: TaskItem, today = getLocalDateKey()): boolean {
  return isValidDueDate(task.dueDate) && task.dueDate === today
}

/**
 * Today 页面显示哪些 Todo（方案文档 §6.1）：今天到期 + 已过期 + 用户置顶 + 没设截止日的。
 * 「没设截止日的也显示」是刻意的：第一版大部分用户不会填截止日，
 * 全按截止日过滤会让 Today 空空如也，反而不如旧版好用。
 */
export function todaysTasks(tasks: TaskItem[], today = getLocalDateKey()): TaskItem[] {
  return tasks.filter(
    (t) =>
      !t.done &&
      (t.pinned === true || !isValidDueDate(t.dueDate) || t.dueDate <= today),
  )
}

/** 未来到期、今天不用管的任务 */
export function upcomingTasks(tasks: TaskItem[], today = getLocalDateKey()): TaskItem[] {
  return tasks.filter(
    (t) => !t.done && t.pinned !== true && isValidDueDate(t.dueDate) && t.dueDate > today,
  )
}

/** 已完成历史，最近完成的排最前（旧存档没有 completedAt，退回 createdAt 排序） */
export function completedTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
}
