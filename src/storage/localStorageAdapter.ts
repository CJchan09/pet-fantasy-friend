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
    hasChosenStarter: false,
    lastGrowthAt: null,
    tasks: [],
    focusSessions: [],
    egg: null,
    // 首次三选一之前不预先拥有任何生物；chooseStarter() 才会真正写入拥有关系
    ownedCreatures: {},
    reflectionCount: 0,
    firstUsedAt: new Date().toISOString(),
    hasExportedSave: false,
    animalChessWins: [],
  }
}

/**
 * 版本迁移在此按 schemaVersion 做分支。
 * v1 -> v2：新增 hasChosenStarter/lastGrowthAt/tasks/focusSessions/egg/ownedCreatures/reflectionCount。
 * v1 存档已经有一只在养的宠物（旧版没有三选一流程，直接给苔熊），迁移时视为「已完成起始选择」，
 * 否则线上现有玩家刷新会突然被打回三选一页面。
 * v2 -> v3：新增 animalChessWins（斗兽棋赢局记账），旧存档没有则回退空数组。
 */
function migrate(raw: unknown): AppState {
  const state = raw as Partial<AppState> & { pet?: Partial<AppState['pet']> }
  if (!state || typeof state.schemaVersion !== 'number') {
    return createDefaultState()
  }

  const defaults = createDefaultState()
  const isLegacyV1WithoutStarterFlag =
    state.schemaVersion < 2 && state.hasChosenStarter === undefined

  const mergedPet = { ...defaults.pet, ...state.pet }

  return {
    ...defaults,
    ...state,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    // 嵌套对象/数组深合并，旧存档缺少的新字段回退默认值
    pet: mergedPet,
    stardust: { ...defaults.stardust, ...state.stardust },
    tasks: state.tasks ?? defaults.tasks,
    focusSessions: state.focusSessions ?? defaults.focusSessions,
    animalChessWins: state.animalChessWins ?? defaults.animalChessWins,
    ownedCreatures:
      state.ownedCreatures && Object.keys(state.ownedCreatures).length > 0
        ? state.ownedCreatures
        : { [mergedPet.species]: true },
    hasChosenStarter: isLegacyV1WithoutStarterFlag ? true : (state.hasChosenStarter ?? false),
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
