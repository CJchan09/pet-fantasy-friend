import { describe, expect, it } from 'vitest'
import {
  canRewardAnimalChessWinToday,
  countAnimalChessWinsToday,
  isHumanWin,
  recordAnimalChessWin,
  type AnimalChessWinRecord,
} from '../animalChess'
import { ANIMAL_CHESS_DAILY_WIN_LIMIT, ANIMAL_CHESS_WIN_REWARD } from '@/config/gameBalance'

const TODAY = '2026-08-10'

function winsToday(n: number): AnimalChessWinRecord[] {
  return Array.from({ length: n }, () => ({ date: TODAY, completedAt: '2026-08-10T00:00:00.000Z' }))
}

describe('isHumanWin', () => {
  it('人机对战：人赢了（winner 不是 AI 那方）算赢', () => {
    expect(isHumanWin({ winner: 'red', aiOwner: 'blue' })).toBe(true)
  })

  it('人机对战：AI 赢了不算数', () => {
    expect(isHumanWin({ winner: 'blue', aiOwner: 'blue' })).toBe(false)
  })

  it('本地双人对战（aiOwner 为 null）：任何一方赢都算', () => {
    expect(isHumanWin({ winner: 'red', aiOwner: null })).toBe(true)
    expect(isHumanWin({ winner: 'blue', aiOwner: null })).toBe(true)
  })
})

describe('recordAnimalChessWin 每日上限', () => {
  it('未达上限时发放奖励并记录', () => {
    const { wins, stardustEarned } = recordAnimalChessWin([], TODAY)
    expect(stardustEarned).toBe(ANIMAL_CHESS_WIN_REWARD)
    expect(wins).toHaveLength(1)
  })

  it('达到每日上限后不再发放', () => {
    const full = winsToday(ANIMAL_CHESS_DAILY_WIN_LIMIT)
    const { wins, stardustEarned } = recordAnimalChessWin(full, TODAY)
    expect(stardustEarned).toBe(0)
    expect(wins).toHaveLength(ANIMAL_CHESS_DAILY_WIN_LIMIT)
  })

  it('昨天的赢局不计入今天的上限', () => {
    const yesterday: AnimalChessWinRecord[] = [
      { date: '2026-08-09', completedAt: '2026-08-09T00:00:00.000Z' },
    ]
    expect(countAnimalChessWinsToday(yesterday, TODAY)).toBe(0)
    expect(canRewardAnimalChessWinToday(yesterday, TODAY)).toBe(true)
  })

  it('奖励数值明显低于反思等核心成长行为（产品原则约束，见 gameBalance.ts 注释）', () => {
    expect(ANIMAL_CHESS_WIN_REWARD).toBeLessThan(20)
  })
})
