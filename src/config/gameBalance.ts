/**
 * 星尘经济与养成数值 —— 全部数值集中于此，验收时可直接核对本文件。
 * 来源：docs/产品进化方案_习惯Todo专注AI与Android_2026-08-29.md §7 + CJ 2026-08-29 确认的「方案A 温和通缩」。
 *
 * 定位变化（v2 经济）：Habit / Todo / Focus 成为核心产出，反思降为可选的晚间补充。
 * 计价锚点：**专注 5 分钟 = 1 星尘**。其余所有产出都以「等价多少分钟专注」来校准，
 * 保证用户不会因为「刷小 Todo 比专注划算」而放弃真正的深度工作。
 */

// ── 专注（核心，计价锚点）────────────────────────────────────────────────
/** 每满多少分钟给 1 星尘；不足一档不进位（floor） */
export const FOCUS_MINUTES_PER_STARDUST = 5
export const FOCUS_MIN_MINUTES = 5
export const FOCUS_MAX_MINUTES = 180
/** 时长选择步进；自定义滑杆与快捷按钮都必须落在这个步进上 */
export const FOCUS_STEP_MINUTES = 5
/** 快捷时长按钮（方案文档 §7.1） */
export const FOCUS_QUICK_MINUTES = [5, 10, 15, 25, 30, 45, 60] as const
export const FOCUS_DEFAULT_MINUTES = 25
/** 每日专注星尘上限（36 = 180 分钟，等于一次最长专注的量，正常用户几乎碰不到） */
export const FOCUS_DAILY_CAP = 36

// ── Habit（核心）────────────────────────────────────────────────────────
/** 每个 Habit 每天最多完成一次，一次 5 星尘（≈25 分钟专注） */
export const HABIT_REWARD_PER_COMPLETION = 5
/** 每日 Habit 星尘上限（25 = 5 个 Habit 全勾） */
export const HABIT_DAILY_CAP = 25
/** 单个用户最多建几个每日 Habit——防止建 50 个「喝一口水」刷分 */
export const HABIT_MAX_ACTIVE = 12

// ── Todo（核心）────────────────────────────────────────────────────────
/** 每项 4 星尘（≈20 分钟专注）——刻意低于 Habit，Todo 拆得再碎也不比专注划算 */
export const TASK_REWARD_PER_ITEM = 4
export const TASK_FREE_DAILY_ITEM_LIMIT = 5
export const TASK_DAILY_CAP = TASK_REWARD_PER_ITEM * TASK_FREE_DAILY_ITEM_LIMIT

// ── 反思（可选）────────────────────────────────────────────────────────
export const REFLECTION_QUESTION_COUNT = 3
export const REFLECTION_FULL_REWARD = 15
export const REFLECTION_PARTIAL_REWARD_PER_QUESTION = 5
export const REFLECTION_DAILY_SUBMISSIONS = 1
export const REFLECTION_DAILY_CAP = REFLECTION_FULL_REWARD

// P2，本阶段未实现，仅保留常量供未来平衡校验复用
export const IDLE_HOURLY_CAP = 0
export const IDLE_DAILY_CAP = 0

/**
 * 平衡红线（新经济）——对应测试见 __tests__/gameBalance.test.ts，改任何数值前先看这三条：
 *
 * 1. 核心产出（Habit+Todo+Focus）必须严格大于可选产出（反思）。
 *    产品要培养的是「今天真的做了事」，不是「今天写了段字」。
 * 2. Todo 日上限必须严格小于 Focus 日上限。
 *    否则用户会把一件事拆成 5 个 Todo 刷分，专注失去价值（方案文档 §7.2 明确点名的风险）。
 * 3. 任何单一来源都不能超过总天花板的 40%。
 */
export const CORE_SOURCES_DAILY_CAP = FOCUS_DAILY_CAP + HABIT_DAILY_CAP + TASK_DAILY_CAP
export const OPTIONAL_SOURCES_DAILY_CAP = REFLECTION_DAILY_CAP + IDLE_DAILY_CAP
/** 一天理论最多能赚多少（不含 admin 跳过上限） */
export const TOTAL_DAILY_CAP = CORE_SOURCES_DAILY_CAP + OPTIONAL_SOURCES_DAILY_CAP
export const MAX_SINGLE_SOURCE_SHARE = 0.4

// ── 消耗端 ─────────────────────────────────────────────────────────────
/**
 * 方案A 决定：产出天花板从旧版 150 降到 96，但**消耗端数值保持不变**。
 * 结果是养成节奏放慢约 1.5 倍，正好对上方案文档 §15 的护栏
 * 「宠物成长速度不能快到新用户数日内消耗完主要内容」。
 */
export const FEED_STARDUST_COST = 10
export const FEED_INTIMACY_GAIN = 10
export const INTIMACY_PER_LEVEL = 50
export const MAX_PET_LEVEL = 50

/**
 * 孵化系统数值：普通蛋 60（≈新经济下 1 天产出的 2/3），稀有蛋 150（≈1.5 天），
 * 体现稀有度差异。「浇灌」按钮每次花固定量推进进度条。
 */
export const EGG_COMMON_COST = 60
export const EGG_RARE_COST = 150
export const EGG_ADVANCE_CHUNK = 20
export const EGG_SLOT_COUNT = 1

/** 传说生物解锁：累计 30 次每日反思，不依赖概率（PRD 3.3.4 原文数字） */
export const LEGENDARY_UNLOCK_REFLECTION_COUNT = 30

/**
 * 宠物状态机（PRD 3.3.3）：活跃 -[2天无成长行为]-> 疲倦 -[再3天，累计5天]-> 沉睡。
 * 天数差计算时钳位在 >=0，防止系统时间被回拨产生负数从而绕过或提前触发状态。
 * 「成长行为」在新经济下 = 完成 Habit / Todo / Focus / 反思，四者任一。
 */
export const PET_TIRED_AFTER_DAYS = 2
export const PET_DORMANT_AFTER_DAYS = 5

/**
 * 斗兽棋小游戏赢局奖励。
 * ⚠️ 星尘原则：星尘只能靠真实的成长行为赚取。这条奖励是例外，数值刻意压到最低。
 * 新经济下同比缩小（旧 10 → 3），否则赢一局 = 50 分钟专注，会变成最划算的刷币入口。
 * 不算「成长行为」，不会触发宠物状态机唤醒（见 store/useGameStore.ts）。
 */
export const ANIMAL_CHESS_WIN_REWARD = 3
export const ANIMAL_CHESS_DAILY_WIN_LIMIT = 2
