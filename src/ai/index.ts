import { MockAiCoachProvider } from './mockProvider'
import type { AiCoachProvider } from './types'

/**
 * 当前生效的 Provider。Phase 1 固定用 Mock（CJ 2026-08-29 确认）。
 * 接真实 API 时只改这一行 —— 换成走 Supabase Edge Function 的 OpenAiCoachProvider，
 * UI、数据裁剪、确认流程全部不用动（方案文档 §9.3）。
 */
export const aiCoachProvider: AiCoachProvider = new MockAiCoachProvider()

export * from './types'
export { buildCoachPayload, describePayload } from './payload'
export { MockAiCoachProvider } from './mockProvider'
