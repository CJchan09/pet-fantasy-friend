import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HABIT_MAX_TITLE_LENGTH, isHabitTitleValid } from '@/domain/habits'
import { REMINDER_PRESETS } from '@/domain/reminders'
import type { HabitItem, ReminderTime } from '@/types'

interface HabitEditorProps {
  /** 传入表示编辑已有 Habit；不传就是新建 */
  habit?: HabitItem
  onSubmit: (title: string, reminderTime: ReminderTime) => void
  onCancel: () => void
}

/** Habit 新建/编辑表单：标题 + 每日提醒时间（可不设） */
export function HabitEditor({ habit, onSubmit, onCancel }: HabitEditorProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(habit?.title ?? '')
  const [reminderTime, setReminderTime] = useState<ReminderTime>(habit?.reminderTime ?? null)

  const valid = isHabitTitleValid(title)

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('habits.titlePlaceholder')}
        maxLength={HABIT_MAX_TITLE_LENGTH}
        autoFocus
        className="rounded-xl bg-cream-100 px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:ring-1 focus:ring-gold-500/40"
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-ink-500">{t('habits.reminderLabel')}</span>
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
        <input
          type="time"
          value={reminderTime ?? ''}
          onChange={(e) => setReminderTime(e.target.value || null)}
          aria-label={t('habits.reminderCustomLabel')}
          className="w-32 rounded-xl bg-cream-100 px-3 py-2 text-sm text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSubmit(title, reminderTime)}
          className="flex-1 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-medium text-[#FFFDF6] disabled:opacity-40"
        >
          {habit ? t('habits.saveButton') : t('habits.addButton')}
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
