import { useTranslation } from 'react-i18next'
import { useEggStore } from '@/store/useEggStore'
import { eggCost } from '@/domain/incubation'

/**
 * 孵化卡片：蛋用 CSS 画（渐变 + 圆角，照抄 handoff 稿写法），不是图片资源（没有蛋的美术）。
 * 可见进度条 + 确定性推进，不做开箱式随机悬念（Claude_Code_Prompt 原则 3）。
 */
export function EggCard() {
  const { t } = useTranslation()
  const { egg, cost, advanceChunk, canAdvance, advanceEgg, startNewEgg } = useEggStore()

  if (!egg) {
    return (
      <div className="rounded-[20px] bg-card px-5 py-4 shadow-soft">
        <p className="mb-3 text-sm font-medium text-ink-800">{t('home.eggStartTitle')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => startNewEgg('common')}
            className="flex-1 rounded-xl border border-line py-2 text-xs font-medium text-ink-700"
          >
            {t('home.eggStartCommon', { cost: eggCost('common') })}
          </button>
          <button
            type="button"
            onClick={() => startNewEgg('rare')}
            className="flex-1 rounded-xl border border-line py-2 text-xs font-medium text-ink-700"
          >
            {t('home.eggStartRare', { cost: eggCost('rare') })}
          </button>
        </div>
      </div>
    )
  }

  const remaining = Math.max(0, cost - egg.progress)
  const progressPct = Math.round((egg.progress / cost) * 100)

  return (
    <button
      type="button"
      disabled={!canAdvance}
      onClick={advanceEgg}
      className="flex items-center gap-4 rounded-[20px] bg-card px-5 py-4 text-left shadow-soft disabled:opacity-70"
    >
      <div
        className="h-11 w-9 flex-shrink-0 rounded-[50%_50%_48%_48%/58%_58%_44%_44%] [background:linear-gradient(160deg,#F2E9D5,#E0D3B4)] shadow-inner"
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-ink-800">
            {t(`home.eggLabel.${egg.rarity}`)}
          </span>
          <span className="text-ink-400">{t('home.eggRemaining', { count: remaining })}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(90,78,55,0.10)]">
          <div
            className="h-full rounded-full bg-gold-500 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[11px] text-ink-400">
          {canAdvance
            ? t('home.eggAdvanceHint', { cost: advanceChunk })
            : t('home.eggAdvanceNotEnoughHint')}
        </span>
      </div>
    </button>
  )
}
