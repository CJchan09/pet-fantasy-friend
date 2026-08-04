import { PET_DORMANT_AFTER_DAYS, PET_TIRED_AFTER_DAYS } from '@/config/gameBalance'

export type PetLifecycleStatus = 'active' | 'tired' | 'dormant'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * 宠物永不删除，只会「沉睡」（Claude_Code_Prompt 原则 1）。
 * 活跃 -[2天无成长行为]-> 疲倦 -[再3天，累计5天]-> 沉睡；完成任意成长行为立即恢复活跃。
 *
 * 天数差钳位在 >=0：系统时间被回拨时 lastGrowthAt 可能「晚于」now，
 * 此时不推进状态（也不产出任何东西），但不做任何惩罚或指控性提示（PRD 5.3 风险 #4）。
 */
export function getLifecycleStatus(
  lastGrowthAt: string | null,
  now: Date = new Date(),
): PetLifecycleStatus {
  if (!lastGrowthAt) {
    return 'active'
  }
  const last = new Date(lastGrowthAt).getTime()
  const elapsedMs = now.getTime() - last
  const elapsedDays = Math.max(0, elapsedMs / MS_PER_DAY)

  if (elapsedDays >= PET_DORMANT_AFTER_DAYS) {
    return 'dormant'
  }
  if (elapsedDays >= PET_TIRED_AFTER_DAYS) {
    return 'tired'
  }
  return 'active'
}
