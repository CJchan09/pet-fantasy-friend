import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskEditor } from '@/components/tasks/TaskEditor'
import { AiCoachPanel } from '@/components/ai/AiCoachPanel'
import { useAiCoach } from '@/components/ai/useAiCoach'
import { useTaskStore } from '@/store/useTaskStore'
import type { AiBreakdownResult } from '@/ai'
import type { FocusLink } from '@/types'

interface TasksScreenProps {
  onBack: () => void
  onStartFocus: (minutes: number, link: FocusLink | null) => void
}

const HISTORY_LIMIT = 30

/**
 * Todo 全量管理页：今天 / 之后 / 已完成三段。
 * 已完成项进历史区，不再永久堆在今日清单里（方案文档 §6.1）。
 *
 * 「帮我拆小」在这里：AI 给出 3–5 个步骤，**用户点确认后**才写成新的 Todo，
 * AI 自己不碰任何数据（§6.3 / §9.1）。
 */
export function TasksScreen({ onBack, onStartFocus }: TasksScreenProps) {
  const { t } = useTranslation()
  const store = useTaskStore()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const coach = useAiCoach('breakdown')

  const breakdown =
    coach.result?.kind === 'breakdown' ? (coach.result as AiBreakdownResult) : null

  function acceptBreakdown() {
    if (!breakdown) {
      return
    }
    // 用户确认后才写入——每一步变成一条独立的 Todo，原任务保留不动
    for (const step of breakdown.steps) {
      store.addTask(step.title)
    }
    coach.reset()
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-6 pt-4">
      <ScreenHeader
        title={t('tasks.title')}
        subtitle={
          store.canRewardMore
            ? t('tasks.rewardHint', {
                reward: store.rewardPerItem,
                count: store.rewardedTodayCount,
                limit: store.dailyRewardLimit,
              })
            : t('tasks.dailyLimitReachedHint')
        }
        onBack={onBack}
        backLabel={t('common.back')}
      />

      {coach.status !== 'idle' && (
        <AiCoachPanel
          title={t('ai.breakdownButton')}
          status={coach.status}
          payloadSummary={coach.payloadSummary}
          errorCode={coach.errorCode}
          providerId={coach.providerId}
          onConfirm={coach.run}
          onRetry={coach.run}
          onClose={coach.reset}
        >
          {breakdown && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-ink-500">
                {t('ai.breakdownSource', { title: breakdown.sourceTitle })}
              </p>
              <ol className="flex flex-col gap-1.5">
                {breakdown.steps.map((step, index) => (
                  <li key={step.title} className="rounded-xl bg-cream-100 px-3 py-2">
                    <p className="text-sm text-ink-800">
                      {index + 1}. {step.title}
                    </p>
                    {step.estimatedMinutes && (
                      <p className="text-[11px] text-ink-400">
                        {t('focus.minutesLabel', { minutes: step.estimatedMinutes })}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={acceptBreakdown}
                  className="flex-1 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-medium text-[#FFFDF6]"
                >
                  {t('ai.acceptStepsButton', { count: breakdown.steps.length })}
                </button>
                <button
                  type="button"
                  onClick={coach.reset}
                  className="rounded-xl bg-chip px-4 py-2.5 text-sm text-ink-600"
                >
                  {t('ai.discardButton')}
                </button>
              </div>
            </div>
          )}
        </AiCoachPanel>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-700">{t('tasks.sectionToday')}</h2>
        <ul className="flex flex-col gap-2">
          {store.today.length === 0 && (
            <li className="rounded-2xl bg-card/60 py-5 text-center text-xs text-ink-400">
              {t('tasks.emptyHint')}
            </li>
          )}
          {store.today.map((task) =>
            editingId === task.id ? (
              <li key={task.id}>
                <TaskEditor
                  task={task}
                  onSubmit={(label, dueDate, reminderTime) => {
                    store.updateTask(task.id, { label, dueDate, reminderTime })
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => store.toggleTask(task.id)}
                onEdit={() => setEditingId(task.id)}
                onDelete={() => store.removeTask(task.id)}
                onFocus={() =>
                  onStartFocus(25, { kind: 'todo', id: task.id, label: task.label })
                }
              />
            ),
          )}
        </ul>
        {store.today.length > 0 && (
          <button
            type="button"
            onClick={() => coach.prepare(store.today[0].id)}
            className="rounded-2xl bg-card px-4 py-2.5 text-left text-xs text-ink-600 shadow-soft"
          >
            ✨ {t('ai.breakdownFirstButton', { title: store.today[0].label })}
          </button>
        )}
      </section>

      {store.upcoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-ink-700">{t('tasks.sectionUpcoming')}</h2>
          <ul className="flex flex-col gap-2">
            {store.upcoming.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => store.toggleTask(task.id)}
                onEdit={() => setEditingId(task.id)}
                onDelete={() => store.removeTask(task.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {adding ? (
        <TaskEditor
          onSubmit={(label, dueDate, reminderTime) => {
            store.addTask(label, { dueDate, reminderTime })
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-2xl border border-dashed border-line py-2.5 text-sm text-ink-500"
        >
          + {t('today.addTodoButton')}
        </button>
      )}

      {store.completed.length > 0 && (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center justify-between rounded-2xl bg-card/80 px-4 py-2.5 text-sm text-ink-600 shadow-soft"
          >
            <span>{t('tasks.sectionCompleted', { count: store.completed.length })}</span>
            <span className="text-ink-400">{showHistory ? '−' : '+'}</span>
          </button>
          {showHistory && (
            <ul className="flex flex-col gap-2">
              {store.completed.slice(0, HISTORY_LIMIT).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => store.toggleTask(task.id)}
                  onDelete={() => store.removeTask(task.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
