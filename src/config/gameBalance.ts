/**
 * 星尘经济与养成数值 —— 全部数值集中于此，验收时可直接核对本文件。
 * 来源：docs/PRD.md 3.3.1 / docs/Claude_Code_Prompt.md 星尘经济表。
 */

export const REFLECTION_QUESTION_COUNT = 3
export const REFLECTION_FULL_REWARD = 40
export const REFLECTION_PARTIAL_REWARD_PER_QUESTION = 12
export const REFLECTION_DAILY_SUBMISSIONS = 1
export const REFLECTION_DAILY_CAP = 40

export const TASK_REWARD_PER_ITEM = 10
export const TASK_FREE_DAILY_ITEM_LIMIT = 5
export const TASK_DAILY_CAP = 50

export const FOCUS_REWARD_PER_SESSION = 15
export const FOCUS_SESSION_MINUTES = 25
export const FOCUS_DAILY_SESSION_LIMIT = 4
export const FOCUS_DAILY_CAP = 60

// P2，本阶段未实现，仅保留常量供未来平衡校验复用
export const IDLE_HOURLY_CAP = 2
export const IDLE_DAILY_CAP = 20

/**
 * 平衡红线（docs/PRD.md 3.3.1）：
 * 专注 + 挂机的合计日产出上限，必须严格小于 反思 + 任务 的合计日产出上限。
 * 反思与任务是产品要培养的行为，必须始终是最优路径。
 * 新增任何赚币方式前必须重算这条不等式 —— 对应测试见 __tests__/gameBalance.test.ts。
 */
export const SECONDARY_SOURCES_DAILY_CAP = FOCUS_DAILY_CAP + IDLE_DAILY_CAP
export const PRIMARY_SOURCES_DAILY_CAP = REFLECTION_DAILY_CAP + TASK_DAILY_CAP

// 喂养与升级：本阶段判断——花费星尘换取固定亲密度，达阈值升级（PRD 未给出具体数值，此为落地决定）
export const FEED_STARDUST_COST = 10
export const FEED_INTIMACY_GAIN = 10
export const INTIMACY_PER_LEVEL = 50
export const MAX_LEVEL_STAGE_ONE = 5 // 阶段一只做数值/文字标签展示，不含进化动画

/**
 * 孵化系统数值（PRD 3.3.4 只定了「不同蛋消耗不同星尘」的规则，没给具体数字，这里落地决定）：
 * 普通蛋约 1.5 天反思量，稀有蛋约 4 天反思量，体现稀有度差异。
 * 「浇灌」按钮沿用喂养同款交互——每次花固定量推进进度条。
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
 */
export const PET_TIRED_AFTER_DAYS = 2
export const PET_DORMANT_AFTER_DAYS = 5
