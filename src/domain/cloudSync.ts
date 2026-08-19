import type { AppState } from '@/types'

export interface LoginMergeResult {
  resolved: AppState
  /** 'local' = 本机存档刚被搬上账号（账号云端原本是空的）；'cloud' = 保留账号原有进度，本机数据不覆盖 */
  source: 'local' | 'cloud'
}

/**
 * 登录时决定用哪份存档（CJ 2026-08-12 确认的方案）：
 * 账号云端还没有任何存档（没做过起始三选一）→ 把本机存档搬上去；
 * 账号云端已经有进度 → 保留云端，本机数据不覆盖（换设备登录老账号时不会被本机的空/旧数据冲掉）。
 */
export function resolveLoginMerge(
  localState: AppState,
  cloudState: AppState | null,
): LoginMergeResult {
  if (!cloudState || !cloudState.hasChosenStarter) {
    return { resolved: localState, source: 'local' }
  }
  return { resolved: cloudState, source: 'cloud' }
}
