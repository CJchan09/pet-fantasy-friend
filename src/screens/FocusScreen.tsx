import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFocusTimerStore } from '@/store/useFocusTimerStore'
import { useFocusStore } from '@/store/useFocusStore'
import { usePetStore } from '@/store/usePetStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useHabitStore } from '@/store/useHabitStore'
import { PetSprite } from '@/components/pet/PetSprite'
import {
  SoundscapeControls,
  type SoundscapeSelection,
} from '@/components/focus/SoundscapeControls'
import {
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
  FOCUS_QUICK_MINUTES,
  FOCUS_STEP_MINUTES,
} from '@/config/gameBalance'
import { petStageForLevel } from '@/domain/pet'
import { startSoundscape, type SoundscapePreset } from '@/audio/proceduralSoundscape'
import type { FocusLink } from '@/types'

interface FocusScreenProps {
  onBack: () => void
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 专注模式：可调时长（5–180 分钟，5 分钟步进）+ 可选关联 Todo/Habit + 环境音。
 * 荣誉制，不做严格监控（PRD 5.3）：中途取消不给星尘、不扣任何东西、不显示责备文案。
 * 星尘按 floor(分钟/5) 结算，达到每日上限时仍然记录这次专注，只是奖励为 0。
 */
export function FocusScreen({ onBack }: FocusScreenProps) {
  const { t } = useTranslation()
  const { minutes, secondsRemaining, running, link, setMinutes, setLink, start, cancel, decrement } =
    useFocusTimerStore()
  const { minutesToday, stardustEarnedToday, dailyCap, previewReward, completeFocusSession } =
    useFocusStore()
  const { pet } = usePetStore()
  const taskStore = useTaskStore()
  const habitStore = useHabitStore()

  const [earned, setEarned] = useState<number | null>(null)
  const [pickingLink, setPickingLink] = useState(false)
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
      const reward = completeFocusSession(minutes, link)
      cancel()
      soundscapeHandleRef.current?.stop()
      soundscapeHandleRef.current = null
      setSoundscape('off')
      setEarned(reward)
    }
  }, [running, secondsRemaining, minutes, link, completeFocusSession, cancel])

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

  function handlePickLink(next: FocusLink | null) {
    setLink(next)
    setPickingLink(false)
  }

  if (earned !== null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center [background:radial-gradient(130%_100%_at_50%_12%,#F9F4E8_0%,#EFE4CC_55%,#E3D5B7_100%)]">
        <p className="font-display text-2xl text-ink-900">{t('focus.completedTitle')}</p>
        <p className="text-sm text-ink-600">
          {earned > 0
            ? t('focus.completedHint', { minutes, reward: earned })
            : t('focus.completedNoRewardHint', { minutes })}
        </p>
        <button
          type="button"
          onClick={() => {
            setEarned(null)
            onBack()
          }}
          className="mt-4 rounded-2xl bg-gold-500 px-8 py-3 text-base font-medium text-[#FFFDF6] shadow-soft"
        >
          {t('focus.backButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-full flex-col items-center gap-3 px-6 pb-6 pt-14 [background:radial-gradient(130%_100%_at_50%_12%,#F9F4E8_0%,#EFE4CC_55%,#E3D5B7_100%)]">
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
      <p className="text-center text-sm tracking-wide text-ink-500">
        {running
          ? t('focus.runningHint', { name: pet.name })
          : t('focus.idleHint', { minutes, reward: previewReward(minutes) })}
      </p>
      {link && (
        <p className="text-xs text-ink-400">{t('focus.linkedTo', { label: link.label })}</p>
      )}

      <div className="mt-4 flex flex-col items-center">
        <PetSprite
          species={pet.species}
          stage={petStageForLevel(pet.level)}
          joy={false}
          lifecycleStatus="active"
          alt={pet.name}
          className="h-36 w-36 [filter:drop-shadow(0_18px_26px_rgba(90,78,55,0.18))] sm:h-48 sm:w-48"
        />
        <div className="-mt-3 h-4 w-32 [background:radial-gradient(50%_50%_at_50%_50%,rgba(90,78,55,0.15),transparent_70%)]" />
      </div>

      {!running && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          {/* 快捷时长 */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {FOCUS_QUICK_MINUTES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMinutes(option)}
                aria-pressed={minutes === option}
                className={`rounded-full px-3.5 py-1.5 text-xs tabular-nums ${
                  minutes === option ? 'bg-gold-500 text-[#FFFDF6]' : 'bg-card/80 text-ink-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* 自定义时长：5 分钟步进 */}
          <label className="flex flex-col gap-1">
            <span className="text-center text-[11px] text-ink-400">
              {t('focus.customLengthLabel', { min: FOCUS_MIN_MINUTES, max: FOCUS_MAX_MINUTES })}
            </span>
            <input
              type="range"
              min={FOCUS_MIN_MINUTES}
              max={FOCUS_MAX_MINUTES}
              step={FOCUS_STEP_MINUTES}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="accent-gold-500"
            />
          </label>

          {/* 关联 Todo / Habit（可选，不强制） */}
          {pickingLink ? (
            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-card p-3 shadow-soft">
              <button
                type="button"
                onClick={() => handlePickLink(null)}
                className="rounded-xl bg-chip px-3 py-2 text-left text-xs text-ink-600"
              >
                {t('focus.linkNone')}
              </button>
              {taskStore.today.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() =>
                    handlePickLink({ kind: 'todo', id: task.id, label: task.label })
                  }
                  className="truncate rounded-xl bg-cream-100 px-3 py-2 text-left text-xs text-ink-700"
                >
                  ☐ {task.label}
                </button>
              ))}
              {habitStore.activeHabits.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() =>
                    handlePickLink({ kind: 'habit', id: habit.id, label: habit.title })
                  }
                  className="truncate rounded-xl bg-cream-100 px-3 py-2 text-left text-xs text-ink-700"
                >
                  ◌ {habit.title}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickingLink(true)}
              className="rounded-2xl bg-card/80 px-4 py-2.5 text-xs text-ink-600"
            >
              {link ? t('focus.changeLinkButton') : t('focus.addLinkButton')}
            </button>
          )}
        </div>
      )}

      <SoundscapeControls
        selection={soundscape}
        volume={soundVolume}
        onSelect={handleSoundscapeSelect}
        onVolumeChange={handleVolumeChange}
      />

      {!running ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-2xl bg-gold-500 px-10 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600"
          >
            {t('focus.startButton')}
          </button>
          <p className="text-center text-xs text-ink-400">
            {t('focus.todayStatsHint', {
              minutes: minutesToday,
              earned: stardustEarnedToday,
              cap: dailyCap,
            })}
          </p>
          {previewReward(minutes) === 0 && (
            <p className="max-w-xs text-center text-[11px] text-ink-400">
              {t('focus.capReachedHint')}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 text-sm text-ink-400 underline-offset-2 hover:underline"
        >
          {t('focus.cancelButton')}
        </button>
      )}
    </div>
  )
}
