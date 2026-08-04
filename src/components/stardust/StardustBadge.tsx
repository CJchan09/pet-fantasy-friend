import { useTranslation } from 'react-i18next'

interface StardustBadgeProps {
  balance: number
}

export function StardustBadge({ balance }: StardustBadgeProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2 rounded-full bg-card px-4 py-1.5 shadow-soft">
      <span className="text-sm text-gold-500" aria-hidden="true">
        ✦
      </span>
      <span className="font-display text-lg font-semibold text-gold-700">
        {balance.toLocaleString()}
      </span>
      <span className="sr-only">{t('home.stardustLabel')}</span>
    </div>
  )
}
