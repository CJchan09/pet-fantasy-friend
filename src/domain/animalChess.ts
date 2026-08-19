import { ANIMAL_CHESS_DAILY_WIN_LIMIT, ANIMAL_CHESS_WIN_REWARD } from '@/config/gameBalance'
import { getLocalDateKey } from './reflection'
import type { FocusSessionRecord } from '@/types'

/**
 * 斗兽棋结果上报（来自 iframe 里嵌入的游戏，见 public/games/dou-shou-qi/）：
 * { winner: 'red'|'blue', aiOwner: 'red'|'blue'|null }
 * aiOwner 为 null 表示本地双人对战（跟身边朋友玩），此时随便谁赢都算一局完整对局。
 * aiOwner 不为 null 时是人机对战，只有「人赢了」才算数——AI 赢了不奖励。
 */
export interface AnimalChessResult {
  winner: 'red' | 'blue'
  aiOwner: 'red' | 'blue' | null
}

export function isHumanWin(result: AnimalChessResult): boolean {
  if (result.aiOwner === null) {
    return true // 本地双人对战，任何一方赢都算一局
  }
  return result.winner !== result.aiOwner
}

// 复用 FocusSessionRecord 的 {date, completedAt} 结构，语义相同（今日第几次）
export type AnimalChessWinRecord = FocusSessionRecord

export function countAnimalChessWinsToday(
  wins: AnimalChessWinRecord[],
  today = getLocalDateKey(),
): number {
  return wins.filter((w) => w.date === today).length
}

/** isAdmin：CJ 的测试账号跳过每日上限（Supabase profiles.role='admin'，见 useGameStore.ts） */
export function canRewardAnimalChessWinToday(
  wins: AnimalChessWinRecord[],
  today = getLocalDateKey(),
  isAdmin = false,
): boolean {
  return isAdmin || countAnimalChessWinsToday(wins, today) < ANIMAL_CHESS_DAILY_WIN_LIMIT
}

export interface RecordAnimalChessResultOutcome {
  wins: AnimalChessWinRecord[]
  stardustEarned: number
}

/**
 * 处理一局结果。输了不扣分（本函数只在赢的时候才有副作用，
 * 调用方对「输」的结果直接不调用记账逻辑即可）。
 */
export function recordAnimalChessWin(
  wins: AnimalChessWinRecord[],
  today = getLocalDateKey(),
  isAdmin = false,
): RecordAnimalChessResultOutcome {
  if (!canRewardAnimalChessWinToday(wins, today, isAdmin)) {
    return { wins, stardustEarned: 0 }
  }
  return {
    wins: [...wins, { date: today, completedAt: new Date().toISOString() }],
    stardustEarned: ANIMAL_CHESS_WIN_REWARD,
  }
}
