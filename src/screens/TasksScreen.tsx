import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '@/store/useTaskStore'
import { isTaskLabelValid } from '@/domain/tasks'

interface TasksScreenProps {
  onBack: () => void
}

/**
 * 自定义任务：一次性待办（加→勾选→完成→可删除），照抄 handoff 稿的打勾划线视觉。
 * 每个任务只发一次星尘；当日已达上限的任务照样能勾选，只是不再发星尘。
 */
export function TasksScreen({ onBack }: TasksScreenProps) {
  const { t } = useTranslation()
  const { tasks, rewardedTodayCount, dailyRewardLimit, addTask, removeTask, toggleTask } =
    useTaskStore()
  const [label, setLabel] = useState('')

  function handleAdd() {
    if (!isTaskLabelValid(label)) {
      return
    }
    addTask(label)
    setLabel('')
  }

  const atDailyLimit = rewardedTodayCount >= dailyRewardLimit

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-6 pt-4">
      <header className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('tasks.backButton')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
        <h1 className="text-[15px] font-medium text-ink-900">{t('tasks.title')}</h1>
      </header>

      <p className="mb-3 text-xs text-ink-400">
        {atDailyLimit
          ? t('tasks.dailyLimitReachedHint')
          : t('tasks.rewardHint', { count: rewardedTodayCount, limit: dailyRewardLimit })}
      </p>

      <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {tasks.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-400">{t('tasks.emptyHint')}</li>
        )}
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft"
          >
            <button
              type="button"
              onClick={() => toggleTask(task.id)}
              aria-pressed={task.done}
              aria-label={task.label}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] text-xs ${
                task.done ? 'bg-chip text-ink-600' : 'border-[1.5px] border-line'
              }`}
            >
              {task.done && '✓'}
            </button>
            <span
              className={`flex-1 text-sm ${
                task.done ? 'text-ink-400 line-through' : 'text-ink-800'
              }`}
            >
              {task.label}
            </span>
            <button
              type="button"
              onClick={() => removeTask(task.id)}
              aria-label={t('tasks.deleteButton')}
              className="text-ink-300 hover:text-ink-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder={t('tasks.addPlaceholder')}
          maxLength={40}
          className="flex-1 rounded-xl bg-cream-100 px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:ring-1 focus:ring-gold-500/40"
        />
        <button
          type="button"
          disabled={!isTaskLabelValid(label)}
          onClick={handleAdd}
          className="rounded-xl bg-gold-500 px-4 text-sm font-medium text-[#FFFDF6] disabled:opacity-40"
        >
          {t('tasks.addButton')}
        </button>
      </div>
    </div>
  )
}
