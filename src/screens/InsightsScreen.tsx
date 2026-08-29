import { useTranslation } from 'react-i18next'
import { AiCoachPanel } from '@/components/ai/AiCoachPanel'
import { useAiCoach } from '@/components/ai/useAiCoach'
import { useGameStore } from '@/store/useGameStore'
import { useFocusStore } from '@/store/useFocusStore'
import { useReflectionStore } from '@/store/useReflectionStore'
import { lastNDateKeys, isHabitCompletedOn, activeHabits } from '@/domain/habits'
import { sessionMinutes } from '@/domain/focus'
import type { AiWeeklyReviewResult } from '@/ai'

interface InsightsScreenProps {
  onOpenReflection: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
}

interface StatTileProps {
  label: string
  value: string
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-2xl bg-card px-3 py-3 text-center shadow-soft">
      <span className="font-display text-xl text-ink-900 tabular-nums">{value}</span>
      <span className="text-[10px] text-ink-400">{label}</span>
    </div>
  )
}

/**
 * Insights Tab —— 本周成长报告 + AI 每周建议 + 反思入口 + 设置入口。
 * 统计口径全部取近 7 天（含今天），跟 Habit「本周完成次数」保持同一套算法。
 */
export function InsightsScreen({
  onOpenReflection,
  onOpenHistory,
  onOpenSettings,
}: InsightsScreenProps) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const { focusSessions } = useFocusStore()
  const { hasSubmittedToday } = useReflectionStore()
  const coach = useAiCoach('weeklyReview')

  const weekDays = lastNDateKeys(7)
  const weekDaySet = new Set(weekDays)

  const focusThisWeek = focusSessions.filter((s) => weekDaySet.has(s.date))
  const focusMinutes = focusThisWeek.reduce((sum, s) => sum + sessionMinutes(s), 0)

  const habits = activeHabits(state.habits)
  const habitSlots = habits.length * weekDays.length
  const habitDone = habits.reduce(
    (sum, habit) =>
      sum + weekDays.filter((d) => isHabitCompletedOn(state.habitCompletions, habit.id, d)).length,
    0,
  )
  const habitRate = habitSlots > 0 ? Math.round((habitDone / habitSlots) * 100) : 0

  const todosDone = state.tasks.filter(
    (task) => task.done && weekDaySet.has((task.completedAt ?? task.createdAt).slice(0, 10)),
  ).length

  /** 北极星口径（Metrics.md）：一周里至少完成一项 Habit / Todo / Focus 的天数 */
  const actionDays = weekDays.filter((day) => {
    const hasFocus = focusThisWeek.some((s) => s.date === day)
    const hasHabit = state.habitCompletions.some((c) => c.date === day && !c.revoked)
    const hasTodo = state.tasks.some(
      (task) => task.done && (task.completedAt ?? '').slice(0, 10) === day,
    )
    return hasFocus || hasHabit || hasTodo
  }).length

  const review =
    coach.result?.kind === 'weeklyReview' ? (coach.result as AiWeeklyReviewResult) : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex-1 text-[15px] font-medium text-ink-900">{t('insights.title')}</h1>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t('home.settingsLink')}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-chip text-sm text-ink-600"
        >
          ⚙
        </button>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-700">{t('insights.thisWeekTitle')}</h2>
        <div className="flex gap-2">
          <StatTile label={t('insights.actionDays')} value={`${actionDays}/7`} />
          <StatTile label={t('insights.focusMinutes')} value={`${focusMinutes}`} />
        </div>
        <div className="flex gap-2">
          <StatTile
            label={t('insights.habitRate')}
            value={habitSlots > 0 ? `${habitRate}%` : '—'}
          />
          <StatTile label={t('insights.todosDone')} value={`${todosDone}`} />
        </div>
      </section>

      {/* AI：看看这一周 */}
      <section className="flex flex-col gap-2">
        {coach.status === 'idle' ? (
          <button
            type="button"
            onClick={() => coach.prepare()}
            className="rounded-2xl bg-card px-4 py-3 text-left text-sm text-ink-700 shadow-soft"
          >
            ✨ {t('ai.weeklyReviewButton')}
          </button>
        ) : (
          <AiCoachPanel
            title={t('ai.weeklyReviewButton')}
            status={coach.status}
            payloadSummary={coach.payloadSummary}
            errorCode={coach.errorCode}
            providerId={coach.providerId}
            onConfirm={coach.run}
            onRetry={coach.run}
            onClose={coach.reset}
          >
            {review && (
              <div className="flex flex-col gap-3">
                <p className="font-display text-lg text-ink-900">{review.headline}</p>
                <ul className="flex flex-col gap-1 text-xs text-ink-600">
                  {review.observations.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                <div className="rounded-xl bg-cream-100 p-3">
                  <p className="mb-1 text-xs font-medium text-ink-600">
                    {t('ai.weeklySuggestionsTitle')}
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-ink-600">
                    {review.suggestions.map((line) => (
                      <li key={line}>· {line}</li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={coach.reset}
                  className="rounded-xl bg-chip px-4 py-2.5 text-sm text-ink-600"
                >
                  {t('common.gotIt')}
                </button>
              </div>
            )}
          </AiCoachPanel>
        )}
      </section>

      {/* 反思：不再是核心入口，但保留晚间记录的价值（方案文档 §2.3） */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-700">{t('insights.reflectionTitle')}</h2>
        <button
          type="button"
          onClick={onOpenReflection}
          className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 text-left shadow-soft"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-ink-800">{t('home.reflectionCta')}</span>
            <span className="text-[11px] text-ink-400">
              {hasSubmittedToday
                ? t('home.reflectionHintDone')
                : t('home.reflectionHintNotDone')}
            </span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-line text-base text-ink-400">
            ›
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="py-1 text-center text-xs text-ink-500 underline-offset-2 hover:underline"
        >
          {t('home.historyLink')}
        </button>
      </section>
    </div>
  )
}
