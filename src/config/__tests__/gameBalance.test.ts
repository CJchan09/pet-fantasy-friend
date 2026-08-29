import { describe, expect, it } from 'vitest'
import {
  ANIMAL_CHESS_DAILY_WIN_LIMIT,
  ANIMAL_CHESS_WIN_REWARD,
  CORE_SOURCES_DAILY_CAP,
  FOCUS_DAILY_CAP,
  HABIT_DAILY_CAP,
  MAX_SINGLE_SOURCE_SHARE,
  OPTIONAL_SOURCES_DAILY_CAP,
  REFLECTION_DAILY_CAP,
  TASK_DAILY_CAP,
  TOTAL_DAILY_CAP,
} from '../gameBalance'

/**
 * 这三条红线对应 config/gameBalance.ts 的注释。
 * 改任何数值前先看这个文件失败了没有——它是经济不被玩坏的最后一道防线。
 */
describe('gameBalance 平衡红线', () => {
  it('红线 1：核心产出（Habit+Todo+Focus）必须严格大于可选产出（反思）', () => {
    expect(OPTIONAL_SOURCES_DAILY_CAP).toBeLessThan(CORE_SOURCES_DAILY_CAP)
  })

  it('红线 2：Todo 日上限必须严格小于 Focus 日上限（防止拆碎 Todo 刷分挤掉专注）', () => {
    expect(TASK_DAILY_CAP).toBeLessThan(FOCUS_DAILY_CAP)
  })

  it('红线 3：任何单一来源都不能超过总天花板的 40%', () => {
    for (const cap of [FOCUS_DAILY_CAP, HABIT_DAILY_CAP, TASK_DAILY_CAP, REFLECTION_DAILY_CAP]) {
      expect(cap / TOTAL_DAILY_CAP).toBeLessThanOrEqual(MAX_SINGLE_SOURCE_SHARE)
    }
  })

  it('小游戏奖励必须远低于任何真实成长行为的日上限（它不是成长行为）', () => {
    const chessDailyCap = ANIMAL_CHESS_WIN_REWARD * ANIMAL_CHESS_DAILY_WIN_LIMIT
    expect(chessDailyCap).toBeLessThan(REFLECTION_DAILY_CAP)
    expect(chessDailyCap / TOTAL_DAILY_CAP).toBeLessThan(0.1)
  })

  it('方案A 数值：36 + 25 + 20 + 15 = 96', () => {
    expect(FOCUS_DAILY_CAP).toBe(36)
    expect(HABIT_DAILY_CAP).toBe(25)
    expect(TASK_DAILY_CAP).toBe(20)
    expect(REFLECTION_DAILY_CAP).toBe(15)
    expect(TOTAL_DAILY_CAP).toBe(96)
  })
})
