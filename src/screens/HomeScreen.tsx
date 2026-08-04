import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PetScene } from '@/components/pet/PetScene'
import { StardustBadge } from '@/components/stardust/StardustBadge'
import { LanguageToggle } from '@/components/LanguageToggle'
import { usePetStore } from '@/store/usePetStore'
import { useStardustStore } from '@/store/useStardustStore'
import { useReflectionStore } from '@/store/useReflectionStore'

interface HomeScreenProps {
  onOpenReflection: () => void
  onOpenHistory: () => void
}

const JOY_DURATION_MS = 2200

/**
 * 主界面。视觉权重（UI 规格说明）：
 * 宠物场景 ≥50% 主视觉；每日反思是最大的行动卡片；专注/任务为阶段二占位，权重明显更低。
 */
export function HomeScreen({ onOpenReflection, onOpenHistory }: HomeScreenProps) {
  const { t } = useTranslation()
  const { pet, canFeed, feedCost, feedPet } = usePetStore()
  const { balance } = useStardustStore()
  const { hasSubmittedToday } = useReflectionStore()

  const [joy, setJoy] = useState(false)
  const joyTimerRef = useRef<number | undefined>(undefined)

  function handleFeed() {
    const success = feedPet()
    if (success) {
      window.clearTimeout(joyTimerRef.current)
      setJoy(true)
      joyTimerRef.current = window.setTimeout(() => setJoy(false), JOY_DURATION_MS)
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-4 pb-6 pt-4 lg:max-w-5xl">
      {/* 顶栏 */}
      <header className="flex items-center justify-between">
        <div className="hidden items-baseline gap-2.5 lg:flex">
          <span className="font-display text-lg font-semibold">{t('app.title')}</span>
          <span className="text-[11px] tracking-[1.5px] text-ink-400">
            {t('app.subtitle')}
          </span>
        </div>
        <StardustBadge balance={balance} />
        <LanguageToggle />
      </header>

      {/* 主体：手机单列，桌面双栏 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* 宠物场景（主视觉） */}
        <div className="flex min-h-[52vh] flex-col lg:min-h-[70vh] lg:flex-[3]">
          <PetScene
            pet={pet}
            joy={joy}
            canFeed={canFeed}
            feedCost={feedCost}
            onFeed={handleFeed}
          />
          {!canFeed && (
            <p className="mt-2 text-center text-xs text-ink-400">
              {t('home.feedNotEnoughHint')}
            </p>
          )}
        </div>

        {/* 行动卡片区 */}
        <div className="flex flex-col gap-3 lg:flex-[2] lg:justify-start">
          {/* 每日反思 —— 最大行动卡片 */}
          <button
            type="button"
            onClick={onOpenReflection}
            className="flex items-center justify-between rounded-[20px] bg-card px-6 py-5 text-left shadow-soft transition-transform active:scale-[0.99]"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-medium text-ink-900">
                {t('home.reflectionCta')}
              </span>
              <span className="text-xs text-ink-400">
                {hasSubmittedToday
                  ? t('home.reflectionHintDone')
                  : t('home.reflectionHintNotDone')}
              </span>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-line text-lg text-ink-400">
              ›
            </span>
          </button>

          {/* 专注 / 任务 —— 阶段二占位，权重更低 */}
          <div className="flex gap-3">
            <PlaceholderCard label={t('home.focusButton')} hint={t('home.comingSoon')} />
            <PlaceholderCard label={t('home.tasksButton')} hint={t('home.comingSoon')} />
          </div>

          <button
            type="button"
            onClick={onOpenHistory}
            className="py-2 text-center text-sm text-ink-500 underline-offset-2 hover:underline"
          >
            {t('home.historyLink')}
          </button>
        </div>
      </div>
    </div>
  )
}

function PlaceholderCard({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-card/60 px-4 py-3 shadow-soft opacity-60">
      <span className="text-sm font-medium text-ink-600">{label}</span>
      <span className="rounded-lg bg-chip px-2 py-0.5 text-[10px] text-ink-500">{hint}</span>
    </div>
  )
}
