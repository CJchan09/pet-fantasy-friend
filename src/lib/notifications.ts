import { getLocalDateKey } from '@/domain/reflection'
import { isValidReminderTime, parseReminderTime } from '@/domain/reminders'
import type { AppState } from '@/types'

/**
 * Web/PWA 提醒调度（方案文档 §5.2）。
 *
 * 三条硬性行为：
 * 1. 用户拒绝权限后**不反复弹窗**——只在用户主动点开关时才 request 一次。
 * 2. 提醒文案中性，不用「你又没做到」这类责备语气。
 * 3. 用设备本地时区；跨时区后自动按新的当地时间重算（存的是 "HH:MM" 不是时间戳）。
 *
 * 实现方式的限制要说清楚：**这是页面开着时的前台调度**。
 * 浏览器标签关掉后不会响——真正的后台每日提醒要等 Phase 3 用 Capacitor Local Notifications
 * 在 Android 上本地调度。Web 这版的作用是把交互、设置与文案先跑通。
 */

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

export function notificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionState
}

/** 只应该由「用户点了开关」这类明确动作触发，不要在 App 启动时自动调用 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const current = notificationPermission()
  if (current !== 'default') {
    return current // 已授权或已拒绝都不再打扰
  }
  try {
    return (await Notification.requestPermission()) as NotificationPermissionState
  } catch {
    return 'denied'
  }
}

function show(title: string, body: string): void {
  if (notificationPermission() !== 'granted') {
    return
  }
  try {
    new Notification(title, { body, tag: title, icon: '/icon-192.png' })
  } catch {
    // 通知失败不影响任何主流程，静默吞掉
  }
}

interface DueReminder {
  key: string
  title: string
  body: string
}

/**
 * 算出「此刻应该响哪些提醒」。纯函数，方便测试。
 * 判定条件：提醒时间的小时分钟正好等于当前的小时分钟，且该项今天还没完成。
 * 调用方每分钟跑一次，并用 key 去重，保证同一分钟内只弹一次。
 */
export function dueRemindersAt(state: AppState, now: Date = new Date()): DueReminder[] {
  if (!state.notifications.globalEnabled) {
    return []
  }
  const today = getLocalDateKey(now)
  const hh = now.getHours()
  const mm = now.getMinutes()
  const matches = (time: string | null | undefined): boolean => {
    if (!isValidReminderTime(time)) {
      return false
    }
    const parsed = parseReminderTime(time)
    return parsed !== null && parsed.hours === hh && parsed.minutes === mm
  }

  const out: DueReminder[] = []

  if (state.notifications.habitRemindersEnabled) {
    for (const habit of state.habits) {
      if (!habit.active || !matches(habit.reminderTime)) {
        continue
      }
      const doneToday = state.habitCompletions.some(
        (c) => c.habitId === habit.id && c.date === today && !c.revoked,
      )
      if (doneToday) {
        continue // 已经做完了就别再打扰
      }
      out.push({
        key: `habit:${habit.id}:${today}`,
        title: habit.title,
        // 中性文案：邀请，不是催促
        body: `今天要和${state.pet.name}一起完成「${habit.title}」吗？`,
      })
    }
  }

  if (state.notifications.todoRemindersEnabled) {
    for (const task of state.tasks) {
      if (task.done || task.dueDate !== today || !matches(task.reminderTime)) {
        continue
      }
      out.push({
        key: `todo:${task.id}:${today}`,
        title: task.label,
        body: `「${task.label}」今天到期。`,
      })
    }
  }

  return out
}

const TICK_MS = 30_000

/**
 * 启动前台提醒调度。返回停止函数。
 * 每 30 秒检查一次（而不是 setTimeout 到确切时刻）：设备休眠、标签页被节流、
 * 用户改时间或跨时区之后，轮询能自然恢复，setTimeout 的长定时器则会漂掉。
 */
export function startReminderScheduler(getState: () => AppState): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  const fired = new Set<string>()

  const tick = () => {
    if (notificationPermission() !== 'granted') {
      return
    }
    for (const reminder of dueRemindersAt(getState())) {
      if (fired.has(reminder.key)) {
        continue
      }
      fired.add(reminder.key)
      show(reminder.title, reminder.body)
    }
    // 去重集合只需要保住「今天」，跨天后旧 key 不会再命中，顺手清掉防止无限增长
    if (fired.size > 500) {
      fired.clear()
    }
  }

  const id = window.setInterval(tick, TICK_MS)
  tick()
  return () => window.clearInterval(id)
}
