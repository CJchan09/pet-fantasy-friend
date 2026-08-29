import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { HabitEditor } from '@/components/habits/HabitEditor'
import { useHabitStore } from '@/store/useHabitStore'
import { habitWeeklyCount, isHabitCompletedOn } from '@/domain/habits'
import { useGameStore } from '@/store/useGameStore'

interface HabitsScreenProps {
  onBack: () => void
}

/**
 * Habit 管理页：新增 / 编辑 / 停用 / 删除 + 每日提醒时间。
 * 停用与删除的区别：停用保留历史完成记录（以后想恢复就恢复），删除会连记录一起清掉。
 */
export function HabitsScreen({ onBack }: HabitsScreenProps) {
  const { t } = useTranslation()
  const { habits, canAdd, maxActive, addHabit, updateHabit, removeHabit } = useHabitStore()
  const completions = useGameStore((s) => s.state.habitCompletions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-6 pt-4">
      <ScreenHeader
        title={t('habits.title')}
        subtitle={t('habits.limitHint', { max: maxActive })}
        onBack={onBack}
        backLabel={t('common.back')}
      />

      <ul className="flex flex-col gap-2">
        {habits.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-400">{t('habits.emptyHint')}</li>
        )}
        {habits.map((habit) =>
          editingId === habit.id ? (
            <li key={habit.id}>
              <HabitEditor
                habit={habit}
                onSubmit={(title, reminderTime) => {
                  updateHabit(habit.id, { title, reminderTime })
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={habit.id}
              className={`flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft ${
                habit.active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">{habit.title}</p>
                  <p className="flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                    <span>
                      {t('habits.weeklyCount', {
                        count: habitWeeklyCount(completions, habit.id),
                      })}
                    </span>
                    {habit.reminderTime ? (
                      <span className="tabular-nums">⏰ {habit.reminderTime}</span>
                    ) : (
                      <span>{t('habits.reminderOff')}</span>
                    )}
                    {isHabitCompletedOn(completions, habit.id) && (
                      <span>{t('habits.doneToday')}</span>
                    )}
                    {!habit.active && <span>{t('habits.pausedBadge')}</span>}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingId(habit.id)}
                  className="rounded-full bg-chip px-3 py-1.5 text-xs text-ink-600"
                >
                  {t('habits.editButton')}
                </button>
                <button
                  type="button"
                  onClick={() => updateHabit(habit.id, { active: !habit.active })}
                  className="rounded-full bg-chip px-3 py-1.5 text-xs text-ink-600"
                >
                  {habit.active ? t('habits.pauseButton') : t('habits.resumeButton')}
                </button>
                {confirmingDeleteId === habit.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        removeHabit(habit.id)
                        setConfirmingDeleteId(null)
                      }}
                      className="rounded-full bg-gold-500 px-3 py-1.5 text-xs text-[#FFFDF6]"
                    >
                      {t('habits.confirmDeleteButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      className="rounded-full bg-chip px-3 py-1.5 text-xs text-ink-600"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(habit.id)}
                    className="rounded-full bg-chip px-3 py-1.5 text-xs text-ink-500"
                  >
                    {t('habits.deleteButton')}
                  </button>
                )}
              </div>
            </li>
          ),
        )}
      </ul>

      <div className="mt-3">
        {adding ? (
          <HabitEditor
            onSubmit={(title, reminderTime) => {
              addHabit(title, reminderTime)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        ) : canAdd ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full rounded-2xl border border-dashed border-line py-2.5 text-sm text-ink-500"
          >
            + {t('today.addHabitButton')}
          </button>
        ) : (
          <p className="text-center text-xs text-ink-400">
            {t('habits.maxReachedHint', { max: maxActive })}
          </p>
        )}
      </div>
    </div>
  )
}
