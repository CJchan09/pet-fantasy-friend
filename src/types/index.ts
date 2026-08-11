export interface ReflectionAnswers {
  gratitude: string
  learning: string
  improvement: string
}

export type MoodValue = 1 | 2 | 3 | 4 | 5

export interface ReflectionEntry {
  /** 本地设备日期，格式 YYYY-MM-DD，跨零点以此为准归属 */
  date: string
  answers: ReflectionAnswers
  mood?: MoodValue
  stardustAwarded: number
  updatedAt: string
}

export interface ReflectionDraft {
  date: string
  answers: ReflectionAnswers
  mood?: MoodValue
}

export interface PetState {
  name: string
  /** 生物种类 slug，对应 config/creatures.ts */
  species: string
  intimacy: number
  level: number
}

export interface StardustState {
  balance: number
}

export type CreatureRarity = 'common' | 'rare' | 'legendary'

export interface TaskItem {
  id: string
  label: string
  done: boolean
  /** 是否已经发过星尘；一旦为 true 永远为 true，防止反复勾选/取消刷星尘 */
  rewarded: boolean
  createdAt: string
  /** 首次发放星尘那天的本地日期（YYYY-MM-DD），用于计算「今日已完成几项」的每日上限 */
  rewardedDate?: string
}

export interface FocusSessionRecord {
  /** 本地设备日期，用于计算「今日第几次」 */
  date: string
  completedAt: string
}

export interface EggState {
  /**
   * 抽蛋时就确定的生物 slug——蛋本身决定孵出什么，孵化只是把它养出来。
   * UI 上对玩家保密（显示「神秘的蛋」），孵化完成才揭晓。
   */
  species: string
  /** 已投入的星尘，达到该生物的孵化成本即孵出 */
  progress: number
}

export const CURRENT_SCHEMA_VERSION = 4

export interface AppState {
  schemaVersion: number
  pet: PetState
  stardust: StardustState
  reflections: ReflectionEntry[]
  draftReflection: ReflectionDraft | null
  /** 首次三选一起始宠物是否已完成 */
  hasChosenStarter: boolean
  /** 上一次「成长行为」（反思/任务/专注）时间戳，驱动宠物状态机；喂养、小游戏都不算成长行为 */
  lastGrowthAt: string | null
  tasks: TaskItem[]
  focusSessions: FocusSessionRecord[]
  egg: EggState | null
  /** species -> 是否已拥有，图鉴用 */
  ownedCreatures: Record<string, boolean>
  /** 累计反思次数（不受编辑影响，只在首次提交时 +1），传说解锁判定用 */
  reflectionCount: number
  /** 存档首次创建时间，用于「使用满 7 天提示导出备份」（PRD 3.3.7） */
  firstUsedAt: string
  /** 是否导出过存档；导出过就不用再提醒 */
  hasExportedSave: boolean
  /** 斗兽棋赢局记录（只记赢，输不扣分也不用记），用于每日奖励上限 */
  animalChessWins: FocusSessionRecord[]
}
