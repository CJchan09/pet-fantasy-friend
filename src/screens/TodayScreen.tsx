import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StardustBadge } from '@/components/stardust/StardustBadge'
import { PetSprite } from '@/components/pet/PetSprite'
import { HabitRow } from '@/components/habits/HabitRow'
import { HabitEditor } from '@/components/habits/HabitEditor'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskEditor } from '@/components/tasks/TaskEditor'
import { AiCoachPanel } from '@/components/ai/AiCoachPanel'
import { useAiCoach } from '@/components/ai/useAiCoach'
import { useHabitStore } from '@/store/useHabitStore'
import { useTaskStore } from '@/store/useTaskStore'
import { usePetStore } from '@/store/usePetStore'
import { useStardustStore } from '@/store/useStardustStore'
import { useFocusStore } from '@/store/useFocusStore'
import { petStageForLevel } from '@/domain/pet'
import type { AiPlanTodayResult } from '@/ai'
import type { FocusLink } from '@/types'

interface TodayScreenProps {
  onOpenSettings: () => void
  onOpenTasks: () => void
  onOpenHabits: () => void
  /** 带着时长与可选关联对象跳到专注页 */
  onStartFocus: (minutes: number, link: FocusLink | null) => void
}

const QUICK_FOCUS_OPTIONS = [15, 25, 45]

/**
 * Today —— 新版首页（方案文档 §10.3）。
 * 排序即优先级：今天要做的事在最上面，宠物只是一条窄条回应，不再占半屏。
 * 宠物的完整场景搬到 Companion Tab。
 */
export function TodayScreen({
  onOpenSettings,
  onOpenTasks,
  onOpenHabits,
  onStartFocus,
}: TodayScreenProps) {
  const { t } = useTranslation()
  const { pet } = usePetStore()
  const { balance } = useStardustStore()
  const habitStore = useHabitStore()
  const taskStore = useTaskStore()
  const focusStore = useFocusStore()

  const [addingHabit, setAddingHabit] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const coach = useAiCoach('planToday')

  const todayTasks = taskStore.today
  const doneHabits = habitStore.completedTodayCount
  const totalHabits = habitStore.todayList.length
  const actionsToday = doneHabits + focusStore.sessionsToday + taskStore.rewardedTodayCount

  const planResult =
    coach.result?.kind === 'planToday' ? (coach.result as AiPlanTodayResult) : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-medium text-ink-900">{t('today.title')}</h1>
          <p className="truncate text-xs text-ink-400">
            {t('today.summary', { count: actionsToday })}
          </p>
        </div>
        <StardustBadge balance={balance} />
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t('home.settingsLink')}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-chip text-sm text-ink-600"
        >
          ⚙
        </button>
      </header>

      {/* 宠物窄条回应：核心是「你做的事被看见了」，不是让宠物抢走视觉焦点 */}
      <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
        <PetSprite
          species={pet.species}
          stage={petStageForLevel(pet.level)}
          joy={actionsToday > 0}
          lifecycleStatus="active"
          alt={pet.name}
          className="h-12 w-12 flex-shrink-0"
        />
        <p className="min-w-0 flex-1 text-sm text-ink-600">
          {actionsToday > 0
            ? t('today.petResponseActive', { name: pet.name, count: actionsToday })
            : t('today.petResponseIdle', { name: pet.name })}
        </p>
      </div>

      {/* 每日 Habit */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-ink-700">{t('today.habitsTitle')}</h2>
          <button
            type="button"
            onClick={onOpenHabits}
            className="text-xs text-ink-400 underline-offset-2 hover:underline"
          >
            {t('today.manageLink')}
          </button>
        </div>
        <p className="text-[11px] text-ink-400">
          {totalHabits > 0
            ? t('today.habitsProgress', {
                done: doneHabits,
                total: totalHabits,
                reward: habitStore.nextReward,
              })
            : t('today.habitsEmpty')}
        </p>
        <ul className="flex flex-col gap-2">
          {habitStore.todayList.map(({ habit, done, weeklyCount }) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              done={done}
              weeklyCount={weeklyCount}
              onToggle={() => habitStore.toggleHabit(habit.id)}
            />
          ))}
        </ul>
        {addingHabit ? (
          <HabitEditor
            onSubmit={(title, reminderTime) => {
              habitStore.addHabit(title, reminderTime)
              setAddingHabit(false)
            }}
            onCancel={() => setAddingHabit(false)}
          />
        ) : (
          habitStore.canAdd && (
            <button
              type="button"
              onClick={() => setAddingHabit(true)}
              className="rounded-2xl border border-dashed border-line py-2.5 text-sm text-ink-500"
            >
              + {t('today.addHabitButton')}
            </button>
          )
        )}
      </section>

      {/* 今日 Todo */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-ink-700">{t('today.todosTitle')}</h2>
          <button
            type="button"
            onClick={onOpenTasks}
            className="text-xs text-ink-400 underline-offset-2 hover:underline"
          >
            {t('today.allTodosLink')}
          </button>
        </div>
        <p className="text-[11px] text-ink-400">
          {taskStore.canRewardMore
            ? t('today.todosReward', {
                reward: taskStore.rewardPerItem,
                count: taskStore.rewardedTodayCount,
                limit: taskStore.dailyRewardLimit,
              })
            : t('tasks.dailyLimitReachedHint')}
        </p>
        <ul className="flex flex-col gap-2">
          {todayTasks.length === 0 && (
            <li className="rounded-2xl bg-card/60 py-5 text-center text-xs text-ink-400">
              {t('today.todosEmpty')}
            </li>
          )}
          {todayTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => taskStore.toggleTask(task.id)}
              onFocus={() => onStartFocus(25, { kind: 'todo', id: task.id, label: task.label })}
            />
          ))}
        </ul>
        {addingTask ? (
          <TaskEditor
            onSubmit={(label, dueDate, reminderTime) => {
              taskStore.addTask(label, { dueDate, reminderTime })
              setAddingTask(false)
            }}
            onCancel={() => setAddingTask(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingTask(true)}
            className="rounded-2xl border border-dashed border-line py-2.5 text-sm text-ink-500"
          >
            + {t('today.addTodoButton')}
          </button>
        )}
      </section>

      {/* 快速专注 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-ink-700">{t('today.focusTitle')}</h2>
        <div className="flex gap-2">
          {QUICK_FOCUS_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => onStartFocus(minutes, null)}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-card px-3 py-3 shadow-soft"
            >
              <span className="text-sm font-medium text-ink-700">
                {t('focus.minutesLabel', { minutes })}
              </span>
              <span className="text-[10px] text-ink-400">
                +{focusStore.previewReward(minutes)} ⭐
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* AI：安排今天 */}
      <section className="flex flex-col gap-2">
        {coach.status === 'idle' ? (
          <button
            type="button"
            onClick={() => coach.prepare()}
            className="rounded-2xl bg-card px-4 py-3 text-left text-sm text-ink-700 shadow-soft"
          >
            ✨ {t('ai.planTodayButton')}
          </button>
        ) : (
          <AiCoachPanel
            title={t('ai.planTodayButton')}
            status={coach.status}
            payloadSummary={coach.payloadSummary}
            errorCode={coach.errorCode}
            providerId={coach.providerId}
            onConfirm={coach.run}
            onRetry={coach.run}
            onClose={coach.reset}
          >
            {planResult && (
              <div className="flex flex-col gap-2">
                <ol className="flex flex-col gap-2">
                  {planResult.items.map((item, index) => (
                    <li
                      key={`${item.refKind}-${item.refId ?? index}`}
                      className="rounded-xl bg-cream-100 px-3 py-2"
                    >
                      <p className="text-sm text-ink-800">
                        {index + 1}. {item.title}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {item.reason}
                        {item.suggestedMinutes
                          ? ` · ${t('focus.minutesLabel', { minutes: item.suggestedMinutes })}`
                          : ''}
                      </p>
                    </li>
                  ))}
                </ol>
                {/* 排序建议本身不改任何数据，所以这里只有「知道了」，没有写入按钮 */}
                <p className="text-[11px] text-ink-400">{t('ai.planTodayNoWriteHint')}</p>
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
    </div>
  )
}
