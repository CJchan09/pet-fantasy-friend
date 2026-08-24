import { useTranslation } from 'react-i18next'
import type { PetState } from '@/types'
import { CREATURES, DEFAULT_SPECIES } from '@/config/creatures'
import { levelProgress, petStageForLevel } from '@/domain/pet'
import type { PetLifecycleStatus } from '@/domain/petLifecycle'
import { PetSprite } from './PetSprite'

interface PetSceneProps {
  pet: PetState
  joy: boolean
  lifecycleStatus: PetLifecycleStatus
  canFeed: boolean
  feedCost: number
  onFeed: () => void
}

/** 星光粒子布局，位置/大小/透明度取自 handoff 设计稿 */
const PARTICLES = [
  { left: '22%', top: '18%', size: 14, opacity: 0.9, delay: '0s' },
  { left: '70%', top: '12%', size: 9, opacity: 0.55, delay: '0.8s' },
  { left: '80%', top: '34%', size: 12, opacity: 0.75, delay: '1.6s' },
  { left: '14%', top: '44%', size: 8, opacity: 0.5, delay: '2.4s' },
  { left: '47%', top: '14%', size: 10, opacity: 0.8, delay: '1.2s' },
  { left: '26%', top: '60%', size: 7, opacity: 0.5, delay: '2.0s' },
  { left: '74%', top: '56%', size: 9, opacity: 0.6, delay: '0.4s' },
  { left: '60%', top: '26%', size: 6, opacity: 0.6, delay: '2.8s' },
  { left: '33%', top: '30%', size: 6, opacity: 0.45, delay: '1.4s' },
]

/**
 * 宠物场景区：主视觉（UI 规格：占比不低于 50%）。
 * 径向暖光背景 + 星光粒子 + 宠物立绘 + 等级条 + 喂养入口。
 * 沉睡态：粒子停止、不做呼吸动画，召回文案基调是「它在等你」，绝不指责（PRD 3.3.3 硬性要求）。
 */
export function PetScene({ pet, joy, lifecycleStatus, canFeed, feedCost, onFeed }: PetSceneProps) {
  const { t } = useTranslation()
  const creature = CREATURES[pet.species] ?? CREATURES[DEFAULT_SPECIES]
  const progress = levelProgress(pet.intimacy)
  const stage = petStageForLevel(pet.level)
  const isDormant = lifecycleStatus === 'dormant'
  const isTired = lifecycleStatus === 'tired'

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-[20px] py-6 shadow-soft [background:radial-gradient(120%_90%_at_50%_20%,#FBF6EA_0%,#F1E7D2_55%,#E8DCC2_100%)]">
      {/* 星光粒子：沉睡时停止 */}
      {!isDormant && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="animate-twinkle absolute text-gold-500"
              style={{
                left: p.left,
                top: p.top,
                fontSize: p.size,
                opacity: isTired ? p.opacity * 0.4 : p.opacity,
                animationDelay: p.delay,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      )}

      {/* 场景氛围标签 */}
      <div className="absolute left-5 top-4 text-xs tracking-wide text-ink-500">
        {t(creature.sceneKey)}
      </div>

      {/* 宠物 */}
      <div
        className={`relative flex flex-col items-center ${isDormant ? '' : 'animate-breathe'}`}
      >
        <PetSprite
          species={pet.species}
          stage={stage}
          joy={joy}
          lifecycleStatus={lifecycleStatus}
          alt={pet.name}
          className="h-52 w-52 [filter:drop-shadow(0_24px_32px_rgba(90,78,55,0.18))] sm:h-64 sm:w-64 lg:h-72 lg:w-72"
        />
        <div className="-mt-3 h-5 w-40 [background:radial-gradient(50%_50%_at_50%_50%,rgba(90,78,55,0.16),transparent_70%)]" />
      </div>

      {/* 等级条 + 喂养 */}
      <div className="z-10 flex w-[85%] max-w-sm flex-col gap-2">
        <div className="flex items-center justify-between text-[13px] text-ink-600">
          <span className="font-medium">
            {pet.name} · {t(creature.speciesKey)}
          </span>
          <span>{t('home.levelLabel', { level: pet.level })}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(90,78,55,0.10)]">
          <div
            className="h-full rounded-full bg-gold-500 transition-[width] duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {isDormant && (
          <p className="text-center text-xs text-ink-500">{t('home.dormantHint')}</p>
        )}
        <button
          type="button"
          disabled={!canFeed}
          onClick={onFeed}
          className="mt-1 self-center rounded-2xl border border-line bg-card/80 px-5 py-2 text-[13px] font-medium text-ink-700 transition-opacity active:scale-[0.98] disabled:opacity-40"
        >
          {t('home.feedButton')} · {t('home.feedCost', { cost: feedCost })}
        </button>
      </div>
    </div>
  )
}
