import { AiCoachError } from './types'
import type {
  AiBreakdownResult,
  AiCoachPayload,
  AiCoachProvider,
  AiPlanItem,
  AiPlanTodayResult,
  AiSuggestedStep,
  AiWeeklyReviewResult,
} from './types'

/**
 * Web 测试期用的模拟 Provider（方案文档 §9.3）。
 * 设计要求：**固定、可重复**——同样的输入永远给同样的输出，
 * 这样 UI 的加载态、空态、错误态、用户确认流程都能稳定验收，也能写进测试。
 * 所以这里不用 Math.random()，一切分支都由 payload 内容决定。
 */

const DEFAULT_LATENCY_MS = 450

export interface MockProviderOptions {
  latencyMs?: number
  /** 测试用：强制这次请求失败，验收错误态 UI */
  failWith?: AiCoachError
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 用标题长度决定拆成几步——确定性，不随机 */
function stepCountFor(title: string): number {
  return 3 + (title.trim().length % 3)
}

function buildSteps(title: string): AiSuggestedStep[] {
  const clean = title.trim()
  const templates = [
    { suffix: '：先花 10 分钟把要做的东西列清楚', minutes: 10 },
    { suffix: '：准备需要的资料 / 工具', minutes: 15 },
    { suffix: '：做第一版，先不求完美', minutes: 25 },
    { suffix: '：检查一遍，补掉明显的缺口', minutes: 15 },
    { suffix: '：收尾并确认已经可以交出去', minutes: 10 },
  ]
  return templates.slice(0, stepCountFor(clean)).map((tpl) => ({
    title: `${clean}${tpl.suffix}`,
    estimatedMinutes: tpl.minutes,
  }))
}

export class MockAiCoachProvider implements AiCoachProvider {
  readonly id = 'mock' as const

  private readonly options: MockProviderOptions

  constructor(options: MockProviderOptions = {}) {
    this.options = options
  }

  private async simulate(): Promise<void> {
    await delay(this.options.latencyMs ?? DEFAULT_LATENCY_MS)
    if (this.options.failWith) {
      throw this.options.failWith
    }
  }

  async breakdown(payload: AiCoachPayload): Promise<AiBreakdownResult> {
    await this.simulate()
    const target = payload.todos.find((t) => t.id === payload.targetTodoId)
    if (!target) {
      throw new AiCoachError('invalid', '找不到要拆分的 Todo')
    }
    return {
      kind: 'breakdown',
      sourceTitle: target.title,
      steps: buildSteps(target.title),
    }
  }

  async planToday(payload: AiCoachPayload): Promise<AiPlanTodayResult> {
    await this.simulate()

    const items: AiPlanItem[] = []

    // 1. 今天到期或已过期的 Todo 排最前
    const dated = payload.todos
      .filter((t) => t.dueDate !== null && t.dueDate <= payload.today)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    for (const todo of dated) {
      items.push({
        refId: todo.id,
        refKind: 'todo',
        title: todo.title,
        reason: todo.dueDate === payload.today ? '今天到期' : '已经过期，先处理掉',
        suggestedMinutes: 25,
      })
    }

    // 2. 今天还没完成的 Habit
    const pendingHabits = payload.habits.filter((h) => !h.last7Days[0])
    for (const habit of pendingHabits) {
      const doneCount = habit.last7Days.filter(Boolean).length
      items.push({
        refId: habit.id,
        refKind: 'habit',
        title: habit.title,
        reason: `本周已完成 ${doneCount} 次，今天还没做`,
        suggestedMinutes: null,
      })
    }

    // 3. 剩下没有截止日的 Todo，最多补 3 条，避免一次性堆一整页
    const undated = payload.todos.filter((t) => t.dueDate === null).slice(0, 3)
    for (const todo of undated) {
      items.push({
        refId: todo.id,
        refKind: 'todo',
        title: todo.title,
        reason: '没有截止日，有空档就推进一点',
        suggestedMinutes: 25,
      })
    }

    if (items.length === 0) {
      items.push({
        refId: null,
        refKind: 'focus',
        title: '安排一段 25 分钟专注',
        reason: '今天没有待办，用一段专注给伙伴攒点星尘',
        suggestedMinutes: 25,
      })
    }

    return { kind: 'planToday', items }
  }

  async weeklyReview(payload: AiCoachPayload): Promise<AiWeeklyReviewResult> {
    await this.simulate()

    const focusMinutes = payload.focusSessions.reduce((sum, s) => sum + s.completedMinutes, 0)
    const focusDays = new Set(payload.focusSessions.map((s) => s.date)).size
    const habitDone = payload.habits.reduce(
      (sum, h) => sum + h.last7Days.filter(Boolean).length,
      0,
    )
    const habitSlots = payload.habits.length * 7
    const rate = habitSlots > 0 ? Math.round((habitDone / habitSlots) * 100) : 0

    const observations = [
      `这一周专注了 ${focusMinutes} 分钟，分布在 ${focusDays} 天。`,
      habitSlots > 0
        ? `Habit 完成率 ${rate}%（${habitDone} / ${habitSlots}）。`
        : '这一周还没有建立每日 Habit。',
      `还有 ${payload.todos.length} 项 Todo 没有完成。`,
    ]

    const suggestions: string[] = []
    if (focusDays < 3) {
      suggestions.push('下周试着把专注固定在每天同一个时段，先求天数，不求单次时长。')
    } else if (focusMinutes < 150) {
      suggestions.push('专注天数已经稳定，下周可以把单次时长从 25 分钟提到 30–45 分钟。')
    } else {
      suggestions.push('这一周的专注量已经不低了，下周保持就好，别急着加码。')
    }
    if (habitSlots === 0) {
      suggestions.push('先建 1–2 个每日 Habit 就够，太多反而会全部放弃。')
    } else if (rate < 50) {
      suggestions.push('Habit 完成率偏低，考虑把其中一个改成更容易达成的版本。')
    }
    if (payload.todos.length > 8) {
      suggestions.push('未完成的 Todo 有点多，挑 3 件下周一定要做完的，其余先放着。')
    }

    return {
      kind: 'weeklyReview',
      headline:
        focusDays >= 4 ? '这一周很稳' : focusDays >= 2 ? '这一周有在动' : '这一周节奏偏慢',
      observations,
      suggestions,
    }
  }
}
