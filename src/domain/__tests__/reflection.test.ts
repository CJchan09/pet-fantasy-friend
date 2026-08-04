import { describe, expect, it } from 'vitest'
import {
  calculateReflectionReward,
  countFilledAnswers,
  getLocalDateKey,
  isReflectionSubmittable,
} from '../reflection'
import type { ReflectionAnswers } from '@/types'

const full: ReflectionAnswers = {
  gratitude: '今天天气很好',
  learning: '学到了 useReducer',
  improvement: '明天早点睡',
}

describe('reflection 计分规则', () => {
  it('三问全填给全额 40 星尘', () => {
    expect(calculateReflectionReward(full)).toBe(40)
  })

  it('填 1 题给 12 星尘', () => {
    const partial: ReflectionAnswers = {
      gratitude: '一件小事',
      learning: '',
      improvement: '',
    }
    expect(countFilledAnswers(partial)).toBe(1)
    expect(calculateReflectionReward(partial)).toBe(12)
  })

  it('填 2 题给 24 星尘', () => {
    const partial: ReflectionAnswers = {
      gratitude: '一件小事',
      learning: '学到了一点东西',
      improvement: '',
    }
    expect(calculateReflectionReward(partial)).toBe(24)
  })

  it('全空不可提交', () => {
    const empty: ReflectionAnswers = {
      gratitude: '',
      learning: '   ',
      improvement: '',
    }
    expect(isReflectionSubmittable(empty)).toBe(false)
    expect(calculateReflectionReward(empty)).toBe(0)
  })

  it('单字符也算完成一题，不设最低字数', () => {
    const oneChar: ReflectionAnswers = {
      gratitude: 'a',
      learning: '',
      improvement: '',
    }
    expect(countFilledAnswers(oneChar)).toBe(1)
  })
})

describe('getLocalDateKey 本地日期归属', () => {
  it('使用本地时间而非 UTC 生成 YYYY-MM-DD', () => {
    const date = new Date(2026, 0, 5, 23, 59) // 2026-01-05 23:59 本地时间
    expect(getLocalDateKey(date)).toBe('2026-01-05')
  })

  it('跨零点后归属新的一天', () => {
    const beforeMidnight = new Date(2026, 0, 5, 23, 59)
    const afterMidnight = new Date(2026, 0, 6, 0, 1)
    expect(getLocalDateKey(beforeMidnight)).not.toBe(
      getLocalDateKey(afterMidnight),
    )
  })

  it('月份和日期个位数补零', () => {
    const date = new Date(2026, 2, 7) // 2026-03-07
    expect(getLocalDateKey(date)).toBe('2026-03-07')
  })
})
