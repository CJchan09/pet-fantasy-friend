import { useTranslation } from 'react-i18next'

export type TabKey = 'today' | 'focus' | 'companion' | 'insights'

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; icon: string; labelKey: string }[] = [
  { key: 'today', icon: '☀', labelKey: 'tabs.today' },
  { key: 'focus', icon: '◷', labelKey: 'tabs.focus' },
  { key: 'companion', icon: '❀', labelKey: 'tabs.companion' },
  { key: 'insights', icon: '◔', labelKey: 'tabs.insights' },
]

/**
 * 手机底部四 Tab（方案文档 §10.3）。AI 刻意不占一个 Tab——
 * 它以按钮形式出现在 Today / Todo / Insights 的具体位置，不做成聊天机器人入口。
 * pb 里的 env(safe-area-inset-bottom) 是给 Android/iOS 手势条留位，Web 上等于 0。
 */
export function TabBar({ active, onChange }: TabBarProps) {
  const { t } = useTranslation()

  return (
    <nav className="sticky bottom-0 z-20 border-t border-line/70 bg-cream-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex w-full max-w-md">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          return (
            <li key={tab.key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                  isActive ? 'text-gold-700' : 'text-ink-400'
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {t(tab.labelKey)}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
