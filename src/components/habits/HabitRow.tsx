import { useTranslation } from 'react-i18next'
import type { HabitItem } from '@/types'

interface HabitRowProps {
  habit: HabitItem
  done: boolean
  weeklyCount: number
  onToggle: () => void
  onEdit?: () => void
}

/**
 * Habit 单行。视觉上刻意**不**显示「连续天数」——
 * 方案文档 §5.1：只显示本周完成次数，不做带压力的长连续记录。
 */
export function HabitRow({ habit, done, weeklyCount, onToggle, onEdit }: HabitRowProps) {
  const { t } = useTranslation()

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={habit.title}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${
          done ? 'bg-gold-500 text-[#FFFDF6]' : 'border-[1.5px] border-line'
        }`}
      >
        {done && '✓'}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${done ? 'text-ink-400' : 'text-ink-800'}`}>
          {habit.title}
        </p>
        <p className="flex items-center gap-2 text-[11px] text-ink-400">
          <span>{t('habits.weeklyCount', { count: weeklyCount })}</span>
          {habit.reminderTime && <span className="tabular-nums">⏰ {habit.reminderTime}</span>}
        </p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('habits.editButton')}
          className="text-ink-300 hover:text-ink-500"
        >
          ⋯
        </button>
      )}
    </li>
  )
}
