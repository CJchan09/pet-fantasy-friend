import { useGameStore } from './useGameStore'
import { countAnimalChessWinsToday } from '@/domain/animalChess'
import { ANIMAL_CHESS_DAILY_WIN_LIMIT, ANIMAL_CHESS_WIN_REWARD } from '@/config/gameBalance'

/** 按域派生的选择器：斗兽棋「今日次数」记账部分（沿用 useFocusStore 的写法） */
export function useAnimalChessStore() {
  const animalChessWins = useGameStore((s) => s.state.animalChessWins)
  const recordAnimalChessResult = useGameStore((s) => s.recordAnimalChessResult)

  return {
    winsToday: countAnimalChessWinsToday(animalChessWins),
    dailyLimit: ANIMAL_CHESS_DAILY_WIN_LIMIT,
    rewardPerWin: ANIMAL_CHESS_WIN_REWARD,
    recordAnimalChessResult,
  }
}
