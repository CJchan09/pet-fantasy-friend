import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../useGameStore'
import { useAuthStore } from '../useAuthStore'
import { HABIT_MAX_ACTIVE, HABIT_REWARD_PER_COMPLETION } from '@/config/gameBalance'
import { loadState } from '@/storage/localStorageAdapter'

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ role: undefined })
  useGameStore.getState().resetForTests()
})

describe('useGameStore Habit', () => {
  it('新增 Habit 并持久化', () => {
    expect(useGameStore.getState().addHabit('喝水', '08:00')).toBe(true)
    const habit = useGameStore.getState().state.habits[0]
    expect(habit.title).toBe('喝水')
    expect(habit.reminderTime).toBe('08:00')
    expect(habit.active).toBe(true)
    // 刷新（重新读 localStorage）后还在
    expect(loadState().habits).toHaveLength(1)
  })

  it('空标题不会建出 Habit', () => {
    expect(useGameStore.getState().addHabit('   ')).toBe(false)
    expect(useGameStore.getState().state.habits).toHaveLength(0)
  })

  it('达到进行中上限后无法再新增', () => {
    for (let i = 0; i < HABIT_MAX_ACTIVE; i += 1) {
      useGameStore.getState().addHabit(`习惯 ${i}`)
    }
    expect(useGameStore.getState().addHabit('再来一个')).toBe(false)
    expect(useGameStore.getState().state.habits).toHaveLength(HABIT_MAX_ACTIVE)
  })

  it('勾选发星尘，同一天再点不会重复发', () => {
    useGameStore.getState().addHabit('喝水')
    const id = useGameStore.getState().state.habits[0].id

    expect(useGameStore.getState().toggleHabit(id)).toBe(HABIT_REWARD_PER_COMPLETION)
    expect(useGameStore.getState().state.stardust.balance).toBe(HABIT_REWARD_PER_COMPLETION)

    // 再点一次 = 取消勾选，星尘不回收
    expect(useGameStore.getState().toggleHabit(id)).toBe(0)
    expect(useGameStore.getState().state.stardust.balance).toBe(HABIT_REWARD_PER_COMPLETION)

    // 第三次 = 重新勾上，但不再发第二次
    expect(useGameStore.getState().toggleHabit(id)).toBe(0)
    expect(useGameStore.getState().state.stardust.balance).toBe(HABIT_REWARD_PER_COMPLETION)
  })

  it('完成 Habit 算成长行为，会更新 lastGrowthAt（唤醒沉睡宠物）', () => {
    useGameStore.getState().addHabit('喝水')
    const id = useGameStore.getState().state.habits[0].id
    expect(useGameStore.getState().state.lastGrowthAt).toBeNull()
    useGameStore.getState().toggleHabit(id)
    expect(useGameStore.getState().state.lastGrowthAt).not.toBeNull()
  })

  it('停用的 Habit 保留完成记录，删除的会一并清掉', () => {
    useGameStore.getState().addHabit('喝水')
    const id = useGameStore.getState().state.habits[0].id
    useGameStore.getState().toggleHabit(id)

    useGameStore.getState().updateHabit(id, { active: false })
    expect(useGameStore.getState().state.habitCompletions).toHaveLength(1)

    useGameStore.getState().removeHabit(id)
    expect(useGameStore.getState().state.habits).toHaveLength(0)
    expect(useGameStore.getState().state.habitCompletions).toHaveLength(0)
  })
})

describe('useGameStore Todo 截止日与提醒', () => {
  it('可以带截止日和提醒新增', () => {
    useGameStore.getState().addTask('写提案', { dueDate: '2026-09-01', reminderTime: '09:00' })
    const task = useGameStore.getState().state.tasks[0]
    expect(task.dueDate).toBe('2026-09-01')
    expect(task.reminderTime).toBe('09:00')
  })

  it('没有截止日时提醒会被清掉——提醒依附于截止日', () => {
    useGameStore.getState().addTask('随便做做', { reminderTime: '09:00' })
    expect(useGameStore.getState().state.tasks[0].reminderTime).toBeNull()
  })

  it('清掉截止日会连提醒一起清掉', () => {
    useGameStore.getState().addTask('写提案', { dueDate: '2026-09-01', reminderTime: '09:00' })
    const id = useGameStore.getState().state.tasks[0].id
    useGameStore.getState().updateTask(id, { dueDate: null })
    const task = useGameStore.getState().state.tasks[0]
    expect(task.dueDate).toBeNull()
    expect(task.reminderTime).toBeNull()
  })

  it('完成时写入 completedAt，供历史区排序', () => {
    useGameStore.getState().addTask('写提案')
    const id = useGameStore.getState().state.tasks[0].id
    useGameStore.getState().toggleTask(id)
    expect(useGameStore.getState().state.tasks[0].completedAt).toBeTruthy()
  })
})

describe('useGameStore 设置', () => {
  it('通知开关可以单独关掉', () => {
    useGameStore.getState().setNotificationSettings({ habitRemindersEnabled: false })
    const { notifications } = useGameStore.getState().state
    expect(notifications.habitRemindersEnabled).toBe(false)
    expect(notifications.globalEnabled).toBe(true)
  })

  it('AI 反思授权默认关闭，可以打开也可以关回去', () => {
    expect(useGameStore.getState().state.aiConsent.allowReflectionText).toBe(false)
    useGameStore.getState().setAiConsent({ allowReflectionText: true })
    expect(useGameStore.getState().state.aiConsent.allowReflectionText).toBe(true)
    useGameStore.getState().setAiConsent({ allowReflectionText: false })
    expect(useGameStore.getState().state.aiConsent.allowReflectionText).toBe(false)
  })
})
