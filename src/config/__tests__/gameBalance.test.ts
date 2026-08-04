import { describe, expect, it } from 'vitest'
import {
  PRIMARY_SOURCES_DAILY_CAP,
  SECONDARY_SOURCES_DAILY_CAP,
} from '../gameBalance'

describe('gameBalance 平衡红线', () => {
  it('专注+挂机日产出上限必须严格小于反思+任务日产出上限', () => {
    expect(SECONDARY_SOURCES_DAILY_CAP).toBeLessThan(PRIMARY_SOURCES_DAILY_CAP)
  })

  it('当前数值符合 PRD 3.3.1 (80 < 90)', () => {
    expect(SECONDARY_SOURCES_DAILY_CAP).toBe(80)
    expect(PRIMARY_SOURCES_DAILY_CAP).toBe(90)
  })
})
