import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReflectionEntry } from '@/types'
import { creatureAsset } from '@/config/creatures'
import { usePetStore } from '@/store/usePetStore'

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
  const { pet } = usePetStore()
  const [openEntry, setOpenEntry] = useState<ReflectionEntry | null>(null)

  if (reflections.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-400">{t('history.emptyHint')}</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-3 py-4">
        {reflections.map((entry) => (
          <li key={entry.date}>
            <button
              type="button"
              onClick={() => setOpenEntry(entry)}
              className="w-full rounded-[20px] bg-card p-4 text-left shadow-soft transition-transform active:scale-[0.99]"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700">{entry.date}</span>
                <span className="flex items-center gap-2 text-xs text-ink-400">
                  {entry.mood && <span aria-hidden="true">{MOOD_EMOJIS[entry.mood]}</span>}
                  <span className="text-gold-700">
                    {t('history.stardustAwardedLabel', { count: entry.stardustAwarded })}
                  </span>
                  <span aria-hidden="true" className="text-ink-400">
                    ›
                  </span>
                </span>
              </div>
              <p className="truncate text-sm text-ink-600">
                {entry.answers.gratitude || entry.answers.learning || entry.answers.improvement}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {openEntry && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(68,62,51,0.35)] p-4 sm:items-center"
          onClick={() => setOpenEntry(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-[24px] bg-card p-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={creatureAsset(pet.species, 'joy')}
                  alt={pet.name}
                  className="h-14 w-14 object-contain"
                  draggable={false}
                />
                <div>
                  <p className="text-sm font-medium text-ink-900">{openEntry.date}</p>
                  <p className="flex items-center gap-1.5 text-xs text-ink-400">
                    {openEntry.mood && <span aria-hidden="true">{MOOD_EMOJIS[openEntry.mood]}</span>}
                    <span className="text-gold-700">
                      {t('history.stardustAwardedLabel', { count: openEntry.stardustAwarded })}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenEntry(null)}
                aria-label={t('history.closeButton')}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cream-200 text-ink-600"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {openEntry.answers.gratitude && (
                <div>
                  <p className="text-xs text-ink-400">{t('reflection.questionGratitude')}</p>
                  <p className="mt-0.5 text-sm text-ink-700">{openEntry.answers.gratitude}</p>
                </div>
              )}
              {openEntry.answers.learning && (
                <div>
                  <p className="text-xs text-ink-400">{t('reflection.questionLearning')}</p>
                  <p className="mt-0.5 text-sm text-ink-700">{openEntry.answers.learning}</p>
                </div>
              )}
              {openEntry.answers.improvement && (
                <div>
                  <p className="text-xs text-ink-400">{t('reflection.questionImprovement')}</p>
                  <p className="mt-0.5 text-sm text-ink-700">{openEntry.answers.improvement}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
