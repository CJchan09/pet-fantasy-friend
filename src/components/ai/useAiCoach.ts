import { useCallback, useState } from 'react'
import { aiCoachProvider, buildCoachPayload, describePayload, AiCoachError } from '@/ai'
import type { AiCoachFeature, AiCoachResult } from '@/ai'
import { useGameStore } from '@/store/useGameStore'

export type AiCoachStatus = 'idle' | 'confirming' | 'loading' | 'done' | 'error'

/**
 * AI Coach 的一次请求生命周期。
 * 流程刻意是 idle → confirming（先给用户看本次会发送什么）→ loading → done。
 * 方案文档 §9.2 要求「每次请求前清楚显示本次会发送什么」，所以 confirming 这步不能省。
 */
export function useAiCoach(feature: AiCoachFeature) {
  const [status, setStatus] = useState<AiCoachStatus>('idle')
  const [result, setResult] = useState<AiCoachResult | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [targetTodoId, setTargetTodoId] = useState<string | undefined>(undefined)

  const state = useGameStore((s) => s.state)

  const payload = buildCoachPayload(state, { feature, targetTodoId })
  const payloadSummary = describePayload(payload)

  const prepare = useCallback((todoId?: string) => {
    setTargetTodoId(todoId)
    setResult(null)
    setErrorCode(null)
    setStatus('confirming')
  }, [])

  const run = useCallback(async () => {
    setStatus('loading')
    setErrorCode(null)
    try {
      const fresh = buildCoachPayload(useGameStore.getState().state, { feature, targetTodoId })
      const next =
        feature === 'breakdown'
          ? await aiCoachProvider.breakdown(fresh)
          : feature === 'planToday'
            ? await aiCoachProvider.planToday(fresh)
            : await aiCoachProvider.weeklyReview(fresh)
      setResult(next)
      setStatus('done')
    } catch (error) {
      setErrorCode(error instanceof AiCoachError ? error.code : 'unavailable')
      setStatus('error')
    }
  }, [feature, targetTodoId])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setErrorCode(null)
    setTargetTodoId(undefined)
  }, [])

  return {
    status,
    result,
    errorCode,
    payload,
    payloadSummary,
    providerId: aiCoachProvider.id,
    prepare,
    run,
    reset,
  }
}
