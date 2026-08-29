import { useTranslation } from 'react-i18next'
import { isTaskOverdue, isTaskDueToday } from '@/domain/tasks'
import type { TaskItem } from '@/types'

interface TaskRowProps {
  task: TaskItem
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
  onFocus?: () => void
}

/** Todo 单行。过期只是灰色提示，不红不叹号——不惩罚原则 */
export function TaskRow({ task, onToggle, onEdit, onDelete, onFocus }: TaskRowProps) {
  const { t } = useTranslation()
  const overdue = isTaskOverdue(task)
  const dueToday = isTaskDueToday(task)

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={task.done}
        aria-label={task.label}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] text-xs ${
          task.done ? 'bg-chip text-ink-600' : 'border-[1.5px] border-line'
        }`}
      >
        {task.done && '✓'}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.done ? 'text-ink-400 line-through' : 'text-ink-800'}`}>
          {task.label}
        </p>
        {(task.dueDate || task.reminderTime) && (
          <p className="flex items-center gap-2 text-[11px] text-ink-400">
            {task.dueDate && (
              <span className="tabular-nums">
                {dueToday
                  ? t('tasks.dueToday')
                  : overdue
                    ? t('tasks.dueOverdue', { date: task.dueDate })
                    : t('tasks.dueOn', { date: task.dueDate })}
              </span>
            )}
            {task.reminderTime && <span className="tabular-nums">⏰ {task.reminderTime}</span>}
          </p>
        )}
      </div>
      {onFocus && !task.done && (
        <button
          type="button"
          onClick={onFocus}
          aria-label={t('tasks.focusOnThis')}
          title={t('tasks.focusOnThis')}
          className="flex-shrink-0 text-sm text-ink-300 hover:text-gold-600"
        >
          ◷
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('tasks.editButton')}
          className="flex-shrink-0 text-ink-300 hover:text-ink-500"
        >
          ⋯
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('tasks.deleteButton')}
          className="flex-shrink-0 text-ink-300 hover:text-ink-500"
        >
          ✕
        </button>
      )}
    </li>
  )
}
