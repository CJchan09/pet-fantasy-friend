import { create } from 'zustand'
import { STORAGE_KEY as SAVE_STORAGE_KEY } from '@/storage/localStorageAdapter'

const GATE_STORAGE_KEY = 'pet-fantasy-friend:language-chosen'

interface LanguageGateStore {
  hasChosenLanguage: boolean
  chooseLanguage: () => void
}

/**
 * 首次进入 App 最前面先问语言（CJ 2026-08-19 反馈）——独立于 useGameStore/登录状态之外，
 * 因为语言要在登录墙之前就问清楚，不能等游戏存档或账号状态就绪之后才知道。
 * 老用户（这台设备已经有游戏存档）直接跳过，不会被这个新加的一步打断。
 */
export const useLanguageGateStore = create<LanguageGateStore>((set) => ({
  hasChosenLanguage:
    localStorage.getItem(GATE_STORAGE_KEY) === 'true' ||
    localStorage.getItem(SAVE_STORAGE_KEY) !== null,
  chooseLanguage: () => {
    localStorage.setItem(GATE_STORAGE_KEY, 'true')
    set({ hasChosenLanguage: true })
  },
}))
