import { useTranslation } from 'react-i18next'
import type { ReflectionEntry } from '@/types'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😞',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🤩',
}

interface ReflectionHistoryProps {
  reflections: ReflectionEntry[]
}

/** 反思历史：按日期倒序回看（store 已排序），只做呈现，不做任何解读或建议 */
export function ReflectionHistory({ reflections }: ReflectionHistoryProps) {
  const { t } = useTranslation()

  if (reflections.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-400">{t('history.emptyHint')}</p>
  }

  return (
    <ul className="flex flex-col gap-3 py-4">
      {reflections.map((entry) => (
        <li key={entry.date} className="rounded-[20px] bg-card p-4 shadow-soft">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">{entry.date}</span>
            <span className="flex items-center gap-2 text-xs text-ink-400">
              {entry.mood && <span aria-hidden="true">{MOOD_EMOJIS[entry.mood]}</span>}
              <span className="text-gold-700">
                {t('history.stardustAwardedLabel', { count: entry.stardustAwarded })}
              </span>
            </span>
          </div>
          <p className="truncate text-sm text-ink-600">
            {entry.answers.gratitude || entry.answers.learning || entry.answers.improvement}
          </p>
        </li>
      ))}
    </ul>
  )
}
