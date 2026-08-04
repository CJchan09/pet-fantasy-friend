import { useTranslation } from 'react-i18next'
import { ReflectionForm } from '@/components/reflection/ReflectionForm'
import { PetSprite } from '@/components/pet/PetSprite'
import { usePetStore } from '@/store/usePetStore'

interface ReflectionScreenProps {
  onBack: () => void
}

/**
 * 每日反思页（UI 规格 屏二）：顶栏返回 + 日期；宠物小幅露出（≤15%，仅陪伴感）；
 * 三问卡片 + 情绪条 + 提交按钮。
 */
export function ReflectionScreen({ onBack }: ReflectionScreenProps) {
  const { t, i18n } = useTranslation()
  const { pet } = usePetStore()

  const dateLabel = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-8 pt-4">
      {/* 顶栏 */}
      <header className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('reflection.backButton')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
        <span className="text-[15px] font-medium text-ink-900">{dateLabel}</span>
      </header>

      {/* 宠物陪伴条 —— 小幅露出，不抢焦点 */}
      <div className="mb-3 flex h-20 items-end justify-center overflow-hidden">
        <PetSprite
          species={pet.species}
          joy={false}
          alt={pet.name}
          className="h-24 w-auto translate-y-4 object-contain opacity-90"
        />
      </div>

      <ReflectionForm onSubmitted={onBack} />
    </div>
  )
}
