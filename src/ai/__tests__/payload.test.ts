import { describe, expect, it } from 'vitest'
import { buildCoachPayload, describePayload } from '../payload'
import { MockAiCoachProvider } from '../mockProvider'
import { AiCoachError } from '../types'
import { createDefaultState } from '@/storage/localStorageAdapter'
import type { AppState } from '@/types'

const TODAY = '2026-08-29'

function stateWith(patch: Partial<AppState>): AppState {
  return { ...createDefaultState(), ...patch }
}

const sampleState = stateWith({
  tasks: [
    {
      id: 't1',
      label: '写提案',
      done: false,
      rewarded: false,
      createdAt: '2026-08-28T00:00:00.000Z',
      dueDate: TODAY,
      reminderTime: '09:00',
    },
    {
      id: 't2',
      label: '已经做完的事',
      done: true,
      rewarded: true,
      createdAt: '2026-08-27T00:00:00.000Z',
      completedAt: '2026-08-28T00:00:00.000Z',
    },
  ],
  habits: [
    { id: 'h1', title: '喝水', reminderTime: '08:00', active: true, createdAt: '' },
    { id: 'h2', title: '停用的习惯', reminderTime: null, active: false, createdAt: '' },
  ],
  habitCompletions: [
    { habitId: 'h1', date: TODAY, stardustAwarded: 5, completedAt: `${TODAY}T08:00:00.000Z` },
  ],
  focusSessions: [
    {
      date: TODAY,
      completedAt: `${TODAY}T10:00:00.000Z`,
      plannedMinutes: 25,
      completedMinutes: 25,
      stardustAwarded: 5,
      link: { kind: 'todo', id: 't1', label: '写提案' },
    },
    // 超出 7 天窗口，不该被发送
    { date: '2026-01-01', completedAt: '2026-01-01T10:00:00.000Z', plannedMinutes: 25 },
  ],
  reflections: [
    {
      date: TODAY,
      answers: { gratitude: '很私密的内容', learning: '学到东西', improvement: '要改进' },
      stardustAwarded: 15,
      updatedAt: `${TODAY}T22:00:00.000Z`,
    },
  ],
})

describe('AI payload 数据裁剪红线', () => {
  it('默认不发送反思正文', () => {
    const payload = buildCoachPayload(sampleState, { feature: 'planToday', today: TODAY })
    expect(payload.reflectionExcerpts).toBeUndefined()
    expect(JSON.stringify(payload)).not.toContain('很私密的内容')
  })

  it('即使调用方要求，只要用户没授权也不发送反思正文', () => {
    const payload = buildCoachPayload(sampleState, {
      feature: 'planToday',
      today: TODAY,
      includeReflectionText: true,
    })
    expect(payload.reflectionExcerpts).toBeUndefined()
  })

  it('用户授权 + 调用方要求，两者同时满足才发送', () => {
    const consented = stateWith({
      ...sampleState,
      aiConsent: { allowReflectionText: true },
    })
    const payload = buildCoachPayload(consented, {
      feature: 'planToday',
      today: TODAY,
      includeReflectionText: true,
    })
    expect(payload.reflectionExcerpts).toHaveLength(1)
  })

  it('授权了但调用方没要求，依然不发送', () => {
    const consented = stateWith({
      ...sampleState,
      aiConsent: { allowReflectionText: true },
    })
    const payload = buildCoachPayload(consented, { feature: 'planToday', today: TODAY })
    expect(payload.reflectionExcerpts).toBeUndefined()
  })

  it('不包含任何身份资料字段', () => {
    const serialized = JSON.stringify(
      buildCoachPayload(sampleState, { feature: 'planToday', today: TODAY }),
    )
    for (const forbidden of ['email', 'userId', 'user_id', 'nickname', 'firstUsedAt']) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})

describe('AI payload 范围裁剪', () => {
  const payload = buildCoachPayload(sampleState, { feature: 'planToday', today: TODAY })

  it('已完成的 Todo 不发送（跟建议无关的历史数据）', () => {
    expect(payload.todos.map((t) => t.id)).toEqual(['t1'])
  })

  it('停用的 Habit 不发送', () => {
    expect(payload.habits.map((h) => h.id)).toEqual(['h1'])
  })

  it('Habit 带近 7 天完成情况，最新的在最前', () => {
    expect(payload.habits[0].last7Days).toHaveLength(7)
    expect(payload.habits[0].last7Days[0]).toBe(true)
    expect(payload.habits[0].last7Days[1]).toBe(false)
  })

  it('专注只发近 7 天', () => {
    expect(payload.focusSessions).toHaveLength(1)
    expect(payload.focusSessions[0].linkedLabel).toBe('写提案')
  })

  it('describePayload 给出可展示的摘要', () => {
    expect(describePayload(payload)).toHaveLength(3)
  })
})

describe('MockAiCoachProvider', () => {
  const provider = new MockAiCoachProvider({ latencyMs: 0 })

  it('拆小：同样输入给同样输出（确定性，可写进测试）', async () => {
    const payload = buildCoachPayload(sampleState, {
      feature: 'breakdown',
      today: TODAY,
      targetTodoId: 't1',
    })
    const first = await provider.breakdown(payload)
    const second = await provider.breakdown(payload)
    expect(first).toEqual(second)
    expect(first.steps.length).toBeGreaterThanOrEqual(3)
    expect(first.steps.length).toBeLessThanOrEqual(5)
  })

  it('拆小：目标 Todo 不存在时抛 invalid', async () => {
    const payload = buildCoachPayload(sampleState, {
      feature: 'breakdown',
      today: TODAY,
      targetTodoId: 'nope',
    })
    await expect(provider.breakdown(payload)).rejects.toBeInstanceOf(AiCoachError)
  })

  it('安排今天：今天到期的 Todo 排在最前', async () => {
    const payload = buildCoachPayload(sampleState, { feature: 'planToday', today: TODAY })
    const result = await provider.planToday(payload)
    expect(result.items[0].refId).toBe('t1')
  })

  it('安排今天：没有任何待办时给出兜底建议，不返回空列表', async () => {
    const empty = buildCoachPayload(createDefaultState(), {
      feature: 'planToday',
      today: TODAY,
    })
    const result = await provider.planToday(empty)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].refKind).toBe('focus')
  })

  it('每周回顾：给出观察与建议', async () => {
    const payload = buildCoachPayload(sampleState, { feature: 'weeklyReview', today: TODAY })
    const result = await provider.weeklyReview(payload)
    expect(result.observations.length).toBeGreaterThan(0)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('failWith 可以稳定复现错误态，供 UI 验收', async () => {
    const failing = new MockAiCoachProvider({
      latencyMs: 0,
      failWith: new AiCoachError('quota', 'quota exceeded'),
    })
    const payload = buildCoachPayload(sampleState, { feature: 'planToday', today: TODAY })
    await expect(failing.planToday(payload)).rejects.toMatchObject({ code: 'quota' })
  })
})
