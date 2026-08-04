import {
  REFLECTION_FULL_REWARD,
  REFLECTION_PARTIAL_REWARD_PER_QUESTION,
  REFLECTION_QUESTION_COUNT,
} from '@/config/gameBalance'
import type { ReflectionAnswers } from '@/types'

/**
 * 本地设备日期 key（YYYY-MM-DD），刻意不用 toISOString()（那是 UTC），
 * 保证「跨零点提交以本地设备日期为准」（PRD 3.3.2）。
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isFilled(value: string): boolean {
  return value.trim().length > 0
}

export function countFilledAnswers(answers: ReflectionAnswers): number {
  return [answers.gratitude, answers.learning, answers.improvement].filter(
    isFilled,
  ).length
}

/**
 * 三问全填给全额奖励；部分完成按每题固定值累加。
 * 每题最少 1 个字符即可算完成，不设最低字数（PRD 3.3.2）。
 */
export function calculateReflectionReward(answers: ReflectionAnswers): number {
  const filledCount = countFilledAnswers(answers)
  if (filledCount === REFLECTION_QUESTION_COUNT) {
    return REFLECTION_FULL_REWARD
  }
  return filledCount * REFLECTION_PARTIAL_REWARD_PER_QUESTION
}

export function isReflectionSubmittable(answers: ReflectionAnswers): boolean {
  return countFilledAnswers(answers) > 0
}

export const EMPTY_REFLECTION_ANSWERS: ReflectionAnswers = {
  gratitude: '',
  learning: '',
  improvement: '',
}
