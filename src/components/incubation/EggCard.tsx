import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CREATURES, creatureAsset, eggAsset } from '@/config/creatures'
import { useEggStore } from '@/store/useEggStore'

const DRAW_ANIMATION_MS = 1200

/**
 * 孵化卡片，三种状态：
 * 1. 没有蛋、还有生物没集齐 → 「抽一颗蛋」按钮
 * 2. 有蛋 → 对应生物的蛋美术 + 名字（抽的瞬间生物已定，直接告诉玩家是谁，不做悬念）+ 可见进度条 + 浇灌按钮（确定性推进，PRD 原则 3）
 * 3. 全部集齐 → 「都到齐了」的收尾状态
 * 抽蛋动画刻意收敛：蛋落进巢里晃两下，不做稀有度闪光/悬念累积那种开箱观感。
 * 孵化完成（浇灌到达成本的那一刻）必定弹起名弹窗——CJ 明确要求这一步不能做成静默流程，
 * 所以弹窗没有背景点击关闭/右上角关闭按钮，只能点「确认」（默认名已预填，直接确认也行）。
 * 弹窗渲染在函数末尾、跟卡片状态分支平级——孵化那一刻 egg 会立刻变 null，
 * 如果把弹窗塞进「有蛋」那个分支里，孵化瞬间组件切到别的分支就会连弹窗一起消失。
 */
export function EggCard() {
  const { t } = useTranslation()
  const {
    egg,
    cost,
    advanceChunk,
    canAdvance,
    collectionComplete,
    canDraw,
    drawEgg,
    advanceEgg,
    renameCreature,
  } = useEggStore()

  const [justDrawn, setJustDrawn] = useState(false)
  const drawTimerRef = useRef<number | undefined>(undefined)
  const [hatchedSpecies, setHatchedSpecies] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => () => window.clearTimeout(drawTimerRef.current), [])

  function handleDraw() {
    if (drawEgg()) {
      setJustDrawn(true)
      window.clearTimeout(drawTimerRef.current)
      drawTimerRef.current = window.setTimeout(() => setJustDrawn(false), DRAW_ANIMATION_MS)
    }
  }

  function handleAdvance() {
    const hatched = advanceEgg()
    if (hatched) {
      setHatchedSpecies(hatched)
      setNameInput(t(CREATURES[hatched].defaultNameKey))
    }
  }

  function handleConfirmName() {
    if (!hatchedSpecies) {
      return
    }
    renameCreature(hatchedSpecies, nameInput)
    setHatchedSpecies(null)
  }

  let card: ReactNode

  if (collectionComplete && !egg) {
    card = (
      <div className="rounded-[20px] bg-card px-5 py-4 text-center shadow-soft">
        <p className="text-sm font-medium text-ink-800">{t('home.collectionCompleteTitle')}</p>
        <p className="mt-1 text-xs text-ink-400">{t('home.collectionCompleteHint')}</p>
      </div>
    )
  } else if (!egg) {
    card = (
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
  } else {
    const remaining = Math.max(0, cost - egg.progress)
    const progressPct = Math.round((egg.progress / cost) * 100)

    card = (
      <button
        type="button"
        disabled={!canAdvance || justDrawn}
        onClick={handleAdvance}
        className="flex items-center gap-4 rounded-[20px] bg-card px-5 py-4 text-left shadow-soft disabled:opacity-70"
      >
        <div className={`relative flex-shrink-0 ${justDrawn ? 'animate-egg-pop' : ''}`}>
          <img
            src={eggAsset(egg.species)}
            alt={t(CREATURES[egg.species].speciesKey)}
            className="h-14 w-14 object-contain"
            draggable={false}
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
            <span className="font-medium text-ink-800">{t(CREATURES[egg.species].speciesKey)}</span>
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

  return (
    <>
      {card}
      {hatchedSpecies && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(68,62,51,0.35)] p-4 sm:items-center">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[24px] bg-card p-6 text-center shadow-soft">
            <img
              src={creatureAsset(hatchedSpecies, 'joy')}
              alt={t(CREATURES[hatchedSpecies].speciesKey)}
              className="h-28 w-auto object-contain"
              draggable={false}
            />
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">
                {t('home.hatchTitle', { species: t(CREATURES[hatchedSpecies].speciesKey) })}
              </p>
              <p className="mt-1 text-sm text-ink-500">{t('home.hatchSubtitle')}</p>
            </div>
            <label className="flex w-full flex-col gap-1.5 text-left">
              <span className="text-sm font-medium text-ink-700">{t('home.hatchNameLabel')}</span>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={12}
                className="rounded-xl bg-cream-100 px-3 py-2.5 text-base text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
              />
            </label>
            <button
              type="button"
              disabled={!nameInput.trim()}
              onClick={handleConfirmName}
              className="w-full rounded-2xl bg-gold-500 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600 disabled:opacity-40"
            >
              {t('home.hatchConfirmButton')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
