/**
 * AI Coach 接口层。方案文档 §9.3：先定接口，UI / 数据裁剪 / 错误态 / 用户确认流程
 * 全部按这个接口做完，等 CJ 决定接真实 API 时只替换 Provider，界面一行都不用改。
 *
 * ⚠️ 红线（§9.4）：真实实现必须走 Supabase Edge Function，
 * 浏览器与手机 App 里**不允许**出现 OpenAI API Key。
 */

export type AiCoachFeature = 'breakdown' | 'planToday' | 'weeklyReview'

/** 发给 AI 的 Todo 快照——只有标题、截止日、完成状态，没有 id 以外的任何身份线索 */
export interface AiTodoSnapshot {
  id: string
  title: string
  dueDate: string | null
  done: boolean
}

/** Habit 快照：标题 + 近 7 天完成情况（最新的在最前） */
export interface AiHabitSnapshot {
  id: string
  title: string
  last7Days: boolean[]
}

export interface AiFocusSnapshot {
  date: string
  plannedMinutes: number
  completedMinutes: number
  linkedLabel: string | null
}

/**
 * 一次请求实际会发出去的全部内容。UI 必须能把这个对象原样展示给用户看
 * （§9.2：每次请求前清楚显示本次会发送什么）。
 */
export interface AiCoachPayload {
  feature: AiCoachFeature
  /** 用户设备本地日期，用来让 AI 理解「今天」是哪天；不含时区以外的位置信息 */
  today: string
  todos: AiTodoSnapshot[]
  habits: AiHabitSnapshot[]
  focusSessions: AiFocusSnapshot[]
  /** 只有用户显式打开授权时才会有值，默认恒为 undefined */
  reflectionExcerpts?: string[]
  /** 「帮我拆小」针对的那一条 Todo */
  targetTodoId?: string
}

/** AI 的建议永远是「候选项」，用户点确认才写入数据（§9.1 / §6.3） */
export interface AiSuggestedStep {
  title: string
  estimatedMinutes: number | null
}

export interface AiBreakdownResult {
  kind: 'breakdown'
  sourceTitle: string
  steps: AiSuggestedStep[]
}

export interface AiPlanItem {
  /** 已有 Todo/Habit 的 id；AI 新提出的内容为 null */
  refId: string | null
  refKind: 'todo' | 'habit' | 'focus'
  title: string
  reason: string
  suggestedMinutes: number | null
}

export interface AiPlanTodayResult {
  kind: 'planToday'
  items: AiPlanItem[]
}

export interface AiWeeklyReviewResult {
  kind: 'weeklyReview'
  headline: string
  observations: string[]
  suggestions: string[]
}

export type AiCoachResult = AiBreakdownResult | AiPlanTodayResult | AiWeeklyReviewResult

export type AiCoachErrorCode = 'network' | 'quota' | 'invalid' | 'unavailable'

export class AiCoachError extends Error {
  // 显式字段赋值而不是构造函数参数属性——tsconfig 开了 erasableSyntaxOnly
  readonly code: AiCoachErrorCode

  constructor(code: AiCoachErrorCode, message: string) {
    super(message)
    this.name = 'AiCoachError'
    this.code = code
  }
}

export interface AiCoachProvider {
  /** 供 UI 显示「现在用的是模拟建议还是真实 AI」 */
  readonly id: 'mock' | 'edge'
  breakdown(payload: AiCoachPayload): Promise<AiBreakdownResult>
  planToday(payload: AiCoachPayload): Promise<AiPlanTodayResult>
  weeklyReview(payload: AiCoachPayload): Promise<AiWeeklyReviewResult>
}
