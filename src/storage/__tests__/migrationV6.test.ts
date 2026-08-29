import { describe, expect, it } from 'vitest'
import { parsePersistedState } from '../localStorageAdapter'
import { CURRENT_SCHEMA_VERSION } from '@/types'

/**
 * v5 → v6 迁移（2026-08-29 产品进化）。
 * 验收标准 #12：旧用户升级后，原有星尘、宠物、图鉴与反思记录保持完整。
 */
const legacyV5 = {
  schemaVersion: 5,
  pet: { name: '小灵', species: 'spiritfox', intimacy: 120, level: 3 },
  stardust: { balance: 340 },
  reflections: [
    {
      date: '2026-08-20',
      answers: { gratitude: '感恩', learning: '学习', improvement: '改进' },
      stardustAwarded: 40,
      updatedAt: '2026-08-20T22:00:00.000Z',
    },
  ],
  draftReflection: null,
  hasChosenStarter: true,
  lastGrowthAt: '2026-08-20T22:00:00.000Z',
  tasks: [
    {
      id: 't-old',
      label: '旧任务',
      done: true,
      rewarded: true,
      createdAt: '2026-08-19T00:00:00.000Z',
      rewardedDate: '2026-08-19',
    },
  ],
  // 旧记录只有 date/completedAt，没有时长与实发星尘
  focusSessions: [{ date: '2026-08-20', completedAt: '2026-08-20T10:00:00.000Z' }],
  egg: null,
  ownedCreatures: { spiritfox: { nickname: '小灵' }, mossbear: { nickname: '苔苔' } },
  reflectionCount: 12,
  firstUsedAt: '2026-08-01T00:00:00.000Z',
  hasExportedSave: false,
  animalChessWins: [],
}

describe('v5 → v6 迁移', () => {
  const migrated = parsePersistedState(legacyV5)

  it('迁移成功且版本号更新', () => {
    expect(migrated).not.toBeNull()
    expect(migrated?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('星尘、宠物、图鉴、反思记录原样保留，不做任何折算', () => {
    expect(migrated?.stardust.balance).toBe(340)
    expect(migrated?.pet.species).toBe('spiritfox')
    expect(migrated?.pet.intimacy).toBe(120)
    expect(Object.keys(migrated?.ownedCreatures ?? {})).toHaveLength(2)
    expect(migrated?.reflections).toHaveLength(1)
    expect(migrated?.reflections[0].stardustAwarded).toBe(40)
    expect(migrated?.reflectionCount).toBe(12)
  })

  it('旧任务保留，新增字段不破坏它', () => {
    expect(migrated?.tasks).toHaveLength(1)
    expect(migrated?.tasks[0].rewarded).toBe(true)
  })

  it('新增的 Habit 结构默认为空', () => {
    expect(migrated?.habits).toEqual([])
    expect(migrated?.habitCompletions).toEqual([])
  })

  it('通知默认开启', () => {
    expect(migrated?.notifications.globalEnabled).toBe(true)
    expect(migrated?.notifications.habitRemindersEnabled).toBe(true)
    expect(migrated?.notifications.todoRemindersEnabled).toBe(true)
  })

  it('AI 反思授权默认关闭（隐私红线，不能因为迁移变成开）', () => {
    expect(migrated?.aiConsent.allowReflectionText).toBe(false)
  })

  it('旧专注记录保留，不回填成用户从没拿过的星尘数值', () => {
    expect(migrated?.focusSessions).toHaveLength(1)
    expect(migrated?.focusSessions[0].stardustAwarded).toBeUndefined()
    expect(migrated?.focusSessions[0].plannedMinutes).toBeUndefined()
  })
})

describe('v6 存档往返', () => {
  it('带 Habit 与新 Todo 字段的存档能通过校验', () => {
    const v6 = {
      ...legacyV5,
      schemaVersion: 6,
      habits: [
        {
          id: 'h1',
          title: '喝水',
          reminderTime: '08:00',
          active: true,
          createdAt: '2026-08-29T00:00:00.000Z',
        },
      ],
      habitCompletions: [
        {
          habitId: 'h1',
          date: '2026-08-29',
          stardustAwarded: 5,
          completedAt: '2026-08-29T08:00:00.000Z',
          revoked: false,
        },
      ],
      tasks: [
        {
          id: 't1',
          label: '写提案',
          done: false,
          rewarded: false,
          createdAt: '2026-08-29T00:00:00.000Z',
          dueDate: '2026-08-30',
          reminderTime: '09:00',
          pinned: true,
        },
      ],
      focusSessions: [
        {
          date: '2026-08-29',
          completedAt: '2026-08-29T10:00:00.000Z',
          plannedMinutes: 45,
          completedMinutes: 45,
          stardustAwarded: 9,
          link: { kind: 'todo', id: 't1', label: '写提案' },
        },
      ],
      notifications: {
        globalEnabled: false,
        habitRemindersEnabled: true,
        todoRemindersEnabled: false,
      },
      aiConsent: { allowReflectionText: true },
    }
    const parsed = parsePersistedState(v6)
    expect(parsed).not.toBeNull()
    expect(parsed?.habits[0].reminderTime).toBe('08:00')
    expect(parsed?.tasks[0].pinned).toBe(true)
    expect(parsed?.focusSessions[0].link?.label).toBe('写提案')
    expect(parsed?.notifications.globalEnabled).toBe(false)
    expect(parsed?.aiConsent.allowReflectionText).toBe(true)
  })

  it('结构不对的 Habit 会让整份存档被拒绝，而不是悄悄带进来', () => {
    const bad = {
      ...legacyV5,
      schemaVersion: 6,
      habits: [{ id: 'h1', title: '喝水' }],
      habitCompletions: [],
    }
    expect(parsePersistedState(bad)).toBeNull()
  })
})
