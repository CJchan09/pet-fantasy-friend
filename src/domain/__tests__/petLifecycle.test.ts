import { describe, expect, it } from 'vitest'
import { getLifecycleStatus } from '../petLifecycle'
import { PET_DORMANT_AFTER_DAYS, PET_TIRED_AFTER_DAYS } from '@/config/gameBalance'

const NOW = new Date('2026-08-10T12:00:00.000Z')

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('getLifecycleStatus', () => {
  it('从没有过成长行为（新玩家）时是活跃', () => {
    expect(getLifecycleStatus(null, NOW)).toBe('active')
  })

  it('刚完成过成长行为是活跃', () => {
    expect(getLifecycleStatus(daysAgo(0), NOW)).toBe('active')
  })

  it('未满 2 天仍是活跃', () => {
    expect(getLifecycleStatus(daysAgo(PET_TIRED_AFTER_DAYS - 0.1), NOW)).toBe('active')
  })

  it('满 2 天进入疲倦', () => {
    expect(getLifecycleStatus(daysAgo(PET_TIRED_AFTER_DAYS), NOW)).toBe('tired')
  })

  it('未满 5 天仍是疲倦', () => {
    expect(getLifecycleStatus(daysAgo(PET_DORMANT_AFTER_DAYS - 0.1), NOW)).toBe('tired')
  })

  it('满 5 天进入沉睡', () => {
    expect(getLifecycleStatus(daysAgo(PET_DORMANT_AFTER_DAYS), NOW)).toBe('dormant')
  })

  it('沉睡 90 天后依然是沉睡（不会消失）', () => {
    expect(getLifecycleStatus(daysAgo(90), NOW)).toBe('dormant')
  })

  it('系统时间被回拨（lastGrowthAt 晚于 now）时钳位为 0 天，保持活跃，不惩罚', () => {
    const future = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
    expect(getLifecycleStatus(future, NOW)).toBe('active')
  })
})
