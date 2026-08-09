import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/store/useGameStore'
import { isHumanWin, type AnimalChessResult } from '@/domain/animalChess'

interface AnimalChessScreenProps {
  onBack: () => void
}

const GAME_URL = `${import.meta.env.BASE_URL}games/dou-shou-qi/index.html`

interface GameOverMessage {
  source: 'dou-shou-qi'
  type: 'gameOver'
  winner: 'red' | 'blue'
  aiOwner: 'red' | 'blue' | null
}

function isGameOverMessage(data: unknown): data is GameOverMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).source === 'dou-shou-qi' &&
    (data as Record<string, unknown>).type === 'gameOver'
  )
}

/**
 * 斗兽棋小游戏，嵌在 iframe 里（public/games/dou-shou-qi/，见 scripts/convertAnimalChessAssets.mjs）。
 * 赢了给一点星尘、输了不扣分（gameBalance.ts 有专门的产品原则注释解释这跟「星尘只能靠成长行为赚」
 * 这条硬性原则的关系），也不算成长行为、不会唤醒沉睡的宠物。
 */
export function AnimalChessScreen({ onBack }: AnimalChessScreenProps) {
  const { t } = useTranslation()
  const recordAnimalChessResult = useGameStore((s) => s.recordAnimalChessResult)
  const [banner, setBanner] = useState<'rewarded' | 'won-no-reward' | null>(null)
  const bannerTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }
      if (!isGameOverMessage(event.data)) {
        return
      }
      const result: AnimalChessResult = { winner: event.data.winner, aiOwner: event.data.aiOwner }
      const won = isHumanWin(result)
      const rewarded = recordAnimalChessResult(result)

      window.clearTimeout(bannerTimerRef.current)
      if (won) {
        // 输了不显示任何横幅——游戏自己的结算弹窗已经说清楚了，不需要再加一句
        setBanner(rewarded ? 'rewarded' : 'won-no-reward')
        bannerTimerRef.current = window.setTimeout(() => setBanner(null), 3200)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearTimeout(bannerTimerRef.current)
    }
  }, [recordAnimalChessResult])

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 bg-cream-300 px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('animalChess.backButton')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
        <h1 className="text-[15px] font-medium text-ink-900">{t('animalChess.title')}</h1>
      </header>

      {banner && (
        <div className="bg-cream-300 px-4 pb-2">
          <p className="rounded-2xl bg-chip px-4 py-2 text-center text-sm text-ink-700">
            {banner === 'rewarded'
              ? t('animalChess.rewardedHint')
              : t('animalChess.wonNoRewardHint')}
          </p>
        </div>
      )}

      <iframe
        src={GAME_URL}
        title={t('animalChess.title')}
        className="w-full flex-1 border-0"
      />
    </div>
  )
}
