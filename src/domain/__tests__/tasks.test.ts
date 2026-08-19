import { describe, expect, it } from 'vitest'
import {
  canRewardMoreTasksToday,
  completeTask,
  countTasksRewardedToday,
  createTask,
  isTaskLabelValid,
  removeTask,
  uncompleteTask,
} from '../tasks'
import { TASK_FREE_DAILY_ITEM_LIMIT, TASK_REWARD_PER_ITEM } from '@/config/gameBalance'
import type { TaskItem } from '@/types'

const TODAY = '2026-08-05'

function makeTasks(n: number, opts: Partial<TaskItem> = {}): TaskItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    label: `任务${i}`,
    done: true,
    rewarded: true,
    rewardedDate: TODAY,
    createdAt: '2026-08-05T00:00:00.000Z',
    ...opts,
  }))
}

describe('tasks 创建与校验', () => {
  it('createTask 生成一个未完成、未发放星尘的任务', () => {
    const task = createTask('  背单词  ')
    expect(task.label).toBe('背单词')
    expect(task.done).toBe(false)
    expect(task.rewarded).toBe(false)
  })

  it('空白标签不可提交', () => {
    expect(isTaskLabelValid('   ')).toBe(false)
    expect(isTaskLabelValid('背单词')).toBe(true)
  })
})

describe('completeTask 完成与每日上限', () => {
  it('完成任务发放星尘，标记 done/rewarded/rewardedDate', () => {
    const tasks: TaskItem[] = [createTask('读书')]
    const { tasks: next, stardustEarned } = completeTask(tasks, tasks[0].id, TODAY)
    expect(stardustEarned).toBe(TASK_REWARD_PER_ITEM)
    expect(next[0].done).toBe(true)
    expect(next[0].rewarded).toBe(true)
    expect(next[0].rewardedDate).toBe(TODAY)
  })

  it('已完成的任务再次调用 completeTask 是幂等的，不重复发星尘', () => {
    const tasks: TaskItem[] = [createTask('读书')]
    const first = completeTask(tasks, tasks[0].id, TODAY)
    const second = completeTask(first.tasks, tasks[0].id, TODAY)
    expect(second.stardustEarned).toBe(0)
  })

  it('当日已达上限时，完成新任务不再发星尘但仍标记完成', () => {
    const rewardedToday = makeTasks(TASK_FREE_DAILY_ITEM_LIMIT)
    const newTask = createTask('第六项')
    const tasks = [...rewardedToday, newTask]
    const { tasks: next, stardustEarned } = completeTask(tasks, newTask.id, TODAY)
    expect(stardustEarned).toBe(0)
    const completed = next.find((t) => t.id === newTask.id)
    expect(completed?.done).toBe(true)
    expect(completed?.rewarded).toBe(false)
  })

  it('canRewardMoreTasksToday 边界判断正确', () => {
    expect(canRewardMoreTasksToday(TASK_FREE_DAILY_ITEM_LIMIT - 1)).toBe(true)
    expect(canRewardMoreTasksToday(TASK_FREE_DAILY_ITEM_LIMIT)).toBe(false)
  })

  it('isAdmin=true 时即使已达上限也能继续领（Admin 测试账号跳过每日上限）', () => {
    expect(canRewardMoreTasksToday(TASK_FREE_DAILY_ITEM_LIMIT, true)).toBe(true)
    const rewardedToday = makeTasks(TASK_FREE_DAILY_ITEM_LIMIT)
    const newTask = createTask('admin 专属第六项')
    const { stardustEarned } = completeTask(
      [...rewardedToday, newTask],
      newTask.id,
      TODAY,
      true,
    )
    expect(stardustEarned).toBe(TASK_REWARD_PER_ITEM)
  })

  it('countTasksRewardedToday 只统计当天发放过星尘的任务', () => {
    const todayTasks = makeTasks(2, { rewardedDate: TODAY })
    const yesterdayTasks = makeTasks(3, { rewardedDate: '2026-08-04' })
    expect(countTasksRewardedToday([...todayTasks, ...yesterdayTasks], TODAY)).toBe(2)
  })

  it('取消勾选不清除 rewarded，防止反复勾选刷星尘', () => {
    const tasks: TaskItem[] = [createTask('读书')]
    const { tasks: completed } = completeTask(tasks, tasks[0].id, TODAY)
    const unchecked = uncompleteTask(completed, tasks[0].id)
    expect(unchecked[0].done).toBe(false)
    expect(unchecked[0].rewarded).toBe(true)
    const { stardustEarned } = completeTask(unchecked, tasks[0].id, TODAY)
    expect(stardustEarned).toBe(0)
  })
})

describe('removeTask', () => {
  it('删除指定任务', () => {
    const tasks: TaskItem[] = [createTask('a'), createTask('b')]
    const remaining = removeTask(tasks, tasks[0].id)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].label).toBe('b')
  })
})
