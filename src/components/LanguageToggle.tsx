import { useTranslation } from 'react-i18next'

/** 中/英切换。语言选择由 i18next-browser-languagedetector 持久化到 localStorage */
export function LanguageToggle() {
  const { i18n } = useTranslation()
  const isZh = i18n.resolvedLanguage === 'zh-CN'

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(isZh ? 'en' : 'zh-CN')}
      className="rounded-full bg-chip px-3 py-1.5 text-xs font-medium text-ink-600"
      aria-label={isZh ? 'Switch to English' : '切换到中文'}
    >
      {isZh ? 'EN' : '中'}
    </button>
  )
}
