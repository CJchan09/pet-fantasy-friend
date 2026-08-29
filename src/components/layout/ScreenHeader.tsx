import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
  action?: ReactNode
}

/** 各页统一的顶栏：有 onBack 就显示返回箭头，没有就只是标题 */
export function ScreenHeader({ title, subtitle, onBack, backLabel, action }: ScreenHeaderProps) {
  return (
    <header className="mb-3 flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel ?? title}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-medium text-ink-900">{title}</h1>
        {subtitle && <p className="truncate text-xs text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
