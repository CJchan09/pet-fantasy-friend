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

/** 提醒时间，24 小时制 "HH:MM"（本地设备时区）。null = 不提醒 */
export type ReminderTime = string | null

/**
 * 每日习惯。第一版只做「每天一次」，不做指定星期/每周 N 次/每月周期
 * （方案文档 §5.3 明确划在第一版之外）。
 */
export interface HabitItem {
  id: string
  title: string
  /** 每日提醒时间；null = 这个 Habit 不提醒 */
  reminderTime: ReminderTime
  /** 停用的 Habit 不出现在今日清单，也不再提醒，但历史完成记录保留 */
  active: boolean
  createdAt: string
}

/**
 * Habit 完成记录。(habitId, date) 唯一——同一天重复点击不重复发星尘，
 * 对应方案文档 §12 里 habit_completions 的唯一约束，先在客户端落地同一条规则。
 */
export interface HabitCompletion {
  habitId: string
  /** 本地设备日期 YYYY-MM-DD */
  date: string
  stardustAwarded: number
  completedAt: string
  /**
   * 用户当天取消了勾选。记录**不删除**，因为 stardustAwarded 已经发出去了不回收；
   * 保留这条已消耗的额度，防止「勾→取消→再勾」无限刷过每日上限。
   * 撤销后不算「今天完成过」，也不计入本周完成次数。
   */
  revoked?: boolean
}

export interface TaskItem {
  id: string
  label: string
  done: boolean
  /** 是否已经发过星尘；一旦为 true 永远为 true，防止反复勾选/取消刷星尘 */
  rewarded: boolean
  createdAt: string
  /** 首次发放星尘那天的本地日期（YYYY-MM-DD），用于计算「今日已完成几项」的每日上限 */
  rewardedDate?: string
  /** 可选截止日期 YYYY-MM-DD；null/undefined = 没有截止日 */
  dueDate?: string | null
  /** 可选提醒时间 "HH:MM"，只在有 dueDate 时有意义 */
  reminderTime?: ReminderTime
  /** 完成时间戳，用于「已完成」历史区排序；旧存档没有这个字段 */
  completedAt?: string
  /** 用户置顶：无论截止日是哪天都出现在 Today */
  pinned?: boolean
}

export type FocusLinkKind = 'todo' | 'habit'

/** 专注可选关联的目标（方案文档 §7.1：允许但不强制） */
export interface FocusLink {
  kind: FocusLinkKind
  id: string
  /** 关联时的标题快照——原任务被删掉后统计里仍然看得懂 */
  label: string
}

export interface FocusSessionRecord {
  /** 本地设备日期，用于计算「今日第几次」 */
  date: string
  completedAt: string
  /** 用户选择的时长（分钟）。旧存档没有这个字段，迁移时按旧固定值 25 补 */
  plannedMinutes?: number
  /** 实际完整跑满的分钟数；中途取消不会产生记录，所以正常等于 plannedMinutes */
  completedMinutes?: number
  /** 本次实发星尘（受每日上限影响，可能小于公式值） */
  stardustAwarded?: number
  link?: FocusLink | null
}

export interface EggState {
  /**
   * 抽蛋时就确定的生物 slug——蛋本身决定孵出什么，孵化只是把它养出来。
   * UI 上直接显示对应生物的蛋美术和名字（CJ 2026-08-11 改版：不做「神秘蛋」悬念）。
   */
  species: string
  /** 已投入的星尘，达到该生物的孵化成本即孵出 */
  progress: number
}

/**
 * 通知偏好。globalEnabled 是总开关，关掉之后单个 Habit/Todo 的 reminderTime 依然保留，
 * 只是不再调度——方案文档 §5.2「必须支持关闭单个 Habit 提醒及全局提醒」。
 */
export interface NotificationSettings {
  globalEnabled: boolean
  habitRemindersEnabled: boolean
  todoRemindersEnabled: boolean
}

/**
 * AI 数据授权。方案文档 §9.2 红线：反思正文默认**禁止**发送给 AI，
 * 必须用户主动打开；关闭后立即停止发送。默认值只能是 false。
 */
export interface AiConsentSettings {
  allowReflectionText: boolean
}

export const CURRENT_SCHEMA_VERSION = 6

/** 已拥有生物的记录：key 存在即代表拥有，nickname 是孵化起名弹窗里确认的名字（默认用生物原名） */
export interface OwnedCreatureRecord {
  nickname: string
}

export interface AppState {
  schemaVersion: number
  pet: PetState
  stardust: StardustState
  reflections: ReflectionEntry[]
  draftReflection: ReflectionDraft | null
  /** 首次三选一起始宠物是否已完成 */
  hasChosenStarter: boolean
  /** 上一次「成长行为」（Habit/Todo/专注/反思）时间戳，驱动宠物状态机；喂养、小游戏都不算成长行为 */
  lastGrowthAt: string | null
  tasks: TaskItem[]
  habits: HabitItem[]
  habitCompletions: HabitCompletion[]
  focusSessions: FocusSessionRecord[]
  egg: EggState | null
  /** species -> 拥有记录（含昵称），图鉴用 */
  ownedCreatures: Record<string, OwnedCreatureRecord>
  /** 累计反思次数（不受编辑影响，只在首次提交时 +1），传说解锁判定用 */
  reflectionCount: number
  /** 存档首次创建时间，用于「使用满 7 天提示导出备份」（PRD 3.3.7） */
  firstUsedAt: string
  /** 是否导出过存档；导出过就不用再提醒 */
  hasExportedSave: boolean
  /** 斗兽棋赢局记录（只记赢，输不扣分也不用记），用于每日奖励上限 */
  animalChessWins: FocusSessionRecord[]
  notifications: NotificationSettings
  aiConsent: AiConsentSettings
}
