import { useTranslation } from 'react-i18next'
import { ReflectionHistory } from '@/components/reflection/ReflectionHistory'
import { useReflectionStore } from '@/store/useReflectionStore'

interface ReflectionHistoryScreenProps {
  onBack: () => void
}

export function ReflectionHistoryScreen({ onBack }: ReflectionHistoryScreenProps) {
  const { t } = useTranslation()
  const { reflections } = useReflectionStore()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-8 pt-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('history.backButton')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
        <h1 className="text-[15px] font-medium text-ink-900">{t('history.title')}</h1>
      </header>
      <ReflectionHistory reflections={reflections} />
    </div>
  )
}
