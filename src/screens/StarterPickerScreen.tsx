import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CREATURES, CREATURES_BY_RARITY, creatureAsset } from '@/config/creatures'
import { useGameStore } from '@/store/useGameStore'

/**
 * 首次进入：从 3 只 Common 生物三选一 + 命名（Roadmap v0.5）。
 * 老版本（阶段一线上用户）已经在养宠物了，迁移时 hasChosenStarter 会被设为 true，不会看到这一页。
 */
export function StarterPickerScreen() {
  const { t } = useTranslation()
  const chooseStarter = useGameStore((s) => s.chooseStarter)

  const [selected, setSelected] = useState(CREATURES_BY_RARITY.common[0])
  const [name, setName] = useState(CREATURES[selected].defaultName)

  function handleSelect(species: string) {
    setSelected(species)
    setName(CREATURES[species].defaultName)
  }

  function handleConfirm() {
    chooseStarter(selected, name)
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-ink-900">
          {t('starter.title')}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t('starter.subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {CREATURES_BY_RARITY.common.map((species) => {
          const creature = CREATURES[species]
          const isSelected = species === selected
          return (
            <button
              key={species}
              type="button"
              onClick={() => handleSelect(species)}
              className={`flex flex-col items-center gap-2 rounded-[20px] bg-card p-3 shadow-soft transition-transform ${
                isSelected ? 'scale-105 ring-2 ring-gold-500' : 'opacity-70'
              }`}
            >
              <img
                src={creatureAsset(species, 'eyes-open')}
                alt={t(creature.speciesKey)}
                className="h-20 w-auto object-contain"
                draggable={false}
              />
              <span className="text-xs font-medium text-ink-700">{t(creature.speciesKey)}</span>
            </button>
          )
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">{t('starter.nameLabel')}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          className="rounded-xl bg-cream-100 px-3 py-2.5 text-base text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
        />
      </label>

      <button
        type="button"
        disabled={!name.trim()}
        onClick={handleConfirm}
        className="rounded-2xl bg-gold-500 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600 disabled:opacity-40"
      >
        {t('starter.confirmButton')}
      </button>
    </div>
  )
}
