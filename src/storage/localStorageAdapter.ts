import { CURRENT_SCHEMA_VERSION, type AppState } from '@/types'
import { CREATURES, DEFAULT_SPECIES } from '@/config/creatures'

/**
 * 全部数据只存 localStorage，不发起任何网络请求（PRD 5.1 / 隐私红线）。
 */
export const STORAGE_KEY = 'pet-fantasy-friend:save'

export function createDefaultState(): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pet: {
      name: CREATURES[DEFAULT_SPECIES].defaultName,
      species: DEFAULT_SPECIES,
      intimacy: 0,
      level: 1,
    },
    stardust: {
      balance: 0,
    },
    reflections: [],
    draftReflection: null,
  }
}

/**
 * 未来 schemaVersion 升级时，在此按版本号做迁移分支。
 * 当前只有 v1，直接透传。
 */
function migrate(raw: unknown): AppState {
  const state = raw as Partial<AppState>
  if (!state || typeof state.schemaVersion !== 'number') {
    return createDefaultState()
  }
  // 预留：state.schemaVersion < CURRENT_SCHEMA_VERSION 时逐版本迁移
  const defaults = createDefaultState()
  return {
    ...defaults,
    ...state,
    // 嵌套对象深合并，旧存档缺少的新字段（如 pet.species）回退默认值
    pet: { ...defaults.pet, ...state.pet },
    stardust: { ...defaults.stardust, ...state.stardust },
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createDefaultState()
    }
    return migrate(JSON.parse(raw))
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function exportStateAsJson(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

/**
 * 导入校验：结构不对或 JSON 解析失败时返回 null，调用方负责向用户提示。
 */
export function importStateFromJson(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed.schemaVersion !== 'number' || !parsed.stardust || !parsed.pet) {
      return null
    }
    return migrate(parsed)
  } catch {
    return null
  }
}

/** localStorage 大致容量上限约 5-10MB，粗略估算当前存档大小（字节）供预警使用 */
export function estimateStateSizeBytes(state: AppState): number {
  return new Blob([JSON.stringify(state)]).size
}
