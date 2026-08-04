import { useTranslation } from 'react-i18next'
import type { MoodValue } from '@/types'

const MOOD_EMOJIS: Record<MoodValue, string> = {
  1: '😞',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🤩',
}

interface MoodPickerProps {
  value?: MoodValue
  onChange: (value: MoodValue) => void
}

/**
 * 情绪标记：一行表情，一次点击完成。只做记录，选完不显示任何评价或建议（PRD 3.3.2 定位纪律）。
 */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-ink-700">{t('reflection.moodLabel')}</span>
      <div className="flex justify-between px-1">
        {([1, 2, 3, 4, 5] as MoodValue[]).map((mood) => (
          <button
            key={mood}
            type="button"
            aria-label={t(`mood.${mood}`)}
            aria-pressed={value === mood}
            onClick={() => onChange(mood)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition-transform ${
              value === mood ? 'scale-110 bg-chip' : 'bg-cream-100 hover:scale-105'
            }`}
          >
            {MOOD_EMOJIS[mood]}
          </button>
        ))}
      </div>
    </div>
  )
}
