import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusTimerStore } from '@/store/useFocusTimerStore'
import { useFocusStore } from '@/store/useFocusStore'
import { usePetStore } from '@/store/usePetStore'
import { PetSprite } from '@/components/pet/PetSprite'
import {
  SoundscapeControls,
  type SoundscapeSelection,
} from '@/components/focus/SoundscapeControls'
import { FOCUS_SESSION_MINUTES } from '@/config/gameBalance'
import { petStageForLevel } from '@/domain/pet'
import { startSoundscape, type SoundscapePreset } from '@/audio/proceduralSoundscape'

interface FocusScreenProps {
  onBack: () => void
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 专注模式：沉浸式倒计时，参照 handoff 稿 FRAME 2 布局。
 * 荣誉制，不做严格监控（PRD 5.3）：中途取消不给星尘也不扣任何东西，不显示失败文案。
 */
export function FocusScreen({ onBack }: FocusScreenProps) {
  const { t } = useTranslation()
  const { secondsRemaining, running, start, cancel, decrement } = useFocusTimerStore()
  const { sessionsToday, dailyLimit, canStart, rewardPerSession, completeFocusSession } =
    useFocusStore()
  const { pet } = usePetStore()

  const [justCompleted, setJustCompleted] = useState(false)
  const [soundscape, setSoundscape] = useState<SoundscapeSelection>('off')
  const [soundVolume, setSoundVolume] = useState(0.34)
  const completionHandledRef = useRef(false)
  const soundscapeHandleRef = useRef<ReturnType<typeof startSoundscape>>(null)

  useEffect(
    () => () => {
      soundscapeHandleRef.current?.stop()
    },
    [],
  )

  useEffect(() => {
    if (!running) {
      return
    }
    const id = window.setInterval(() => decrement(), 1000)
    return () => window.clearInterval(id)
  }, [running, decrement])

  useEffect(() => {
    if (running && secondsRemaining === 0 && !completionHandledRef.current) {
      completionHandledRef.current = true
      completeFocusSession()
      cancel()
      soundscapeHandleRef.current?.stop()
      soundscapeHandleRef.current = null
      setSoundscape('off')
      setJustCompleted(true)
    }
  }, [running, secondsRemaining, completeFocusSession, cancel])

  function handleStart() {
    completionHandledRef.current = false
    start()
  }

  function handleCancel() {
    completionHandledRef.current = false
    cancel()
    soundscapeHandleRef.current?.stop()
    soundscapeHandleRef.current = null
    setSoundscape('off')
  }

  function handleSoundscapeSelect(selection: SoundscapeSelection) {
    soundscapeHandleRef.current?.stop()
    soundscapeHandleRef.current = null
    setSoundscape(selection)

    if (selection !== 'off') {
      soundscapeHandleRef.current = startSoundscape(selection as SoundscapePreset, soundVolume)
    }
  }

  function handleVolumeChange(volume: number) {
    setSoundVolume(volume)
    soundscapeHandleRef.current?.setVolume(volume)
  }

  if (justCompleted) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center [background:radial-gradient(130%_100%_at_50%_12%,#F9F4E8_0%,#EFE4CC_55%,#E3D5B7_100%)]">
        <p className="font-display text-2xl text-ink-900">{t('focus.completedTitle')}</p>
        <p className="text-sm text-ink-600">
          {t('focus.completedHint', { reward: rewardPerSession })}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-2xl bg-gold-500 px-8 py-3 text-base font-medium text-[#FFFDF6] shadow-soft"
        >
          {t('focus.backButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-3 px-6 [background:radial-gradient(130%_100%_at_50%_12%,#F9F4E8_0%,#EFE4CC_55%,#E3D5B7_100%)]">
      {!running && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t('focus.backButton')}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
      )}

      <p className="font-display text-7xl font-medium tracking-wide text-ink-900 tabular-nums sm:text-8xl">
        {formatTime(secondsRemaining)}
      </p>
      <p className="text-sm tracking-wide text-ink-500">
        {running
          ? t('focus.runningHint', { name: pet.name })
          : t('focus.idleHint', { minutes: FOCUS_SESSION_MINUTES, reward: rewardPerSession })}
      </p>

      <div className="mt-8 flex flex-col items-center">
        <PetSprite
          species={pet.species}
          stage={petStageForLevel(pet.level)}
          joy={false}
          lifecycleStatus="active"
          alt={pet.name}
          className="h-40 w-40 [filter:drop-shadow(0_18px_26px_rgba(90,78,55,0.18))] sm:h-56 sm:w-56"
        />
        <div className="-mt-3 h-4 w-32 [background:radial-gradient(50%_50%_at_50%_50%,rgba(90,78,55,0.15),transparent_70%)]" />
      </div>

      <SoundscapeControls
        selection={soundscape}
        volume={soundVolume}
        onSelect={handleSoundscapeSelect}
        onVolumeChange={handleVolumeChange}
      />

      {!running ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className="rounded-2xl bg-gold-500 px-10 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600 disabled:opacity-40"
          >
            {t('focus.startButton')}
          </button>
          <p className="text-xs text-ink-400">
            {canStart
              ? t('focus.sessionsTodayHint', { count: sessionsToday, limit: dailyLimit })
              : t('focus.dailyLimitReachedHint')}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCancel}
          className="mt-6 text-sm text-ink-400 underline-offset-2 hover:underline"
        >
          {t('focus.cancelButton')}
        </button>
      )}
    </div>
  )
}
