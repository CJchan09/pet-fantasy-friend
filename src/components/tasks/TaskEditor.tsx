import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TASK_MAX_LABEL_LENGTH, isTaskLabelValid } from '@/domain/tasks'
import { getLocalDateKey } from '@/domain/reflection'
import { REMINDER_PRESETS } from '@/domain/reminders'
import type { ReminderTime, TaskItem } from '@/types'

interface TaskEditorProps {
  task?: TaskItem
  onSubmit: (label: string, dueDate: string | null, reminderTime: ReminderTime) => void
  onCancel: () => void
}

/** Todo 新建/编辑表单：标题 + 可选截止日 + 可选提醒（提醒依附截止日） */
export function TaskEditor({ task, onSubmit, onCancel }: TaskEditorProps) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(task?.label ?? '')
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? null)
  const [reminderTime, setReminderTime] = useState<ReminderTime>(task?.reminderTime ?? null)

  const valid = isTaskLabelValid(label)
  const today = getLocalDateKey()

  function handleDueDateChange(value: string) {
    const next = value || null
    setDueDate(next)
    if (!next) {
      setReminderTime(null) // 没有截止日就没有「什么时候提醒」
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('tasks.addPlaceholder')}
        maxLength={TASK_MAX_LABEL_LENGTH}
        autoFocus
        className="rounded-xl bg-cream-100 px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:ring-1 focus:ring-gold-500/40"
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-ink-500">{t('tasks.dueDateLabel')}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleDueDateChange(today)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              dueDate === today ? 'bg-gold-500 text-[#FFFDF6]' : 'bg-chip text-ink-600'
            }`}
          >
            {t('tasks.dueTodayPreset')}
          </button>
          <button
            type="button"
            onClick={() => handleDueDateChange('')}
            className={`rounded-full px-3 py-1.5 text-xs ${
              dueDate === null ? 'bg-gold-500 text-[#FFFDF6]' : 'bg-chip text-ink-600'
            }`}
          >
            {t('tasks.dueNone')}
          </button>
          <input
            type="date"
            value={dueDate ?? ''}
            onChange={(e) => handleDueDateChange(e.target.value)}
            aria-label={t('tasks.dueDateLabel')}
            className="rounded-xl bg-cream-100 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
          />
        </div>
      </div>

      {dueDate && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-ink-500">{t('tasks.reminderLabel')}</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setReminderTime(null)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                reminderTime === null ? 'bg-gold-500 text-[#FFFDF6]' : 'bg-chip text-ink-600'
              }`}
            >
              {t('habits.reminderOff')}
            </button>
            {REMINDER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReminderTime(preset)}
                className={`rounded-full px-3 py-1.5 text-xs tabular-nums ${
                  reminderTime === preset ? 'bg-gold-500 text-[#FFFDF6]' : 'bg-chip text-ink-600'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSubmit(label, dueDate, reminderTime)}
          className="flex-1 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-medium text-[#FFFDF6] disabled:opacity-40"
        >
          {task ? t('habits.saveButton') : t('tasks.addButton')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-chip px-4 py-2.5 text-sm text-ink-600"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
