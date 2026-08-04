import { useTranslation } from 'react-i18next'
import { CREATURES, creatureAsset } from '@/config/creatures'
import { useDexStore } from '@/store/useDexStore'

interface DexScreenProps {
  onBack: () => void
}

const RARITY_DOT: Record<string, string> = {
  common: 'bg-ink-400',
  rare: 'bg-gold-500',
  legendary: 'bg-gold-700',
}

/** 图鉴：6 格网格，未拥有的显示剪影 + ？？？+ 稀有度标签 */
export function DexScreen({ onBack }: DexScreenProps) {
  const { t } = useTranslation()
  const { ownedCreatures } = useDexStore()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-6 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('dex.backButton')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
        <h1 className="text-[15px] font-medium text-ink-900">{t('dex.title')}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(CREATURES).map((creature) => {
          const owned = Boolean(ownedCreatures[creature.slug])
          return (
            <div
              key={creature.slug}
              className="flex flex-col items-center gap-2 rounded-[20px] bg-card p-4 shadow-soft"
            >
              <div className="flex h-20 w-20 items-center justify-center">
                {owned ? (
                  <img
                    src={creatureAsset(creature.slug, 'eyes-open')}
                    alt={t(creature.speciesKey)}
                    className="h-full w-auto object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-[40%] bg-ink-400/20" aria-hidden="true" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${RARITY_DOT[creature.rarity]}`} />
                <span className="text-[11px] uppercase tracking-wide text-ink-400">
                  {t(`dex.rarity.${creature.rarity}`)}
                </span>
              </div>
              <span className="text-sm font-medium text-ink-700">
                {owned ? t(creature.speciesKey) : t('dex.unknown')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
