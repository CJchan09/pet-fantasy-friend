import { useTranslation } from 'react-i18next'
import type { SoundscapePreset } from '@/audio/proceduralSoundscape'

export type SoundscapeSelection = SoundscapePreset | 'off'

interface SoundscapeControlsProps {
  selection: SoundscapeSelection
  volume: number
  onSelect: (selection: SoundscapeSelection) => void
  onVolumeChange: (volume: number) => void
}

const OPTIONS: SoundscapeSelection[] = ['off', 'brown', 'rain', 'ocean']

export function SoundscapeControls({
  selection,
  volume,
  onSelect,
  onVolumeChange,
}: SoundscapeControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-3 flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-600">{t('focus.soundscapeLabel')}</span>
        <span className="text-xs text-ink-400">
          {t(`focus.soundscape.${selection}`)}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label={t('focus.soundscapeLabel')}
        className="grid grid-cols-4 gap-1 rounded-lg bg-cream-400/70 p-1"
      >
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selection === option}
            onClick={() => onSelect(option)}
            className={`min-h-9 rounded-md px-2 text-xs transition-colors ${
              selection === option
                ? 'bg-card font-medium text-ink-900 shadow-soft'
                : 'text-ink-500 hover:bg-cream-200'
            }`}
          >
            {t(`focus.soundscape.${option}`)}
          </button>
        ))}
      </div>

      <label className="flex h-8 items-center gap-3 text-xs text-ink-500">
        <span className="w-9 shrink-0">{t('focus.volumeLabel')}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          disabled={selection === 'off'}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="h-1.5 w-full accent-gold-600 disabled:opacity-35"
          aria-label={t('focus.volumeLabel')}
        />
      </label>
    </div>
  )
}
