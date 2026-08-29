import type { ReminderTime } from '@/types'

/**
 * 提醒时间的纯逻辑层（调度与权限在 lib/notifications.ts）。
 * 全部按**用户设备本地时区**计算——方案文档 §5.2：跨时区后重新计算下一次提醒。
 * 这里刻意不存 UTC 时间戳：存 "HH:MM" 意味着用户飞到别的时区后，
 * 「早上 8 点提醒」依然是当地早上 8 点，而不是原时区的 8 点换算过来的怪时间。
 */

const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidReminderTime(value: unknown): value is string {
  return typeof value === 'string' && REMINDER_TIME_PATTERN.test(value)
}

export function parseReminderTime(value: string): { hours: number; minutes: number } | null {
  const match = REMINDER_TIME_PATTERN.exec(value)
  if (!match) {
    return null
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) }
}

/**
 * 下一次该响的时间点。今天这个时间还没过就是今天，已经过了就是明天同一时刻。
 * 边界：正好等于当前时刻算「已过」，推到明天——避免同一分钟内重复触发。
 */
export function nextReminderAt(time: string, now: Date = new Date()): Date | null {
  const parsed = parseReminderTime(time)
  if (!parsed) {
    return null
  }
  const next = new Date(now)
  next.setHours(parsed.hours, parsed.minutes, 0, 0)
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

/** 距离下一次提醒还有多少毫秒；时间格式非法时返回 null */
export function msUntilNextReminder(time: string, now: Date = new Date()): number | null {
  const next = nextReminderAt(time, now)
  return next ? next.getTime() - now.getTime() : null
}

/** 把 "HH:MM" 显示成用户看得懂的样子；这里保持 24 小时制，跟输入控件一致 */
export function formatReminderTime(time: ReminderTime): string {
  return isValidReminderTime(time) ? time : ''
}

/** 常用提醒时间快捷选项 */
export const REMINDER_PRESETS = ['07:00', '08:00', '12:00', '18:00', '20:00', '21:00'] as const
