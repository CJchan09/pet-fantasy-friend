import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCoachStatus } from './useAiCoach'

interface AiCoachPanelProps {
  title: string
  status: AiCoachStatus
  payloadSummary: string[]
  errorCode: string | null
  providerId: 'mock' | 'edge'
  onConfirm: () => void
  onRetry: () => void
  onClose: () => void
  children?: ReactNode
}

/**
 * AI 建议面板的统一外壳：确认要发送什么 → 加载 → 结果 / 错误。
 *
 * 两条产品红线在这里可见：
 * 1. 请求前一定先列出本次会发送的数据（§9.2）。
 * 2. 结果只是建议，写入数据必须由用户再点一次确认——本组件自己**不碰任何 store**（§9.1）。
 */
export function AiCoachPanel({
  title,
  status,
  payloadSummary,
  errorCode,
  providerId,
  onConfirm,
  onRetry,
  onClose,
  children,
}: AiCoachPanelProps) {
  const { t } = useTranslation()

  if (status === 'idle') {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-ink-900">{title}</h3>
          {providerId === 'mock' && (
            <p className="text-[11px] text-ink-400">{t('ai.mockBadge')}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="text-ink-300 hover:text-ink-500"
        >
          ✕
        </button>
      </div>

      {status === 'confirming' && (
        <>
          <div className="rounded-xl bg-cream-100 p-3">
            <p className="mb-1.5 text-xs font-medium text-ink-600">{t('ai.willSendTitle')}</p>
            <ul className="flex flex-col gap-0.5 text-[11px] text-ink-500">
              {payloadSummary.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-ink-400">{t('ai.willNotSendHint')}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-medium text-[#FFFDF6]"
            >
              {t('ai.confirmSendButton')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-chip px-4 py-2.5 text-sm text-ink-600"
            >
              {t('common.cancel')}
            </button>
          </div>
        </>
      )}

      {status === 'loading' && (
        <p className="py-6 text-center text-sm text-ink-400">{t('ai.loading')}</p>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-600">{t(`ai.error.${errorCode ?? 'unavailable'}`)}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-medium text-[#FFFDF6]"
            >
              {t('ai.retryButton')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-chip px-4 py-2.5 text-sm text-ink-600"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {status === 'done' && children}
    </section>
  )
}
