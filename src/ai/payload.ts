import { getLocalDateKey } from '@/domain/reflection'
import { isHabitCompletedOn, lastNDateKeys, activeHabits } from '@/domain/habits'
import { sessionMinutes } from '@/domain/focus'
import type { AppState } from '@/types'
import type {
  AiCoachFeature,
  AiCoachPayload,
  AiFocusSnapshot,
  AiHabitSnapshot,
  AiTodoSnapshot,
} from './types'

/**
 * 数据裁剪层——方案文档 §9.2 的红线在这里落地，改这个文件前先把 §9.2 读一遍。
 *
 * 默认允许发送：Todo 标题/截止时间/完成状态、Habit 标题及近 7 天完成状态、
 *               专注计划时长/完成时长/关联项目。
 * 默认禁止发送：反思正文、邮箱/真实姓名/用户 ID、与本次建议无关的历史数据。
 *
 * 「用户 ID」指账号身份；Todo/Habit 的本地 uuid 是必须的（AI 要能指回具体那一条），
 * 它不含身份信息，也不会离开这个用户自己的存档。
 */

const FOCUS_HISTORY_DAYS = 7
const HABIT_HISTORY_DAYS = 7
/** 反思摘录即使在授权后也只发最近几条，不整本历史都倒出去 */
const REFLECTION_EXCERPT_LIMIT = 7
const REFLECTION_EXCERPT_MAX_CHARS = 300

export interface BuildPayloadOptions {
  feature: AiCoachFeature
  targetTodoId?: string
  today?: string
  /** 只有 state.aiConsent.allowReflectionText 为 true 时才可能为 true */
  includeReflectionText?: boolean
}

function buildTodos(state: AppState): AiTodoSnapshot[] {
  return state.tasks
    // 已完成的历史任务对「拆小/安排今天」没有帮助，不发送（§9.2「不属于建议所需范围的历史数据」）
    .filter((t) => !t.done)
    .map((t) => ({
      id: t.id,
      title: t.label,
      dueDate: t.dueDate ?? null,
      done: t.done,
    }))
}

function buildHabits(state: AppState, today: string): AiHabitSnapshot[] {
  const days = lastNDateKeys(HABIT_HISTORY_DAYS, today)
  return activeHabits(state.habits).map((h) => ({
    id: h.id,
    title: h.title,
    last7Days: days.map((d) => isHabitCompletedOn(state.habitCompletions, h.id, d)),
  }))
}

function buildFocus(state: AppState, today: string): AiFocusSnapshot[] {
  const days = new Set(lastNDateKeys(FOCUS_HISTORY_DAYS, today))
  return state.focusSessions
    .filter((s) => days.has(s.date))
    .map((s) => ({
      date: s.date,
      plannedMinutes: s.plannedMinutes ?? sessionMinutes(s),
      completedMinutes: sessionMinutes(s),
      linkedLabel: s.link?.label ?? null,
    }))
}

/**
 * 组装本次请求的 payload。注意这个函数**只读** state，不做任何写入，
 * 也不接受调用方直接塞进来的自由文本——所有内容都从存档里按白名单字段取。
 */
export function buildCoachPayload(
  state: AppState,
  options: BuildPayloadOptions,
): AiCoachPayload {
  const today = options.today ?? getLocalDateKey()

  const payload: AiCoachPayload = {
    feature: options.feature,
    today,
    todos: buildTodos(state),
    habits: buildHabits(state, today),
    focusSessions: buildFocus(state, today),
  }

  if (options.targetTodoId) {
    payload.targetTodoId = options.targetTodoId
  }

  // 双重闸门：调用方要求 + 存档里确实开了授权，缺一不可。
  // 少了任何一边都不发反思正文——这条是产品承诺，不是可以「顺手优化掉」的判断。
  if (options.includeReflectionText && state.aiConsent.allowReflectionText) {
    payload.reflectionExcerpts = state.reflections
      .slice(0, REFLECTION_EXCERPT_LIMIT)
      .map((entry) =>
        [entry.answers.gratitude, entry.answers.learning, entry.answers.improvement]
          .filter((s) => s.trim().length > 0)
          .join(' / ')
          .slice(0, REFLECTION_EXCERPT_MAX_CHARS),
      )
      .filter((s) => s.length > 0)
  }

  return payload
}

/** 给「本次会发送什么」的确认弹窗用的人类可读摘要 */
export function describePayload(payload: AiCoachPayload): string[] {
  const lines = [
    `Todo × ${payload.todos.length}`,
    `Habit × ${payload.habits.length}（近 7 天完成情况）`,
    `专注记录 × ${payload.focusSessions.length}`,
  ]
  if (payload.reflectionExcerpts) {
    lines.push(`反思摘录 × ${payload.reflectionExcerpts.length}`)
  }
  return lines
}
