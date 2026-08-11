import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEggStore } from '@/store/useEggStore'

const DRAW_ANIMATION_MS = 1200

/**
 * 孵化卡片，三种状态：
 * 1. 没有蛋、还有生物没集齐 → 「抽一颗蛋」按钮（抽的瞬间生物已定，对玩家保密）
 * 2. 有蛋 → 可见进度条 + 浇灌按钮（确定性推进，PRD 原则 3）
 * 3. 全部集齐 → 「都到齐了」的收尾状态
 * 蛋是 CSS 画的（渐变 + 圆角，照抄 handoff 稿写法），没有蛋的美术资源。
 * 抽蛋动画刻意收敛：蛋落进巢里晃两下，不做稀有度闪光/悬念累积那种开箱观感。
 */
export function EggCard() {
  const { t } = useTranslation()
  const { egg, cost, advanceChunk, canAdvance, collectionComplete, canDraw, drawEgg, advanceEgg } =
    useEggStore()

  const [justDrawn, setJustDrawn] = useState(false)
  const drawTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(drawTimerRef.current), [])

  function handleDraw() {
    if (drawEgg()) {
      setJustDrawn(true)
      window.clearTimeout(drawTimerRef.current)
      drawTimerRef.current = window.setTimeout(() => setJustDrawn(false), DRAW_ANIMATION_MS)
    }
  }

  if (collectionComplete && !egg) {
    return (
      <div className="rounded-[20px] bg-card px-5 py-4 text-center shadow-soft">
        <p className="text-sm font-medium text-ink-800">{t('home.collectionCompleteTitle')}</p>
        <p className="mt-1 text-xs text-ink-400">{t('home.collectionCompleteHint')}</p>
      </div>
    )
  }

  if (!egg) {
    return (
      <div className="flex items-center justify-between rounded-[20px] bg-card px-5 py-4 shadow-soft">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-ink-800">{t('home.eggDrawTitle')}</p>
          <p className="text-xs text-ink-400">{t('home.eggDrawHint')}</p>
        </div>
        <button
          type="button"
          disabled={!canDraw}
          onClick={handleDraw}
          className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-medium text-[#FFFDF6] transition-colors active:bg-gold-600 disabled:opacity-40"
        >
          {t('home.eggDrawButton')}
        </button>
      </div>
    )
  }

  const remaining = Math.max(0, cost - egg.progress)
  const progressPct = Math.round((egg.progress / cost) * 100)

  return (
    <button
      type="button"
      disabled={!canAdvance || justDrawn}
      onClick={advanceEgg}
      className="flex items-center gap-4 rounded-[20px] bg-card px-5 py-4 text-left shadow-soft disabled:opacity-70"
    >
      <div className={`relative flex-shrink-0 ${justDrawn ? 'animate-egg-pop' : ''}`}>
        <div
          className="h-11 w-9 rounded-[50%_50%_48%_48%/58%_58%_44%_44%] [background:linear-gradient(160deg,#F2E9D5,#E0D3B4)] shadow-inner"
          aria-hidden="true"
        />
        {justDrawn && (
          <span
            className="animate-twinkle absolute -right-1.5 -top-1.5 text-xs text-gold-500"
            aria-hidden="true"
          >
            ✦
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-ink-800">{t('home.eggLabel.mystery')}</span>
          <span className="text-ink-400">{t('home.eggRemaining', { count: remaining })}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(90,78,55,0.10)]">
          <div
            className="h-full rounded-full bg-gold-500 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[11px] text-ink-400">
          {justDrawn
            ? t('home.eggDrawnHint')
            : canAdvance
              ? t('home.eggAdvanceHint', { cost: advanceChunk })
              : t('home.eggAdvanceNotEnoughHint')}
        </span>
      </div>
    </button>
  )
}
