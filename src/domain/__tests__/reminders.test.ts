import { describe, expect, it } from 'vitest'
import { isValidReminderTime, msUntilNextReminder, nextReminderAt, parseReminderTime } from '../reminders'

describe('reminders 时间格式', () => {
  it.each(['00:00', '07:30', '23:59'])('%s 合法', (value) => {
    expect(isValidReminderTime(value)).toBe(true)
  })

  it.each(['24:00', '7:30', '07:60', '', 'abc', null, undefined, 800])(
    '%s 不合法',
    (value) => {
      expect(isValidReminderTime(value)).toBe(false)
    },
  )

  it('parseReminderTime 拆出小时分钟', () => {
    expect(parseReminderTime('08:05')).toEqual({ hours: 8, minutes: 5 })
    expect(parseReminderTime('bad')).toBeNull()
  })
})

describe('reminders 下一次触发时间', () => {
  it('今天还没到就是今天', () => {
    const now = new Date(2026, 7, 29, 7, 0, 0)
    const next = nextReminderAt('20:00', now)
    expect(next?.getDate()).toBe(29)
    expect(next?.getHours()).toBe(20)
  })

  it('今天已经过了就推到明天', () => {
    const now = new Date(2026, 7, 29, 21, 0, 0)
    expect(nextReminderAt('20:00', now)?.getDate()).toBe(30)
  })

  it('正好等于当前时刻算已过，推到明天（防同一分钟重复触发）', () => {
    const now = new Date(2026, 7, 29, 20, 0, 0)
    expect(nextReminderAt('20:00', now)?.getDate()).toBe(30)
  })

  it('跨月边界正确进位', () => {
    const now = new Date(2026, 7, 31, 22, 0, 0)
    const next = nextReminderAt('08:00', now)
    expect(next?.getMonth()).toBe(8)
    expect(next?.getDate()).toBe(1)
  })

  it('非法时间返回 null', () => {
    expect(nextReminderAt('99:99')).toBeNull()
    expect(msUntilNextReminder('99:99')).toBeNull()
  })

  it('msUntilNextReminder 是正数', () => {
    const now = new Date(2026, 7, 29, 7, 0, 0)
    expect(msUntilNextReminder('07:30', now)).toBe(30 * 60 * 1000)
  })
})
