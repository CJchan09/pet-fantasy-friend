import { useGameStore } from './useGameStore'
import { useAuthStore } from './useAuthStore'
import { canRewardAnimalChessWinToday, countAnimalChessWinsToday } from '@/domain/animalChess'
import { ANIMAL_CHESS_DAILY_WIN_LIMIT, ANIMAL_CHESS_WIN_REWARD } from '@/config/gameBalance'

/** 按域派生的选择器：斗兽棋「今日次数」记账部分（沿用 useFocusStore 的写法） */
export function useAnimalChessStore() {
  const animalChessWins = useGameStore((s) => s.state.animalChessWins)
  const recordAnimalChessResult = useGameStore((s) => s.recordAnimalChessResult)
  const isAdmin = useAuthStore((s) => s.role === 'admin')

  return {
    winsToday: countAnimalChessWinsToday(animalChessWins),
    dailyLimit: ANIMAL_CHESS_DAILY_WIN_LIMIT,
    rewardPerWin: ANIMAL_CHESS_WIN_REWARD,
    /** UI 判断「今天还能不能领」要用这个，不要直接拿 winsToday 跟 dailyLimit 比——admin 账号会跳过 */
    canWin: canRewardAnimalChessWinToday(animalChessWins, undefined, isAdmin),
    recordAnimalChessResult,
  }
}
