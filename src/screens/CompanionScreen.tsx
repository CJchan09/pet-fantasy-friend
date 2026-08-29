import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PetScene } from '@/components/pet/PetScene'
import { StardustBadge } from '@/components/stardust/StardustBadge'
import { EggCard } from '@/components/incubation/EggCard'
import { usePetStore } from '@/store/usePetStore'
import { useStardustStore } from '@/store/useStardustStore'
import { useAnimalChessStore } from '@/store/useAnimalChessStore'

interface CompanionScreenProps {
  onOpenDex: () => void
  onOpenAnimalChess: () => void
}

const JOY_DURATION_MS = 2200

/**
 * Companion Tab —— 原 HomeScreen 的宠物部分。
 * 改版后这里是**情感层**：宠物、喂养、孵化、图鉴、小游戏。
 * 「今天要做什么」全部搬到 Today Tab，反思搬到 Insights Tab（方案文档 §2.3 主次关系）。
 */
export function CompanionScreen({ onOpenDex, onOpenAnimalChess }: CompanionScreenProps) {
  const { t } = useTranslation()
  const { pet, lifecycleStatus, canFeed, feedCost, feedPet } = usePetStore()
  const { balance } = useStardustStore()
  const { winsToday, dailyLimit: chessDailyLimit, rewardPerWin, canWin } = useAnimalChessStore()

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="flex-1 text-[15px] font-medium text-ink-900">{t('tabs.companion')}</h1>
        <StardustBadge balance={balance} />
        <button
          type="button"
          onClick={onOpenDex}
          aria-label={t('home.dexLink')}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-chip text-sm text-ink-600"
        >
          📖
        </button>
      </header>

      <div className="flex min-h-[48vh] flex-col">
        <PetScene
          pet={pet}
          joy={joy}
          lifecycleStatus={lifecycleStatus}
          canFeed={canFeed}
          feedCost={feedCost}
          onFeed={handleFeed}
        />
        {!canFeed && (
          <p className="mt-2 text-center text-xs text-ink-400">{t('home.feedNotEnoughHint')}</p>
        )}
      </div>

      <EggCard />

      {/* 斗兽棋小游戏——独立娱乐入口，跟成长系统的星尘经济刻意区隔开 */}
      <button
        type="button"
        onClick={onOpenAnimalChess}
        className="flex items-center justify-between rounded-2xl bg-card/80 px-4 py-3 text-left shadow-soft"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink-700">{t('home.animalChessButton')}</span>
          <span className="text-[10px] text-ink-400">
            {!canWin
              ? t('home.animalChessLimitReachedHint')
              : t('home.animalChessTodayHint', {
                  reward: rewardPerWin,
                  count: winsToday,
                  limit: chessDailyLimit,
                })}
          </span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-line text-base text-ink-400">
          ›
        </span>
      </button>
    </div>
  )
}
