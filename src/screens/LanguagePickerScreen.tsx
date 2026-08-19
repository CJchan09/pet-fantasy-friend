import { useTranslation } from 'react-i18next'
import { useLanguageGateStore } from '@/store/useLanguageGateStore'

/**
 * 进 App 最前面先问语言（CJ 2026-08-19 反馈），选了之后全程用这个语言——
 * 后面的登录页/起始三选一都不用再各自摆一个语言切换 button，统一走 Settings 里改。
 * 两个按钮文案故意不走 t()：这一步本身就是在问「你要选哪个语言」，
 * 两种语言的名字都用各自的原生写法显示，不受当前 i18n 状态影响。
 */
export function LanguagePickerScreen() {
  const { i18n } = useTranslation()
  const chooseLanguage = useLanguageGateStore((s) => s.chooseLanguage)

  function handlePick(lang: 'zh-CN' | 'en') {
    void i18n.changeLanguage(lang)
    chooseLanguage()
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-8 px-4 py-8 text-center">
      <h1 className="font-display text-xl font-semibold text-ink-900">
        幻宠伙伴 · Pet Fantasy Friend
      </h1>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => handlePick('zh-CN')}
          className="rounded-2xl bg-gold-500 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600"
        >
          简体中文
        </button>
        <button
          type="button"
          onClick={() => handlePick('en')}
          className="rounded-2xl border border-line bg-card py-3.5 text-base font-medium text-ink-700 shadow-soft"
        >
          English
        </button>
      </div>
    </div>
  )
}
